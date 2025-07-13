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
    this._assert = config.consoleAssert ? true : false;

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

    // TODO move to paragraph
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
    this._updateCurrentTableDistributedRows();
    this._collectCurrentTableMetrics();
  }

  // 🪓 The basic logic of splitting:

  // TODO test more complex tables
  _splitCurrentTable() {
    // FIXME: Split simple tables, without regard to col-span and the like.

    this._prepareTableForSplitting();
    this._debug._ && console.group('%c📊 _splitCurrentTable()', 'color:green; background:#eee; padding:3px',
      '\n•', this._currentTableFirstPartContentBottom, '(1st bottom)',
      '\n•', this._currentTableFullPartContentHeight, '(full part height)',
      {
        table: this._currentTable,
        rows: this._currentTableDistributedRows,
        entries: this._currentTableEntries,
        root: this._currentRoot,
      },
    );

    // * start with a short first part or immediately from the full height of the page:
    this._setCurrentTableFirstSplitBottom();

    // * Calculate Table Splits Ids
    let splitsIds = [];

    for (let index = 0; index < this._currentTableDistributedRows.length; index++) {
      // * Walk through table rows to find where to split.
      // * _processRow() can move index back to recheck newly inserted rows after splitting.
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

    // ! this._currentTableDistributedRows модифицировано

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

  _processRow(rowIndex, splitsIds) {
    const origRowIndex = rowIndex;
    const origRowCount = this._currentTableDistributedRows.length;
    this._debug._ && console.group(`🔲 %c Check the Row # ${origRowIndex} (from ${origRowCount})`, '',);

    const currentRow = this._currentTableDistributedRows[rowIndex];
    const currRowHeight = this._DOM.getElementOffsetHeight(currentRow);
    const isNoBreak = this._node.isNoBreak(currentRow);

    this._debug._ && console.info(
      {
        row: currentRow,
        rows: [...this._currentTableDistributedRows]
      }
    );

    if (this._isCurrentRowFits(rowIndex)) {
      this._debug._ && console.log(`%c ✓ Row # ${rowIndex}: PASS`, 'color:green'); // background:#CCFF00
    } else {
      // * currRowTop => this._currentTableSplitBottom
      // * If the end of the row is on the second page
      // * TRY TO SPLIT CURRENT ROW

      if (!isNoBreak) {
        // * Let's split table row [rowIndex]
        this._debug._ && console.group( // Collapsed
          `%c 🔳 Try to split the ROW ${rowIndex} %c (from ${this._currentTableDistributedRows.length})`, 'color:magenta;', ''
        );

        const currEmptyRowHeight = this._node.getTableRowHeight(currentRow);
        const _minMeaningfulRowSpace = this._node.getTableRowHeight(currentRow, this._minPartLines); // ? paragraph inside
        const rowFullPageHeight = this._currentTableFullPartContentHeight - currEmptyRowHeight;
        const currRowTop = this._node.getTop(currentRow, this._currentTable) + this._currentTableCaptionFirefoxAmendment;
        let rowFirstPartHeight = this._currentTableSplitBottom - currRowTop - currEmptyRowHeight;
        if (rowFirstPartHeight < _minMeaningfulRowSpace) {
          this._debug._ && console.log(
            `%c ${rowFirstPartHeight} < ${_minMeaningfulRowSpace} %c (rowFirstPartHeight < _minMeaningfulRowSpace) And we are going to the "full page size"`,
            'color:red; font-weight:bold; background:#F1E9D2', '',
          );
          rowFirstPartHeight = rowFullPageHeight;
        }

        this._debug._ && console.info(
          [currentRow],
          {
            currRowTop,
            '• splitBottom': this._currentTableSplitBottom,
            '• is breakable?': !isNoBreak,
            currEmptyRowHeight,
            rowFirstPartHeight,
            rowFullPageHeight,
          },
        );

        const newRows = this._splitTableRow(
          rowIndex,
          currentRow,
          rowFirstPartHeight,
          rowFullPageHeight,
        );
        this._debug._ && console.log('%c newRows \n', 'color:magenta; font-weight:bold', newRows);

        if (newRows.length) {
          // * Update the DOM and state with the new table rows.
          this._replaceRowInDOM(currentRow, newRows);
          this._updateCurrentTableEntriesAfterSplit(rowIndex, newRows);
          this._updateCurrentTableDistributedRows();

          // * To check all new parts over again, we take a step back.
          // * Then, in the loop, we will start checking again
          // * from the same index that the split node had before.
          rowIndex -= 1;

        } else {

          this._debug._ && console.log(
            `%c The row is not split. (ROW.${rowIndex})`, 'color:orange', this._currentTableDistributedRows[rowIndex],);

          rowIndex -= 1;

          // TODO
          // todo что-то тут не так - если мы не разбили длинную строку - просто перелистываем? нет нет
        }

        this.logGroupEnd(`🔳 Try to split the ROW ${rowIndex} (from ${this._currentTableDistributedRows.length}) (...if canSplitRow)`);
      } else { // isNoBreak

        this._debug._ && isNoBreak && console.log(
          `%c Row # ${rowIndex} is noBreak`, 'color:DarkOrange; font-weight:bold', currentRow,
        );

        if(currRowHeight > this._currentTableFullPartContentHeight) {
          // TODO: transform content
          console.warn('%c SUPER BIG', 'background:red;color:white', currRowHeight, '>', this._currentTableFullPartContentHeight);
        }

        splitsIds.push(rowIndex);
        this._debug._ && console.log(`%c 📍 Row # ${rowIndex} registered as page start`, 'color:green; font-weight:bold');

        this._updateCurrentTableSplitBottom(this._currentTableDistributedRows[rowIndex], "Row does not fit AND Row isNoBreak");
      }
    }

    this.logGroupEnd(`Row # ${origRowIndex} (from ${origRowCount}) is checked`);
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

    this._debug._ && console.group( // Collapsed
      `%c ➗ Split the ROW ${splittingRowIndex}`, 'color:magenta;', ''
    );

    //* The splitting row and each clone gets the flag:
    this._node.setFlagNoBreak(splittingRow);

    const originalTDs = [...this._DOM.getChildren(splittingRow)];

    let splitPointsPerTD = originalTDs.map((td, ind) => {
      this._debug._ && console.groupCollapsed(`(•) Split TD.${ind} in ROW.${splittingRowIndex}`);

      // 🔁 potential recursion because of getSplitChildren()
      // TODO: test complex nested elements
      const tdChildren = this._node.getSplitChildren(td, rowFirstPartHeight, rowFullPageHeight, splittingRow);

      const tdContentSplitPoints = this._node.getSplitPoints({
        rootNode: td,
        children: tdChildren,
        firstPartHeight: rowFirstPartHeight,
        fullPageHeight: rowFullPageHeight,
      });

      this._debug._ && console.log(`(•) return tdContentSplitPoints for ROW.${splittingRowIndex} / TD#${ind}`, tdContentSplitPoints);

      this._debug._ && console.groupEnd(`(•) Split TD.${ind} in ROW.${splittingRowIndex}`);

      return tdContentSplitPoints
    });

    this._debug._ && console.log('[•] splitPointsPerTD', splitPointsPerTD);

    // * shouldFirstPartBeSkipped?
    // * For example, an image is only placed in a “full-page” fragment,
    // * not in a smaller first fragment. Or the title or first lines
    // * of a paragraph have been moved to the main paragraph in the second fragment.
    const isFirstPartEmptyInAnyTD = splitPointsPerTD.some(obj => {
      return (obj.length && obj[0] === null)
    });

    if(isFirstPartEmptyInAnyTD) {
      splitPointsPerTD = [...originalTDs]
      .map((td, ind) => {
        // FIXME
        // const tdChildren = this._node.getPreparedChildren(td);
        const tdChildren = this._node.getSplitChildren(td, rowFirstPartHeight, rowFullPageHeight, splittingRow);
        this._debug._ && console.groupCollapsed(`(••) Split TD.${ind} in ROW.${splittingRowIndex}`);
        const tdContentSplitPoints = this._node.getSplitPoints({
          rootNode: td,
          children: tdChildren,
          firstPartHeight: rowFullPageHeight,
          fullPageHeight: rowFullPageHeight,
        });
        this._debug._ && console.log(`(••) return tdContentSplitPoints for ROW.${splittingRowIndex} / TD#${ind}`, tdContentSplitPoints);
        this._debug._ && console.groupEnd(`(••) Split TD.${ind} in ROW.${splittingRowIndex}`);
        return tdContentSplitPoints
      });
      this._debug._ && console.log('[••] splitPointsPerTD',splitPointsPerTD);
    }

    // добавить в tdContentSplitPoints нулевой элемент
    // но также считать "первый пустой кусок"


    const newRows = [];
    const ifThereIsSplit = splitPointsPerTD.some(obj => obj.length);
    if (ifThereIsSplit) {

      const slicedTDContentsPerTD = splitPointsPerTD
      .map((splitPoints, index) => {
        const td = originalTDs[index];
        return this._node.sliceNodeContentBySplitPoints({
          rootNode: td,
          splitPoints,
        });
      });

      this._debug._ && console.log('🟣 slicedTDContentsPerTD', slicedTDContentsPerTD);

      const maxSlicesPerTD = Math.max(...slicedTDContentsPerTD.map(arr => arr.length));

      for (let i = 0; i < maxSlicesPerTD; i++) {
        const rowWrapper = this._DOM.cloneNodeWrapper(splittingRow);
        this._DOM.setAttribute(rowWrapper, `.splitted_row_${splittingRowIndex}_part_${i}`);

        [...originalTDs].forEach(
          (td, tdID) => {
            const content = slicedTDContentsPerTD[tdID][i];
            const newTD = this._DOM.cloneNodeWrapper(td);
            if (content) this._DOM.insertAtEnd(newTD, content);
            this._DOM.insertAtEnd(rowWrapper, newTD);
          }
        );

        newRows.push(rowWrapper);
      }

    } else {

      // rowFullPageHeight
      this._debug._ && console.log('🔴 There in no Split');
    }

    this.logGroupEnd(`%c ➗ Split the ROW ${splittingRowIndex}`);

    return newRows;

  }






























  // 📐 Metric Functions:

  _collectCurrentTableEntries() {
    this._currentTableEntries = this._node.getTableEntries(this._currentTable);
  }

  _collectCurrentTableMetrics() {
    // Prepare node parameters

    // * Calculate table wrapper (empty table element) height
    // * to calculate the available space for table content
    const tableWrapperHeight = this._node.getEmptyNodeHeight(this._currentTable); // '<tr><td></td></tr>'

    // * getTopWithMargin vs getTop
    // * The margin must be taken into account,
    // * because it is included in the calculation of the tableWrapperHeight
    // * and will be subtracted when calculating the first internal part of the table.
    const tableTopWithTopMargin = this._node.getTopWithMargin(this._currentTable, this._currentRoot);

    // const tableHeight = this._DOM.getElementOffsetHeight(this._currentTable);
    const tableCaptionHeight = this._DOM.getElementOffsetHeight(this._currentTableEntries.caption) || 0;
    // const tableTheadHeight = this._DOM.getElementOffsetHeight(this._currentTableEntries.thead) || 0;
    const tableTheadHeight = this._DOM.getElementOffsetTop(this._currentTableDistributedRows[0], this._currentTable) - tableCaptionHeight || 0;
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
  }

  _updateCurrentTableDistributedRows() {
    // * Rows that we distribute across the partitioned table
    this._currentTableDistributedRows = this._getDistributedRows(this._currentTableEntries);
  }

  _updateCurrentTableEntriesAfterSplit(index, newRows) {
    this._currentTableEntries.rows.splice(index, 1, ...newRows);
  }

  _replaceRowInDOM(row, newRows) {
    this._DOM.setAttribute(row, '.🚫_must_be_removed'); // for test, must be removed
    this._DOM.insertInsteadOf(row, ...newRows);
  }

  _setCurrentTableFirstSplitBottom() {
    if (this._node.getTop(this._currentTableDistributedRows[0], this._currentTable) > this._currentTableSplitBottom) {
      // * SPECIAL CASE: SHORT FIRST PART:
      // * If the beginning of the first line is immediately on the second page
      // * then even the header doesn't fit.
      // * Go immediately to the second page, update the split bottom.
      this._updateCurrentTableSplitBottom(
        this._currentTableFullPartContentHeight,
        "SPECIAL CASE: start immediately from the full height of the page"
      );
      this._debug._ && console.log(`The Row 0 goes to the 2nd page`);
    } else {
      this._updateCurrentTableSplitBottom(
        this._currentTableFirstPartContentBottom,
        'start with a short first part'
      );
    }
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
      `%c♻️ Update splitBottom (${message})`, 'color: green; font-weight: bold',
      '\n', _loggedPrevTableSplitBottom, '->', this._currentTableSplitBottom,
      `\n _logSplitBottom_: ${this._logSplitBottom_}`, this._logSplitBottom_,
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

    if (isCurrentRowFits) {
      this._debug._ && console.log(
        `%c📐 isCurrentRowFits? %c ${isCurrentRowFits} %c ( ${nextRowTopOrTableBottom} <= ${this._currentTableSplitBottom} )`,
        '', 'font-weight:bold;color:green;', '', //background:#CCFF00
      );
    } else {
      this._debug._ && console.log(
        `%c📐 isCurrentRowFits? %c ${isCurrentRowFits} %c ( ${nextRowTopOrTableBottom} => ${this._currentTableSplitBottom} )`,
        '', 'font-weight:bold;color:red;', '', //background:#FFDDDD
      );
    }


    return isCurrentRowFits;
  }

  _lockCurrentTableWidths() {
    this._node.lockTableWidths(this._currentTable);
  }

  _getDistributedRows(entries) {
    return [
      ...entries.rows,
      ...(entries.tfoot ? [entries.tfoot] : [])
    ]
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
