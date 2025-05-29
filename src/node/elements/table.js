import * as Logging from '../../utils/logging.js';

export default class Table {
  constructor({
    config,
    DOM,
    node,
    selector,
  }) {
    // * From config:
    this._debug = config.debugMode ? { ...config.debugConfig.table } : {};
    // * Private
    this._DOM = DOM;
    this._selector = selector;
    this._node = node;

    this._splitLabelHeightFromConfig = config.splitLabelHeight;

    // Table splitting constraints and constants
    this._initConstants();

    // https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browsers
    // Firefox 1.0+
    // https://bugzilla.mozilla.org/show_bug.cgi?id=820891
    // * Reason: caption is considered as an external element
    // * and is not taken into account in calculation
    // * of offset parameters of table rows.
    this._isFirefox = typeof InstallTrigger !== 'undefined';

    Object.assign(this, Logging);

    // ** sets current parameters to undefined
    this._resetCurrent();
  }

  split(_table, _pageBottom, _fullPageHeight, _root) {
    this._setCurrent(_table, _pageBottom, _fullPageHeight, _root);
    const splits = this._splitCurrentTable();
    this._resetCurrent();
    return splits;
  }

  // ⚙️ Preparation Methods

  _initConstants() {
    // Table splitting constraints

    // TODO make function
    // * From config:
    // - if null is set - the element is not created in createSignpost().
    this._signpostHeight = parseFloat(this._splitLabelHeightFromConfig) || 0;

    this._minLeftRows = 1; // Minimum number of rows left on the first part
    this._minDanglingRows = 1; // Minimum number of rows left on the last part
    this._minBreakableRows = 1; // Minimum rows required for breaking
    // TODO move to paragraph
    this._minBreakableLines = 4; // Minimum lines required for breaking inside a row
    this._minPartLines = 2; // Minimum lines required for a row part

  }

  _resetCurrent() {
    // ** current Table parameters passed from outside
    this._currentTable = undefined;
    this._currentFirstPageBottom = undefined;
    this._currentFullPageHeight = undefined;
    this._currentRoot = undefined;
    // ** current Table parameters calculated during preparation
    this._currentTableEntries = undefined;
    this._currentTableDistributedRows = undefined;
    this._currentTableCaptionFirefoxAmendment = undefined;
    this._currentTableFirstPartContentBottom = undefined;
    this._currentTableFullPartContentHeight = undefined;
    // ** current Table parameters updated dynamically during splitting
    this._currentTableSplitBottom = undefined;
    this._logSplitBottom_ = [];
  }

  _setCurrent(_table, _pageBottom, _fullPageHeight, _root) {
    this._currentTable = _table;
    this._currentFirstPageBottom = _pageBottom;
    this._currentFullPageHeight = _fullPageHeight;
    this._currentRoot = _root;
  }

  _prepareTableForSplitting() {
    this._lockCurrentTableWidths();
    this._collectCurrentTableEntries();
    this._collectCurrentTableAndEntriesMetrics();
    this._updateCurrentTableDistributedRows();
  }

  // 🪓 The basic logic of splitting:

