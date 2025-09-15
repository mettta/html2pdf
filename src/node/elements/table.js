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
    this._currentTableFirstPartContentBottom = undefined;
    this._currentTableFullPartContentHeight = undefined;
    this._currentTableTfootHeight = undefined;
    // ** current Table parameters updated dynamically during splitting
    this._currentTableSplitBottom = undefined;
    this._logSplitBottom_ = [];
    // ** current per-run caches
    this._currentRowShellCache = undefined;
  }

  _setCurrent(_table, _pageBottom, _fullPageHeight, _root) {
    this._currentTable = _table;
    this._currentFirstPageBottom = _pageBottom;
    this._currentFullPageHeight = _fullPageHeight;
    this._currentRoot = _root;
    this._currentRowShellCache = new WeakMap();
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
    this._debug._ && console.group(`🔲 %c Check the Row # ${origRowIndex} (from ${origRowCount})`, '',);

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
      // 🫟 Special case: last row can fit if we remove the bottom signpost (final chunk has no footer label).
      const nextRow = this._currentTableDistributedRows[rowIndex + 1];
      const isLastRow = !nextRow;
      const extraCapacity = this._signpostHeight + this._currentTableTfootHeight; // what we regain in the final part

      // TODO: make a function #last_tail
      // 🫟 Early tail drop for a row with one split:
      // If this is the last data row and the last slice height is small enough
      // to fit into the extra capacity of the final chunk (no bottom signpost + TFOOT),
      // skip creating the last slice row entirely.
      if (isLastRow) {
        // FIXME: currRowBottom is calculated in this._getRowFitDelta, reuse it!
        const currRowBottom = this._node.getBottom(currentRow, this._currentTable);
        const overflow = currRowBottom - this._currentTableSplitBottom;
        this._debug._ && console.log('🫟 last-row-extra-check', { overflow, extraCapacity, currRowBottom, splitBottom: this._currentTableSplitBottom });
        if (overflow <= extraCapacity) {
          // Treat as fitting the final window: do not split and do not register a new chunk.
          this._debug._ && console.log('🫟 last-row-fits-without-bottom-signpost: skip split');
          this.logGroupEnd(`Row # ${origRowIndex} (from ${origRowCount}) is checked`);
          return rowIndex;
        }
      }
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
        const currRowTop = this._node.getTop(currentRow, this._currentTable);

        this._assert && console.assert(
          this._currentTableSplitBottom >= currRowTop,
          `It seems that the previous row will not fit into the page (it crosses the slice line): split bottom (${this._currentTableSplitBottom}) < currRowTop ${currRowTop}`
        );

        // * We check whether there is enough space left on the current page
        // * to accommodate a reasonable portion of the broken line,
        // * or whether it is worth considering a full-size page.
        const remainingPageSpace = this._currentTableSplitBottom - currRowTop;
        // * Budget for the first part:
        let rowFirstPartHeight = remainingPageSpace;
        let insufficientRemainingPageSpace = false;

        if (remainingPageSpace < _minMeaningfulRowSpace) {
          this._debug._ && console.log(
            `%c ${remainingPageSpace} < ${_minMeaningfulRowSpace} %c (remainingPageSpace < _minMeaningfulRowSpace) → use full-page budget for the first part`,
            'color:red; font-weight:bold; background:#F1E9D2', '',
          );
          // * Insufficient remaining page space:
          // * Remaining space cannot host a meaningful fragment of the row on the current page,
          // * so we escalated to full-page height for the first part.
          rowFirstPartHeight = this._currentTableFullPartContentHeight;
          insufficientRemainingPageSpace = true;
        }

        this._debug._ && console.info(
          {
            currRowTop,
            '• splitBottom': this._currentTableSplitBottom,
            '• is row sliced?': !isRowSliced,
            'remaining page space': remainingPageSpace,
            'first part height': rowFirstPartHeight,
            'full part height': this._currentTableFullPartContentHeight,
          },
        );

        // * We split the row and obtain an array of new rows that should replace the old one.
        const { newRows, isFirstPartEmptyInAnyTD } = this._splitTableRow(
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

          // TODO: make a function #last_tail
          // 🔂 evaluate the last new row of newRows for old LastRow
          // 🫟 Tail drop for a row with multiple splits:
          // If this is the last data row and the last slice height is small enough
          // to fit into the extra capacity of the final chunk (no bottom signpost + TFOOT),
          // skip creating the last slice row entirely.
          if (isLastRow) {
            this._debug._ && console.log('🫟 Tail drop');
            const heightOfLastNewRow = this._DOM.getElementOffsetHeight(newRows.at(-1));
            if (heightOfLastNewRow <= extraCapacity) {
              this._DOM.moveRowContent(newRows.at(-1), newRows.at(-2));
              this._DOM.removeNode(newRows.at(-1));
              newRows.pop();
            }
          }

          this._updateCurrentTableEntriesAfterSplit(rowIndex, newRows);
          this._updateCurrentTableDistributedRows();

          // * Decide if we must start the row on the next page.
          // * 1) Content-level: isFirstPartEmptyInAnyTD — splitPoints reported an empty first fragment in some TD.
          // * 2) Geometry-level: insufficientRemainingPageSpace — the little page space left forced escalation to full-page height.
          // * If either is true, place first slice in a full‑page window on the next page.
          const mustStartOnNextPage = isFirstPartEmptyInAnyTD || insufficientRemainingPageSpace;

          if (!mustStartOnNextPage) {
            // * Ensure the first slice fits the current page window (before registration).
            const firstSlice = newRows[0];
            const firstSliceTop = this._node.getTop(firstSlice, this._currentTable);
            const availableTailHeight = this._currentTableSplitBottom - firstSliceTop;
            if (availableTailHeight > 0) {
              this._scaleProblematicTDs(firstSlice, availableTailHeight, this._getRowShellHeights(firstSlice));
            }
            // * Now register the next slice as the start of the next page.
            this._registerPageStartAt(rowIndex + 1, splitStartRowIndexes, 'Row split — next slice starts new page');
          } else {
            // * No feasible short first fragment → move the whole row to the next page.
            this._registerPageStartAt(rowIndex, splitStartRowIndexes, 'Empty first part — move row to next page');
          }

          // * Roll back index to re-check from the newly updated splitBottom context.
          rowIndex -= 1;

        } else {

          // * If the split failed and the array of new rows is empty,
          // * we need to take action, because the row did not fit.
          this._debug._ && console.log(
            `%c The row is not split. (ROW.${rowIndex})`, 'color:orange', this._currentTableDistributedRows[rowIndex],);

          // * If only short tail space is available, move the row to next page (no scaling on tail).
          // * If we are already in full-page context, scale ONLY problematic TD content to fit full-page height.

          const currRowTop = this._node.getTop(currentRow, this._currentTable);
          const availableRowHeight = this._currentTableSplitBottom - currRowTop;
          rowIndex = this._handleRowOverflow(rowIndex, currentRow, availableRowHeight, this._currentTableFullPartContentHeight, splitStartRowIndexes,
            'Split failed — move row to next page',
            'Split failed — scaled TDs for full-page');
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
        this._debug._ && console.warn('%c SUPER BIG', 'background:red;color:white', currentRowFitDelta,
          {
            // rowH: currRowHeight,
            part: this._currentTableFullPartContentHeight
          }
        );

        // * Transform TD content.
        // * - If we are at the tail of a page (short first part), do NOT scale — move row to next page.
        // * - If at a full-page context and TD still can’t fit, scale ONLY problematic TD contents to fit full-page height.
        // * Note: fine-grained scaling may have already been applied in slicers.js (getSplitPoints).
        // * This is a row-level fallback to guarantee geometry and prevent overflow.

        const currRowTopForSlice = this._node.getTop(currentRow, this._currentTable);
        const availableRowHeight = this._currentTableSplitBottom - currRowTopForSlice;
        rowIndex = this._handleRowOverflow(rowIndex, currentRow, availableRowHeight, this._currentTableFullPartContentHeight, splitStartRowIndexes,
          `Slice doesn't fit tail — move to next page`,
          'Scaled TD content to fit full page');

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

    // *️⃣ [•] splitPointsPerTD
    let splitPointsPerTD = originalTDs.map((td, ind) => {
      this._debug._ && console.group(`(•) Split TD.${ind} in ROW.${splittingRowIndex}`);

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

    // *️⃣ [••] splitPointsPerTD
    if(isFirstPartEmptyInAnyTD) {
      splitPointsPerTD = [...originalTDs].map((td, ind) => {

        const currentTdFirstPartHeight = rowFirstPartHeight - splittingRowTdShellHeights[ind];
        const currentTdFullPageHeight = rowFullPageHeight - splittingRowTdShellHeights[ind];

        // FIXME
        // const tdChildren = this._node.getPreparedChildren(td);
        this._debug._ && console.group(`(••) Split TD.${ind} in ROW.${splittingRowIndex}`);
        const tdChildren = this._node.getSplitChildren(td, currentTdFirstPartHeight, currentTdFullPageHeight, splittingRow);
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

    // * Return both the new rows and a flag indicating if the first part is empty
    return { newRows, isFirstPartEmptyInAnyTD };

  }






























  // 📐 Metric Functions:

  _collectCurrentTableEntries() {
    this._currentTableEntries = this._node.getTableEntries(this._currentTable);
  }

  _collectCurrentTableMetrics() {
    // Prepare node parameters

    // * Calculate table wrapper (empty table element) height
    // * to estimate the available space for table content.
    const tableWrapperHeight = this._node.getEmptyNodeHeight(
      this._currentTable,
      // * We need content for the outer table tag to be rendered, but we reset
      // * the TD/TR styles because they are later considered individually for each cell.
      '<tr style="padding:0;border:0;"><td style="padding:0;border:0;"></td></tr>'
    );

    // * getTopWithMargin vs getTop
    // * The margin must be taken into account,
    // * because it is included in the calculation of the tableWrapperHeight
    // * and will be subtracted when calculating the first internal part of the table.
    const tableTopWithTopMargin = this._node.getTopWithMargin(this._currentTable, this._currentRoot);

    // const tableHeight = this._DOM.getElementOffsetHeight(this._currentTable);
    const tableCaptionHeight = this._DOM.getElementOffsetHeight(this._currentTableEntries.caption) || 0;
    // const tableTheadHeight = this._DOM.getElementOffsetHeight(this._currentTableEntries.thead) || 0;
    const tableTheadHeight = this._DOM.getElementOffsetTop(this._currentTableDistributedRows[0], this._currentTable) - tableCaptionHeight || 0;
    this._currentTableTfootHeight = this._DOM.getElementOffsetHeight(this._currentTableEntries.tfoot) || 0;

    this._currentTableFirstPartContentBottom = this._currentFirstPageBottom
      - tableTopWithTopMargin
      - tableWrapperHeight
      - this._signpostHeight;

    this._currentTableFullPartContentHeight = this._currentFullPageHeight
      - tableCaptionHeight // * copied into each part
      - tableTheadHeight // * copied into each part
      - this._currentTableTfootHeight // * remains in the last part (in the table)
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
        this._currentTableFullPartContentHeight;
    } else {
      throw new Error(`_updateCurrentTableSplitBottom: unexpected value type: ${typeof elementOrValue}`);
    }

    this._logSplitBottom_.push(this._currentTableSplitBottom);

    this._debug._ && console.log(
      `%c♻️ Update splitBottom (with ${elementOrValue}) \n • ${message}`, 'color: green; font-weight: bold',
      '\n', _loggedPrevTableSplitBottom, '->', this._currentTableSplitBottom,
      `\n _logSplitBottom_: ${this._logSplitBottom_}`, this._logSplitBottom_,
    );
  }

  // 🧮 Utilities / calculations:

  // Two-tier safety note:
  // - Fine-grained scaling may already occur inside slicers.js (getSplitPoints),
  //   targeting specific inner elements that cannot be split.
  // - This helper is a coarser, row/TD-level fallback used by table.js to ensure
  //   geometry in full-page context. Tail cases are moved to the next page without scaling.
  //
  // Scale only problematic TDs within the given row to fit into totalRowHeight.
  // Computes per-TD content budget as (totalRowHeight - TD shell height) and
  // scales inner content if it exceeds the budget.
  // Returns true if any TD was scaled.
  _scaleProblematicTDs(row, totalRowHeight, shellsOpt) {
    const tds = [...this._DOM.getChildren(row)];
    // Use cached shells if possible: compute-once per TR per split run.
    const shells = Array.isArray(shellsOpt) ? shellsOpt : this._getRowShellHeights(row);
    let scaled = false;

    for (let i = 0; i < tds.length; i++) {
      const td = tds[i];
      const shellH = shells[i] || 0;
      const target = Math.max(0, totalRowHeight - shellH);
      if (target <= 0) continue;

      const onlyOneElementChild = this._DOM.getChildren(td).length === 1;
      const firstChildEl = this._DOM.getFirstElementChild(td);

      let contentWrapper = null;
      let contentH;

      if (onlyOneElementChild && firstChildEl && this._node.isNeutral(firstChildEl)) {
        contentWrapper = firstChildEl;
        contentH = this._DOM.getElementOffsetHeight(contentWrapper);
      } else {
        contentH = this._measureTdContentHeight(td);
      }

      if (contentH > target) {
        if (!contentWrapper) {
          contentWrapper = this._node.wrapNodeChildrenWithNeutralBlock(td);
        }
        this._node.fitElementWithinHeight(contentWrapper, target);
        scaled = true;
        this._debug._ && console.log('💢 RESIZED:', contentWrapper);
      }
    }

    return scaled;
  }

  // Measure effective TD content height via a temporary neutral probe appended to TD.
  // The probe's normalized top (relative to TD) equals the content height because
  // it's placed after all flow content. The probe is removed immediately.
  _measureTdContentHeight(td) {
    const tdStyle = this._DOM.getComputedStyle(td);
    const probe = this._node.createNeutralBlock();
    this._DOM.setStyles(probe, {
      display: 'block',
      padding: '0',
      margin: '0',
      border: '0',
      height: '0',
      clear: 'both',
      visibility: 'hidden',
      contain: 'layout',
    });
    this._DOM.insertAtEnd(td, probe);
    const h = this._node.getNormalizedTop(probe, td, tdStyle);
    this._DOM.removeNode(probe);
    return h;
  }

  // Decide how to resolve overflow for the current row against the current window.
  // Tail → move row to next page; Full-page → scale TDs, then move row.
  // Returns rowIndex - 1 to trigger re-check under the new window.
  _handleRowOverflow(rowIndex, row, availableRowHeight, fullPageHeight, splitStartRowIndexes, reasonTail, reasonFull) {
    if (availableRowHeight < fullPageHeight) {
      this._registerPageStartAt(rowIndex, splitStartRowIndexes, reasonTail);
      return rowIndex - 1;
    }
    this._scaleProblematicTDs(row, fullPageHeight, this._getRowShellHeights(row));
    this._registerPageStartAt(rowIndex, splitStartRowIndexes, reasonFull);
    return rowIndex - 1;
  }

  

  // Get per-TD shell heights for a TR with caching.
  // Uses a WeakMap per split run to avoid recomputation and to ensure automatic cleanup
  // after TR nodes are replaced by splitting.
  _getRowShellHeights(row) {
    if (!this._currentRowShellCache) {
      // Fallback: if cache is not initialized for some reason, compute directly.
      return this._node.getTableRowShellHeightByTD(row);
    }
    if (this._currentRowShellCache.has(row)) {
      return this._currentRowShellCache.get(row);
    }
    const shells = this._node.getTableRowShellHeightByTD(row);
    this._currentRowShellCache.set(row, shells);
    return shells;
  }

  // Register the start of a new page at a given row index and
  // immediately update splitBottom to reflect the new page context.
  // Keeps splitStartRowIndexes strictly increasing; ignores invalid/duplicate indices.
  _registerPageStartAt(index, splitStartRowIndexes, reason = 'register page start') {
    const rows = this._currentTableDistributedRows || [];
    const rowsLen = rows.length;

    // 1) Validate basics
    const isInt = Number.isInteger(index);
    this._assert && console.assert(isInt, `_registerPageStartAt: index must be an integer, got: ${index}`);
    if (!isInt) return;

    this._assert && console.assert(rowsLen > 0, `_registerPageStartAt: no rows to register`);
    if (rowsLen === 0) return;

    // 2) Special case: index === 0
    // Do NOT push 0 (would create an empty first part); just advance geometry.
    if (index === 0) {
      this._debug._ && console.log(`%c 📍 Row #0 forced to next page (no short first fragment)`, 'color:green; font-weight:bold');
      this._updateCurrentTableSplitBottom(rows[0], `${reason} (index=0)`);
      return;
    }

    // 3) Clamp into [1 .. rowsLen-1] to avoid empty first/last parts
    let idx = Math.max(1, Math.min(index, rowsLen - 1));

    // 4) Enforce strictly ascending sequence (no dups)
    const last = splitStartRowIndexes.at(-1);
    if (last != null && idx <= last) {
      idx = last + 1;
    }

    // 5) If clamped beyond range, do not push (would empty final/original)
    if (idx >= rowsLen) {
      this._assert && console.assert(false, `_registerPageStartAt: computed index (${idx}) >= rowsLen (${rowsLen})`);
      return;
    }

    // 6) Register and advance geometry
    splitStartRowIndexes.push(idx);
    this._debug._ && console.log(`%c 📍 Row # ${idx} registered as page start`, 'color:green; font-weight:bold');
    this._updateCurrentTableSplitBottom(rows[idx], reason);
  }

  _getRowFitDelta(rowIndex) {
    const currentRow = this._currentTableDistributedRows[rowIndex];
    const currRowBottom = this._node.getBottom(currentRow, this._currentTable);
    const nextRow = this._currentTableDistributedRows[rowIndex + 1];
    const nextRowTopOrTableBottom = nextRow
      ? this._node.getTop(nextRow, this._currentTable)
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
