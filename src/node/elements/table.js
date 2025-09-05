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

  _prepareCurrentTableForSplitting() {
    this._lockCurrentTableWidths();
    this._collectCurrentTableEntries();
    this._updateCurrentTableDistributedRows();
    this._collectCurrentTableMetrics();
  }

  // 🪓 The basic logic of splitting.
  // TODO test more complex tables
  _splitCurrentTable() {

    // * Prepare table.
    this._prepareCurrentTableForSplitting();
    // * Start with a short first part or immediately from the full height of the page.
    this._setCurrentTableFirstSplitBottom();

    // FIXME: It splits simple tables, without regard to col-span and the like.

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

    // * This array collects row indexes where new table parts should start after splitting.
    let splitStartRowIndexes = [];

    // * Walk through table rows to find where to split.
    for (let index = 0; index < this._currentTableDistributedRows.length; index++) {
      // * _evaluateRowForSplitting() may roll back index to re-check newly inserted rows after splitting.
      index = this._evaluateRowForSplitting(index, splitStartRowIndexes);
    };

    this._debug._ && console.log(
      '\n splitStartRowIndexes', splitStartRowIndexes,
      '\n Distributed Rows', [...this._currentTableDistributedRows]
    );

    this._assert && console.assert(
      // 🚨 No 0 indexes. First split cannot start from 0.
      splitStartRowIndexes.every(i => Number.isInteger(i) && i > 0 && i <= this._currentTableDistributedRows.length),
      'splitStartRowIndexes contains invalid indexes'
    );
    this._assert && console.assert(
      // 🚨 Strictly increasing, no duplicates.
      splitStartRowIndexes.every((val, i, arr) => i === 0 || val > arr[i - 1]),
      'splitStartRowIndexes must be strictly ascending and without duplicates'
    );
    this._assert && console.assert(
      // 🚨 Last split must not consume 100% of the table, original must keep rows.
      splitStartRowIndexes.at(-1) !== this._currentTableDistributedRows.length,
      'Last split index should not equal rows.length, or the original table will be empty.'
    );

    if (!splitStartRowIndexes.length) {
      this.logGroupEnd(`_splitCurrentTable !splitStartRowIndexes.length`);
      return []
    }

    // ! this._currentTableDistributedRows модифицировано

    // * Iterate over splitStartRowIndexes.
    // * For each split point: create a new <table> element with its own structure.
    // * Repeated structural elements (colgroup, caption, thead) are cloned.
    // * tbody is newly built from rows between startId and endId (excluding endId).
    // * The original table will contain rows from the last split point to the end,
    // * and will be inserted separately below.
    const splits = splitStartRowIndexes.map((endId, index, array) => {

      // * For the first table part, start from 0 (the first row of the table).
      // * For all subsequent parts, start from the previous split index.
      const startId = index > 0 ? array[index - 1] : 0;

      // * Insert a new table part that will contain rows from startId up to endId (excluding endId).
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

    // * Insert the original table as the last part.
    // * It contains all rows from the last split point to the end.
    const lastPart = this._node.createWithFlagNoBreak();
    this._currentTable.before(lastPart);
    this._DOM.insertAtEnd(
      lastPart,
      this._node.createSignpost('(table continued)', this._signpostHeight),
      this._currentTable
    );

    this._debug._ && console.log('lastPart', lastPart)

    this.logGroupEnd(`_splitCurrentTable`);

    return [...splits, lastPart]
  }

  _evaluateRowForSplitting(rowIndex, splitStartRowIndexes) {
    // * Keep the original parameters for logging.
    const origRowIndex = rowIndex;
    const origRowCount = this._currentTableDistributedRows.length;
    this._debug._ && console.groupCollapsed(`🔲 %c Check the Row # ${origRowIndex} (from ${origRowCount})`, '',);

    // * Start with the row.
    const currentRow = this._currentTableDistributedRows[rowIndex];

    this._debug._ && console.info(
      {
        row: currentRow,
        rows: [...this._currentTableDistributedRows]
      }
    );

    const currentRowFitDelta = this._getRowFitDelta(rowIndex); // nextRowTopOrTableBottom - this._currentTableSplitBottom;
    const _isCurrentRowFits = currentRowFitDelta <= 0;

    if (_isCurrentRowFits) {
      // * evaluate next Row Top OR Table Bottom (for the last row).
      // * This is why the end of the table (the last piece) is not registered
      // * in splitStartRowIndexes — we simply skip it here.
      this._debug._ && console.log(`%c ✓ Row # ${rowIndex}: PASS`, 'color:green'); // background:#CCFF00

    } else {
      // * currentRowFitDelta > 0
      // * If the end of the current row is on the second page -
      // * 🏴 TRY TO SPLIT CURRENT ROW

      const isRowSliced = this._node.isSlice(currentRow);

      if (!isRowSliced) {
        // * Let's split table row [rowIndex]
        this._debug._ && console.group( // Collapsed
          `%c 🔳 Try to split the ROW ${rowIndex} %c (from ${this._currentTableDistributedRows.length})`, 'color:magenta;', ''
        );

        const _minMeaningfulRowSpace = this._node.getTableRowHeight(currentRow, this._minPartLines); // ? paragraph inside
        const currRowTop = this._node.getTop(currentRow, this._currentTable) + this._currentTableCaptionFirefoxAmendment;

        this._assert && console.assert(
          this._currentTableSplitBottom >= currRowTop,
          `It seems that the previous row will not fit into the page (it crosses the slice line): split bottom (${this._currentTableSplitBottom}) < currRowTop ${currRowTop}`
        );

        // * We check whether there is enough space left on the current page
        // * to accommodate a reasonable portion of the broken line,
        // * or whether it is worth considering a full-size page.
        let rowFirstPartHeight = this._currentTableSplitBottom - currRowTop;

        if (rowFirstPartHeight < _minMeaningfulRowSpace) {
          this._debug._ && console.log(
            `%c ${rowFirstPartHeight} < ${_minMeaningfulRowSpace} %c (rowFirstPartHeight < _minMeaningfulRowSpace) And we are going to the "full page size"`,
            'color:red; font-weight:bold; background:#F1E9D2', '',
          );
          rowFirstPartHeight = this._currentTableFullPartContentHeight;
        }

        this._debug._ && console.info(
          {
            currRowTop,
            '• splitBottom': this._currentTableSplitBottom,
            '• is row sliced?': !isRowSliced,
            'first part height': rowFirstPartHeight,
            'full part height': this._currentTableFullPartContentHeight,
          },
        );

        // * We split the row and obtain an array of new rows that should replace the old one.
        const newRows = this._splitTableRow(
          rowIndex,
          currentRow,
          rowFirstPartHeight,
          this._currentTableFullPartContentHeight,
        );
        this._debug._ && console.log('%c newRows \n', 'color:magenta; font-weight:bold', newRows);

        if (newRows.length) {
          // * If the split was successful and the array of new rows is not empty,
          // * we insert the new rows instead of the old ones.

          // * Update the DOM and state with the new table rows.
          this._replaceRowInDOM(currentRow, newRows);
          this._updateCurrentTableEntriesAfterSplit(rowIndex, newRows);
          this._updateCurrentTableDistributedRows();

          // * Roll back index to re-check newly inserted rows starting from this position.
          // * Outer loop will pick up the first new row in the next iteration.
          rowIndex -= 1;

        } else {

          // * If the split failed and the array of new rows is empty,
          // * we need to take action, because the row did not fit.
          this._debug._ && console.log(
            `%c The row is not split. (ROW.${rowIndex})`, 'color:orange', this._currentTableDistributedRows[rowIndex],);

          rowIndex -= 1;

          // TODO
          // todo что-то тут не так - если мы не разбили длинную строку - просто перелистываем? нет нет
        }

        this.logGroupEnd(`🔳 Try to split the ROW ${rowIndex} (from ${this._currentTableDistributedRows.length}) (...if canSplitRow)`);
      } else { // isRowSliced + DON'T FIT (currentRowFitDelta > 0)

        this._debug._ && isRowSliced && console.log(
          `%c Row # ${rowIndex} is slice! but don't fit`, 'color:DarkOrange; font-weight:bold', currentRow,
        );

        // * If splitting is not possible because the row has the isRowSliced flag:
        // * try to fit large row by transforming the content.
        // * We check the actual resulting height of new lines here,
        // * after they have been inserted into the DOM, and they have been rechecked for fit.

        // * And we need to know exactly how much the new line exceeds the limit.


        // *** currentRowFitDelta = nextRowTopOrTableBottom - this._currentTableSplitBottom;
        // * need to reduce row BIG content on currentRowFitDelta

        // TODO: transform content
        console.warn('%c SUPER BIG', 'background:red;color:white', currentRowFitDelta,
          {
            // rowH: currRowHeight,
            part: this._currentTableFullPartContentHeight
          }
        );


        // TODO: Above, we made the row fit on the page.
        // * Register the row index as the start of a new page and update the splitBottom for nex page.
        splitStartRowIndexes.push(rowIndex);
        this._debug._ && console.log(`%c 📍 Row # ${rowIndex} registered as page start`, 'color:green; font-weight:bold');

        this._updateCurrentTableSplitBottom(this._currentTableDistributedRows[rowIndex], "Row does not fit & Row is SLICE");
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

    const splittingRowTdShellHeights = this._node.getTableRowShellHeightByTD(splittingRow);
    this._debug._ && console.log(`🧿 currentRowTdHeights`, splittingRowTdShellHeights);

    //* The splitting row and each clone gets the flag:
    this._node.setFlagSlice(splittingRow);

    const originalTDs = [...this._DOM.getChildren(splittingRow)];

    let splitPointsPerTD = originalTDs.map((td, ind) => {
      this._debug._ && console.groupCollapsed(`(•) Split TD.${ind} in ROW.${splittingRowIndex}`);

      // 🔁 potential recursion because of getSplitChildren()
      // TODO: test complex nested elements

      const currentTdFirstPartHeight = rowFirstPartHeight - splittingRowTdShellHeights[ind];
      const currentTdFullPageHeight = rowFullPageHeight - splittingRowTdShellHeights[ind];

      const tdChildren = this._node.getSplitChildren(td, currentTdFirstPartHeight, currentTdFullPageHeight, splittingRow);

      const tdContentSplitPoints = this._node.getSplitPoints({
        rootNode: td,
        children: tdChildren,
        firstPartHeight: currentTdFirstPartHeight,
        fullPageHeight: currentTdFullPageHeight,
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

        const currentTdFirstPartHeight = rowFirstPartHeight - splittingRowTdShellHeights[ind];
        const currentTdFullPageHeight = rowFullPageHeight - splittingRowTdShellHeights[ind];

        // FIXME
        // const tdChildren = this._node.getPreparedChildren(td);
        const tdChildren = this._node.getSplitChildren(td, currentTdFirstPartHeight, currentTdFullPageHeight, splittingRow);
        this._debug._ && console.groupCollapsed(`(••) Split TD.${ind} in ROW.${splittingRowIndex}`);
        const tdContentSplitPoints = this._node.getSplitPoints({
          rootNode: td,
          children: tdChildren,
          firstPartHeight: currentTdFullPageHeight,
          fullPageHeight: currentTdFullPageHeight,
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

      const slicedTDsPerOrigTD = splitPointsPerTD
      .map((splitPoints, index) => {
        const td = originalTDs[index];
        return this._node.sliceNodeBySplitPoints({
          index,
          rootNode: td,
          splitPoints,
        });
      });

      this._debug._ && console.log('🟣 slicedTDsPerOrigTD', slicedTDsPerOrigTD);

      const maxSlicesPerTD = Math.max(...slicedTDsPerOrigTD.map(arr => arr.length));

      for (let i = 0; i < maxSlicesPerTD; i++) {
        const rowWrapper = this._DOM.cloneNodeWrapper(splittingRow);
        this._DOM.setAttribute(rowWrapper, `.splitted_row_${splittingRowIndex}_part_${i}`);

        [...originalTDs].forEach(
          (origTd, origTdIdx) => {
            const newTDwithContent = slicedTDsPerOrigTD[origTdIdx][i];
            const newTDtoInsert = newTDwithContent || this._DOM.cloneNodeWrapper(origTd);
            this._DOM.insertAtEnd(rowWrapper, newTDtoInsert);
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

  _getRowFitDelta(rowIndex) {
    const currentRow = this._currentTableDistributedRows[rowIndex];
    const currRowBottom = this._node.getBottom(currentRow, this._currentTable) + this._currentTableCaptionFirefoxAmendment;
    const nextRow = this._currentTableDistributedRows[rowIndex + 1];
    const nextRowTopOrTableBottom = nextRow
      ? this._node.getTop(nextRow, this._currentTable) + this._currentTableCaptionFirefoxAmendment
      : currRowBottom; // for the last row

    const delta = nextRowTopOrTableBottom - this._currentTableSplitBottom;
    const isCurrentRowFits = delta <= 0;

    if (isCurrentRowFits) {
      this._debug._ && console.log(
        `%c📐 isCurrentRowFits? %c ${isCurrentRowFits} %c ( ${nextRowTopOrTableBottom} <= ${this._currentTableSplitBottom} ) delta=${delta}`,
        '', 'font-weight:bold;color:green;', '', //background:#CCFF00
      );
    } else {
      this._debug._ && console.log(
        `%c📐 isCurrentRowFits? %c ${isCurrentRowFits} %c ( ${nextRowTopOrTableBottom} > ${this._currentTableSplitBottom} ) delta=${delta}`,
        '', 'font-weight:bold;color:red;', '', //background:#FFDDDD
      );
    }

    return delta;
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