  // TODO test more complex tables
  _splitCurrentTable() {

    // * Split simple tables, without regard to col-span and the like.
    this._debug._ && console.group('%c🧮 _splitCurrentTable()', 'background:cyan', {table: this._currentTable, root: this._currentRoot});

    this._prepareTableForSplitting();

    // * Calculate Table Splits Ids

    let splitsIds = [];
    this._updateCurrentTableSplitBottom(
      this._currentTableFirstPartContentBottom,
      'added this._currentTableFirstPartContentBottom'
    );
    // this._currentTableSplitBottom = this._currentTableFirstPartContentBottom;
    // this._logSplitBottom_.push(this._currentTableSplitBottom);

    this._debug._ && console.log(
      `%c currentTableSplitBottom = ${this._currentTableSplitBottom} \n splits: ${splitsIds.length}`,
      'font-weight: bold; color: blue; background: yellow;',
      this._logSplitBottom_
    );

    //? Debug: gap between rows (row[1].top - row[0].bottom)
    this._debug._ && console.log(
      this._node.getTop(this._currentTableDistributedRows[1], this._currentTable) - this._node.getBottom(this._currentTableDistributedRows[0], this._currentTable),
      '= (row[1].top - row[0].bottom)',
    )

    this._handleShortFirstPartCase();

    for (let index = 0; index < this._currentTableDistributedRows.length; index++) {
      // Walk through table rows to find where to split.
      // _processRow() can move index back to recheck newly inserted rows after splitting.
      index = this._processRow(index, splitsIds);
    };

    this._debug._ && console.log(
      '\n splitsIds', splitsIds,
      '\n Distributed Rows', [...this._currentTableDistributedRows]
    );

    if (!splitsIds.length) {
      this.logGroupEnd(`_splitCurrentTable !splitsIds.length`);
      return []
    }

    // * avoid < minDanglingRows rows on last page
    // ! this._currentTableDistributedRows модифицировано

    // TODO
    // * decide if the selected table will look good or if there will be very short parts:
    // const maxSplittingId = (this._currentTableDistributedRows.length - 1) - this._minDanglingRows;
    // if (splitsIds[splitsIds.length - 1] > maxSplittingId) {
    //   splitsIds[splitsIds.length - 1] = maxSplittingId;
    // }

    const splits = splitsIds.map((endId, index, array) => {
      const startId = index > 0 ? array[index - 1] : 0;
      return this._insertTableSplit({
        startId: startId,
        endId: endId,
        table: this._currentTable,
        tableEntries: this._currentTableEntries,
      });
    })

    this._debug._ && console.log(
      'splits', splits
    );

    // create LAST PART
    const lastPart = this._node.createWithFlagNoBreak();
    this._currentTable.before(lastPart);
    this._DOM.insertAtEnd(
      lastPart,
      this._node.createSignpost('(table continued)', this._signpostHeight),
      this._currentTable
    );

    console.log(lastPart)

    this.logGroupEnd(`_splitCurrentTable`);

    return [...splits, lastPart]
  }

  _handleShortFirstPartCase() {
    // * SPECIAL CASE: SHORT FIRST PART
    if (this._node.getTop(this._currentTableDistributedRows[0], this._currentTable) > this._currentTableSplitBottom) {
      // * If the beginning of the first line is immediately on the second page
      // * then even the header doesn't fit.
      // * Go immediately to the second page, update the split bottom.
      this._updateCurrentTableSplitBottom(
        this._currentTableFullPartContentHeight,
        "* SPECIAL CASE: SHORT FIRST PART\
        \n If the beginning of the first line is immediately on the second page\
        \n then even the header doesn't fit.\
        \n Go immediately to the second page, update the split bottom."
      );
      this._debug._ && console.log(`The Row 0 goes to the 2nd page`);
    }
  }

  _processRow(rowIndex, splitsIds) {
    const currentRow = this._currentTableDistributedRows[rowIndex];
    const currRowHeight = this._DOM.getElementOffsetHeight(currentRow);
    const isNoBreak = this._node.isNoBreak(currentRow);

    this._debug._ && console.log(
      `🟪 %c Check the Row # ${rowIndex} (from ${this._currentTableDistributedRows.length})`, 'color:white;background:blueviolet',
      '\n', [ currentRow ],
      '\nfrom\n', [...this._currentTableDistributedRows]
    );

    if (!this._isCurrentRowFits(rowIndex)) {
      // * If the end of the row is on the second page
      // * TRY TO SPLIT CURRENT ROW
      this._debug._ && console.log(`%c • Current row does not fit, TRY TO SPLIT it!`, 'color:black;background:orange');

      const currEmptyRowHeight = this._getRowHeight(currentRow);
      const rowFullPageHeight = this._currentTableFullPartContentHeight - currEmptyRowHeight;

      if (!isNoBreak) {
        // * Let's split table row [rowIndex]

        const currRowTop = this._node.getTop(currentRow, this._currentTable) + this._currentTableCaptionFirefoxAmendment;
        const rowFirstPartHeight = this._getRemainingSpaceForRow(currentRow, currRowTop, currEmptyRowHeight);

        this._debug._ && console.groupCollapsed(
          `🟣 Split The ROW ${rowIndex} (from ${this._currentTableDistributedRows.length})`,
          {
            currRowTop,
            '🟪 splitBottom': this._currentTableSplitBottom,
            '• is breakable?': !isNoBreak,
            currEmptyRowHeight,
            rowFirstPartHeight,
            rowFullPageHeight,
          },
        );

        const theNewRows = this._splitTableRow(
          rowIndex,
          currentRow,
          rowFirstPartHeight,
          rowFullPageHeight,
        );
        this._debug._ && console.log('%c🟣 theNewRows \n', 'color:blueviolet; font-weight:bold', theNewRows);

        if (theNewRows.length) {

          this._debug._ && console.log('🟣 currentRow', currentRow, '\n💟 theNewRows.length', theNewRows.length);

          this._replaceRowInDOM(currentRow, theNewRows);
          this._updateCurrentTableEntriesAfterSplit(rowIndex, theNewRows);
          this._updateCurrentTableDistributedRows();

          this._debug._ && console.log('💟 old rowIndex', rowIndex);
          // To check all the split pieces anew:
          rowIndex -= 1;
          this._debug._ && console.log('💟 updated rowIndex', rowIndex);

        } //? END OF ifThereIsSplit
        else {

          this._debug._ && console.log('🟠',
            '\n We tried splitting the ROW, but it didn`t work.',
            `(ROW.${rowIndex})`, this._currentTableDistributedRows[rowIndex],);

          // this._updateCurrentTableSplitBottom(
          //   this._currentTableDistributedRows[rowIndex],
          //   "Row does not fit;\
          //   \n We tried splitting the ROW, but it didn`t work\
          //   \n add rowIndex -= 1"
          // );
          rowIndex -= 1;

          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO
          // TODO

          // todo что-то тут не так - если мы не разбили длинную строку - просто перелистываем? нет нет
        }

        this.logGroupEnd(`🟣 Split The ROW ${rowIndex} (from ${this._currentTableDistributedRows.length}) (...if canSplitRow)`);
      } else { // isNoBreak

        this._debug._ && isNoBreak && console.log(
          `%c • Row # ${rowIndex}: is noBreak`, 'color:red', currentRow,
        );

        if(currRowHeight > this._currentTableFullPartContentHeight) {
          console.log('%c SUPER BIG', 'background:red;color:white', currRowHeight, '>', this._currentTableFullPartContentHeight);
        }


        // TODO проверять это ТОЛЬКО если мы не можем разбить
        if (rowIndex >= this._minLeftRows) {
          // * avoid < minLeftRows rows on first page
          // *** If a table row starts in the next part,
          // *** register the previous one as the beginning of the next part.
          // *** In the other case, we do not register a page break,
          // *** and the first small piece will be skipped.
          splitsIds.push(rowIndex);
          this._debug._ && console.log(
            `%c • Row # ${rowIndex}: REGISTER as start, rowIndex >= ${this._minLeftRows} (_minLeftRows) `, 'color:blueviolet',
            currentRow
          );
        }

        this._updateCurrentTableSplitBottom(
          this._currentTableDistributedRows[rowIndex],
          "Row does not fit AND Row isNoBreak\
            \n "
        );
      }


       //? END OF trying to split long TR


      // check if next fits

    } else {
      // currRowTop <= this._currentTableSplitBottom
      // pass
      this._debug._ && console.log(
        `%c • Row # ${rowIndex}: PASS ...`, 'color:blueviolet;background:yellowgreen',
      );
    }

    return rowIndex;
  }

  // !isCurrentRowFits
  // if (canSplitRow)
  _splitTableRow(
    splittingRowIndex,
    splittingRow,
    rowFirstPartHeight,
    rowFullPageHeight,
  ) {

    //* The splitting row and each clone gets the flag:
    this._node.setFlagNoBreak(splittingRow);

    const splittingRowTDs = this._DOM.getChildren(splittingRow);

    let innerTDSplitterArrayOfArray = [...splittingRowTDs]
    .map((td, ind) => {
      this._debug._ && console.groupCollapsed(
        `(•) Split TD.${ind} in ROW.${splittingRowIndex}`
      );

      // FIXME
      // const tdChildren = this._node.getPreparedChildren(td);
      const tdChildren = this._node.getSplitChildren(td, rowFirstPartHeight, rowFullPageHeight, splittingRow);

      const tdInternalSplitters = this._node.getSplitPoints({
        rootNode: td,
        children: tdChildren,
        firstPartHeight: rowFirstPartHeight,
        fullPageHeight: rowFullPageHeight,
      });

      this._debug._ && console.log(`(•) return tdInternalSplitters for ROW.${splittingRowIndex} / TD#${ind}`, tdInternalSplitters);

      this._debug._ && console.groupEnd(
        `(•) Split TD.${ind} in ROW.${splittingRowIndex}`
      );

      return tdInternalSplitters
    });

    this._debug._ && console.log(
      '🟣🟣🟣 \n innerTDSplitterArrayOfArray',
      innerTDSplitterArrayOfArray
    );

    const shouldFirstPartBeSkipped = innerTDSplitterArrayOfArray.some(obj => {
      return (obj.length && obj[0] === null)
    });

    if(shouldFirstPartBeSkipped) {
      innerTDSplitterArrayOfArray = [...splittingRowTDs]
      .map((td, ind) => {
        // FIXME
        // const tdChildren = this._node.getPreparedChildren(td);
        const tdChildren = this._node.getSplitChildren(td, rowFirstPartHeight, rowFullPageHeight, splittingRow);
        this._debug._ && console.groupCollapsed(`(••) Split TD.${ind} in ROW.${splittingRowIndex}`);
        const tdInternalSplitters = this._node.getSplitPoints({
          rootNode: td,
          children: tdChildren,
          firstPartHeight: rowFullPageHeight,
          fullPageHeight: rowFullPageHeight,
        });
        this._debug._ && console.log(`(••) return tdInternalSplitters for ROW.${splittingRowIndex} / TD#${ind}`, tdInternalSplitters);
        this._debug._ && console.groupEnd(`(••) Split TD.${ind} in ROW.${splittingRowIndex}`);
        return tdInternalSplitters
      });
    }

    // добавить в tdInternalSplitters нулевой элемент
    // но также считать "первый пустой кусок"

    this._debug._ && console.log(
      '🟣🟣🟣',
      '\n innerTDSplitterArrayOfArray(*)',
      innerTDSplitterArrayOfArray
    );





    // Есть ли точки разбиения - будем ли мы создавать новые строки

    const ifThereIsSplit = innerTDSplitterArrayOfArray.some(obj => {
      return obj.length
    });
    this._debug._ && console.log('🟣🟣🟢 ifThereIsSplit', ifThereIsSplit);



    const theNewRows = [];

    if (ifThereIsSplit) {

      // const theTdWithContentArray = innerTDSplitterArrayOfArray
      // .map((splittersInTD, tdId) => {
      //   const currentTD = [...splittingRowTDs][tdId];
      //   this._debug._ && console.log('🟢 tdId / splittersInTD', tdId, splittersInTD);

      //   // *  | i | startElement | endElement
      //   // *  | 0 | undefined    | A
      //   // *  | 1 | A            | B
      //   // *  | 2 | B            | undefined <- last part

      //   if (splittersInTD.length) {
      //     const parts = [];

      //     for (let i = 0; i <= splittersInTD.length; i++) {
      //       const startElement = splittersInTD[i - 1]; // undefined for first part
      //       const endElement = splittersInTD[i];       // undefined for last part
      //       const part = this._node.cloneAndCleanOutsideRange(currentTD, startElement, endElement);
      //       parts.push(part);
      //     }

      //     return parts;
      //   } else {
      //     // * arr.length === 0
      //     // один раз полностью копируем весь TD

      //     return [this._DOM.cloneNode(currentTD)] // TODO test this
      //   }
      // });

      const theTdWithContentArray = [...splittingRowTDs].map(td => {
        return this._node.sliceNodeContentBySplitPoints({
          rootNode: td,
          splitPoints,
        });
      });

      this._debug._ && console.log('🟣 theTdWithContentArray', theTdWithContentArray);

      const theNewTrCount = Math.max(...theTdWithContentArray.map(arr => arr.length));
      this._debug._ && console.log('🟣 theNewTrCount', theNewTrCount);

      for (let i = 0; i < theNewTrCount; i++) {
        const rowWrapper = this._DOM.cloneNodeWrapper(splittingRow);
        this._DOM.setAttribute(rowWrapper, `.splitted_row_${splittingRowIndex}_part_${i}`);

        [...splittingRowTDs].forEach(
          (td, tdID) => {
            const content = theTdWithContentArray[tdID][i];
            const newTD = this._DOM.cloneNodeWrapper(td);
            if (content) this._DOM.insertAtEnd(newTD, content);
            this._DOM.insertAtEnd(rowWrapper, newTD);
          }
        );

        theNewRows.push(rowWrapper);
      }

    } else {

      // rowFullPageHeight
      this._debug._ && console.log('🔴 There in no Split');
    }

    return theNewRows;





















  }






























  // 📐 Metric Functions:

  _collectCurrentTableEntries() {
    this._currentTableEntries = this._getTableEntries(this._currentTable);
  }

  _collectCurrentTableAndEntriesMetrics() {
    // Prepare node parameters

    // * Calculate table wrapper (empty table element) height
    // * to calculate the available space for table content
    const tableWrapperHeight = this._node.getEmptyNodeHeight(this._currentTable, '<tr><td></td></tr>');

    // * getTopWithMargin vs getTop
    // * The margin must be taken into account,
    // * because it is included in the calculation of the tableWrapperHeight
    // * and will be subtracted when calculating the first internal part of the table.
    const tableTopWithTopMargin = this._node.getTopWithMargin(this._currentTable, this._currentRoot);

    // const tableHeight = this._DOM.getElementOffsetHeight(this._currentTable);
    const tableCaptionHeight = this._DOM.getElementOffsetHeight(this._currentTableEntries.caption) || 0;
    const tableTheadHeight = this._DOM.getElementOffsetHeight(this._currentTableEntries.thead) || 0;
    const tableTfootHeight = this._DOM.getElementOffsetHeight(this._currentTableEntries.tfoot) || 0;

    // *** Convert NULL/Undefined to 0.
    // *** Nullish coalescing assignment (??=), Nullish coalescing operator (??)
    this._currentTableCaptionFirefoxAmendment = (tableCaptionHeight ?? 0) * (this._isFirefox ?? 0);

    this._currentTableFirstPartContentBottom = this._currentFirstPageBottom
      - tableTopWithTopMargin
      - tableWrapperHeight
      - this._signpostHeight;

    this._currentTableFullPartContentHeight = this._currentFullPageHeight
      - tableCaptionHeight // * copied into each part
      - tableTheadHeight // * copied into each part
      - tableTfootHeight // * remains in the last part (in the table)
      - tableWrapperHeight
      - 2 * this._signpostHeight;

    this._debug._ && console.groupCollapsed(
      'Table constrains: \n',
      '•', this._currentTableFirstPartContentBottom, 'TableFirstContentPartBottom', '\n',
      '•', this._currentTableFullPartContentHeight, 'TableFullPartContentHeight', '\n',
      '\n',
    );
    this._debug._ && console.log(
      '•',
      this._currentTableFirstPartContentBottom, 'TableFirstPartContentHeight', '\n',
      '=', '\n',
      this._currentFirstPageBottom, 'PageBottom', '\n',
      '-', tableTopWithTopMargin,' tableTop(WithTopMargin)', '\n',
      '-', tableCaptionHeight,' tableCaptionHeight', '\n',
      '-', tableTheadHeight,' tableTheadHeight', '\n',
      '-', tableWrapperHeight,' tableWrapperHeight', '\n',
      '-', this._signpostHeight,' this._signpostHeight', '\n',
    );
    this._debug._ && console.log(
      '•',
      this._currentTableFullPartContentHeight, 'tableFullPartContentHeight', '\n',
      '=', '\n',
      this._currentFullPageHeight, 'FullPageHeight', '\n',
      '-', tableCaptionHeight, 'tableCaptionHeight', '\n',
      '-', tableTheadHeight, 'tableTheadHeight', '\n',
      '-', tableTfootHeight, 'tableTfootHeight', '\n',
      '-', (2 * this._signpostHeight), '2 * this._signpostHeight', '\n',
      '-', tableWrapperHeight, 'tableWrapperHeight', '\n',
    );
    this._debug._ && console.groupEnd();
  }

  _updateCurrentTableDistributedRows() {
    // * Rows that we distribute across the partitioned table
    this._currentTableDistributedRows = this._getDistributedRows(this._currentTableEntries);
    this._debug._ && console.log('%c Distributed Rows: \n', 'color:violet;font-weight:bold', this._currentTableDistributedRows);
  }

  _updateCurrentTableEntriesAfterSplit(index, newRows) {
    this._currentTableEntries.rows.splice(index, 1, ...newRows);
  }

  _replaceRowInDOM(row, newRows) {
    this._DOM.setAttribute(row, '.🚫_must_be_removed'); // for test, must be removed
    this._DOM.insertInsteadOf(row, ...newRows);
  }

  _updateCurrentTableSplitBottom(elementOrValue, message = 'unknown case') {
    // Can take a numeric value or
    // an element to calculate a numeric value

    const _loggedPrevTableSplitBottom = this._currentTableSplitBottom;

    if (typeof elementOrValue === 'number') {
      // If it is a number, just assign it to
      this._currentTableSplitBottom = elementOrValue;
    } else if (elementOrValue instanceof HTMLElement) {
      // If it is an element - calculate by DOM
      this._currentTableSplitBottom =
        this._node.getTop(elementOrValue, this._currentTable) +
        this._currentTableCaptionFirefoxAmendment +
        this._currentTableFullPartContentHeight;
    } else {
      throw new Error(`_updateCurrentTableSplitBottom: unexpected value type: ${typeof elementOrValue}`);
    }

    this._logSplitBottom_.push(this._currentTableSplitBottom);

    this._debug._ && console.log(
      `%c splitBottom: ${_loggedPrevTableSplitBottom} -> ${this._currentTableSplitBottom} \n ${message}`,
      'padding: 4px; border:2px dotted black; font-weight: bold; color: blue; background: cyan;',
      this._logSplitBottom_,
    );
  }

  // 🧮 Utilities / calculations:

  _isCurrentRowFits(rowIndex) {
    const currentRow = this._currentTableDistributedRows[rowIndex];
    const currRowBottom = this._node.getBottom(currentRow, this._currentTable) + this._currentTableCaptionFirefoxAmendment;
    const nextRow = this._currentTableDistributedRows[rowIndex + 1];
    const nextRowTopOrTableBottom = nextRow
      ? this._node.getTop(nextRow, this._currentTable) + this._currentTableCaptionFirefoxAmendment
      : currRowBottom; // for the last row
    const isCurrentRowFits = nextRowTopOrTableBottom <= this._currentTableSplitBottom;

    this._debug._ && console.log(
      `%c \n isCurrentRowFits? \n ${isCurrentRowFits} ( ${nextRowTopOrTableBottom} <= ${this._currentTableSplitBottom} ) \n`,
      'color:blueviolet;font-weight:bold;'
    );

    return isCurrentRowFits;
  }

  _getRemainingSpaceForRow(row, rowTop, emptyRowHeight) {
    // ** check how much space is left on the current page
    let remainingSpaceForTheRow = this._currentTableSplitBottom - rowTop - emptyRowHeight;
    this._debug._ && console.log(
      `%c space for row: ${remainingSpaceForTheRow} = ${this._currentTableSplitBottom} - ${rowTop} - ${emptyRowHeight}`,
      'color:green'
    );

    const _minMeaningfulRowSpace = this._getRowHeight(row, this._minPartLines); // ? paragraph inside
    // const isEnoughSpaceToSplit = remainingSpaceForTheRow >= _minMeaningfulRowSpace;
    if (remainingSpaceForTheRow < _minMeaningfulRowSpace) {
      this._debug._ && console.log(
        `%c remainingSpaceForTheRow ${remainingSpaceForTheRow}`,
        'color:red',
      `< ${_minMeaningfulRowSpace} (_minMeaningfulRowSpace) And we are going to the "full page size"`);

      remainingSpaceForTheRow = this._currentTableFullPartContentHeight - emptyRowHeight;
    }

    return remainingSpaceForTheRow;
  }

  _getRowHeight(tr, num = 0) {
    // Create an empty row by cloning the TR, insert it into the table,
    // * add the specified number of lines to it (num),
    // and detect its actual height through the delta
    // of the tops of the TR following it.
    const initialTop = this._DOM.getElementOffsetTop(tr);
    const clone = this._DOM.cloneNode(tr);
    const text = '!<br />'.repeat(num);
    [...clone.children].forEach(td => this._DOM.setInnerHTML(td, text));
    this._DOM.insertBefore(tr, clone);
    const endTop = this._DOM.getElementOffsetTop(tr);
    this._DOM.removeNode(clone);
    return endTop - initialTop;
  }

  _lockTableWidths(table) {
    this._node.copyNodeWidth(table, table);
    this._DOM.getAll('td', table).forEach(
      td => this._node.copyNodeWidth(td, td)
    )
  }

  _lockCurrentTableWidths() {
    this._lockTableWidths(this._currentTable);
  }

  _getDistributedRows(entries) {
    return [
      ...entries.rows,
      ...(entries.tfoot ? [entries.tfoot] : [])
    ]
  }

  _getTableEntries(table) {

    if (!(table instanceof HTMLElement) || table.tagName !== 'TABLE') {
      throw new Error('Expected a <table> element.');
    }

    const tableEntries = [...table.children].reduce((acc, curr) => {

      const tag = curr.tagName;

      if (tag === 'TBODY') {
        return {
          ...acc,
          rows: [
            ...acc.rows,
            ...curr.children,
          ]
        }
      }

      if (tag === 'CAPTION') {
        this._node.setFlagNoBreak(curr);
        return {
          ...acc,
          caption: curr
        }
      }

      if (tag === 'COLGROUP') {
        this._node.setFlagNoBreak(curr);
        return {
          ...acc,
          colgroup: curr
        }
      }

      if (tag === 'THEAD') {
        this._node.setFlagNoBreak(curr);
        return {
          ...acc,
          thead: curr
        }
      }

      if (tag === 'TFOOT') {
        this._node.setFlagNoBreak(curr);
        return {
          ...acc,
          tfoot: curr
        }
      }

      if (tag === 'TR') {
        return {
          ...acc,
          rows: [
            ...acc.rows,
            ...curr,
          ]
        }
      }

      return {
        ...acc,
        unexpected: [
          ...acc.unexpected,
          // BUG: •Uncaught TypeError: t is not iterable at bundle.js:1:19184
          // curr,
          ...curr,
        ]
      }
    }, {
      caption: null,
      thead: null,
      tfoot: null,
      rows: [],
      unexpected: [],
    });

    if (tableEntries.unexpected.length > 0) {
      this._debug._ && console.warn(`something unexpected is found in the table ${table}`);
    }

    this._debug._ && console.log('Table entries:', tableEntries);

    return tableEntries
  }

  // 🧬 Working with nested blocks:



  // 👪👪👪👪👪👪👪👪👪👪👪👪👪👪👪👪
  _createSlicesBySplitFlag(inputArray) {
    // {
    //   id,
    //   element,
    //   children: [],
    //   split: true | false,
    // }

    this._debug._ && console.group(`_createSlicesBySplitFlag`);

    const sliceWrapper = this._node.createWithFlagNoBreak();
    this._DOM.setStyles(sliceWrapper, { display: 'contents' });
    sliceWrapper.classList.add("🧰");

    // *** иниццируем для первого элемента оболочку sliceWrapper
    const slices = [sliceWrapper];
    let wrappers = [sliceWrapper]; // Реальные элементы, нужно клонировать массив для нового
    let currentTargetInSlice = sliceWrapper;

    const createWrapperFromArray = (array) => {
      if (array.length === 0) {
        return null;
      }

      const wrapper = array[0];
      let currentWrapper = wrapper;

      for (let i = 1; i < array.length; i++) {
        const child = array[i];
        this._DOM.insertAtEnd(currentWrapper, child);
        currentWrapper = child;
      }

      this._debug._ && console.log(' createWrapperFromArray:', wrapper);
      return wrapper;
    }

    const processChildren = (children, parent = null) => {
      this._debug._ && console.group('processChildren');
      this._debug._ && console.log('*start* children', children)

      for (let i = 0; i < children.length; i++) {
        processObj(children[i]);
      }

      this._debug._ && console.log('- wrappers BEFORE pop:', [...wrappers]);
      const a = wrappers.pop();
      this._debug._ && console.log('- wrappers.pop()', a);
      this._debug._ && console.log('- parent', parent);
      this._debug._ && console.log('- wrappers AFTER pop:', [...wrappers]);

      currentTargetInSlice = wrappers.at(-1);
      // TODO сделать функцию
      this._debug._ && console.log('🎯🎯 currentTargetInSlice', currentTargetInSlice)
      this._debug._ && console.log('🎯 wrappers.at(-1)', wrappers.at(-1))
      this._debug._ && console.log('*END* children', children)

      this.logGroupEnd(`processChildren`);
    }

    const processObj = (obj) => {

      const hasChildren = obj.children?.length > 0;
      const hasSplitFlag = obj.split;
      const currentElement = obj.element;
      const id = obj.id;

      this._debug._ && console.group(`processObj # ${id}`); // Collapsed
      this._debug._ && console.log('currentElement', currentElement);
      currentElement && this._DOM.removeNode(currentElement);

      if(hasSplitFlag) {
        this._debug._ && console.log('••• hasSplitFlag');
        // start new object
        // const currentWrapper = slices.at(-1);
        // const nextWrapper = this._DOM.cloneNode(currentWrapper);
        wrappers = wrappers.map(wrapper => {
          const clone = this._DOM.cloneNodeWrapper(wrapper); // ???? может делать клоны не тут а при создании?
          clone.classList.add("🚩");
          return clone
        });
        this._debug._ && console.log('• hasSplitFlag: NEW wrappers.map:', [...wrappers]);
        const nextWrapper = createWrapperFromArray(wrappers);

        slices.push(nextWrapper);
        this._debug._ && console.log('• hasSplitFlag: slices.push(nextWrapper):', [...slices]);
        // find container in new object

        currentTargetInSlice = wrappers.at(-1);
        this._debug._ && console.log('• hasSplitFlag: currentTargetInSlice:', currentTargetInSlice);
      }

      // TODO проверить, когда есть оба флага

      if(hasChildren) {
        this._debug._ && console.log('••• hasChildren');
        // make new wrapper
        const cloneCurrentElementWrapper = this._DOM.cloneNodeWrapper(currentElement);

        // add cloneCurrentElementWrapper to wrappers
        wrappers.push(cloneCurrentElementWrapper); // ???????????

        this._debug._ && console.log('• hasChildren: wrappers.push(cloneCurrentElementWrapper)', cloneCurrentElementWrapper, [...wrappers]);
        // add cloneCurrentElementWrapper to slice
        this._debug._ && console.log('• hasChildren: currentTargetInSlice (check):', currentTargetInSlice);

        if(currentTargetInSlice) {
          this._debug._ && console.log('• hasChildren: currentTargetInSlice', 'TRUE, add to existing', cloneCurrentElementWrapper);
          // add to existing as a child
          this._DOM.insertAtEnd(currentTargetInSlice, cloneCurrentElementWrapper);
        } else {
          this._debug._ && console.log('• hasChildren: currentTargetInSlice', 'FALSE, init the first', cloneCurrentElementWrapper);
          // init the first
          cloneCurrentElementWrapper.classList.add('🏁first');

          this._DOM.setStyles(cloneCurrentElementWrapper, { background: 'yellow' });
          slices.push(cloneCurrentElementWrapper);
          this._debug._ && console.log('• hasChildren: slices.push(cloneCurrentElementWrapper)', cloneCurrentElementWrapper, [...slices]);
        }
        // update wrapper bookmark
        currentTargetInSlice = wrappers.at(-1) // = cloneCurrentElementWrapper
        this._debug._ && console.log('• hasChildren:  currentTargetInSlice (=):', currentTargetInSlice);


        processChildren(obj.children, currentElement);

      } else { // !!! внесли под ELSE

        // insert current Element
        currentTargetInSlice = wrappers.at(-1);
        this._debug._ && console.log('insert currentElement', currentElement, 'to target', currentTargetInSlice);
        this._DOM.insertAtEnd(currentTargetInSlice, currentElement);
      }

      this.logGroupEnd(`processObj # ${id}`);
    }

    this._debug._ && console.log('#######  currentTargetInSlice (=):', currentTargetInSlice);

    processChildren(inputArray);

    this._debug._ && console.log('slices:', slices)
    this._debug._ && slices.forEach(slice => console.log('slice:', slice))

    this.logGroupEnd(`_createSlicesBySplitFlag`);
    return slices
  }

  _insertTableSplit({ startId, endId, table, tableEntries }) {

    // this._debug._ && console.log(`=> _insertTableSplit(${startId}, ${endId})`);

    const tableWrapper = this._DOM.cloneNodeWrapper(table);

    const partEntries = tableEntries.rows.slice(startId, endId);

    const part = this._node.createWithFlagNoBreak();
    table.before(part);

    if (startId) {
      // if is not first part
      this._DOM.insertAtEnd(part, this._node.createSignpost('(table continued)', this._signpostHeight));
    }

    this._DOM.insertAtEnd(
      part,
      this._node.createTable({
        wrapper: tableWrapper,
        colgroup: this._DOM.cloneNode(tableEntries.colgroup),
        caption: this._DOM.cloneNode(tableEntries.caption),
        thead: this._DOM.cloneNode(tableEntries.thead),
        // tfoot,
        tbody: partEntries,
      }),
      this._node.createSignpost('(table continues on the next page)', this._signpostHeight)
    );

    return part
  };

}
