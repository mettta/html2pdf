import * as Logging from '../../utils/logging.js';
import * as Paginator from './table.paginator.js';

// TODO(table): Unsupported features planned later
// - colSpan/rowSpan splitting across pages (complex layout heuristics)
// - Inner scroll containers unwrapping; currently printed as-is
// - Externalize signpost texts/height to config (align with document headers/footers)

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
    // * Paginate a <table> into print-sized parts.
    // * - Clones caption/thead/colgroup into each non-final part; keeps tfoot only in the final part.
    // * - Adds continuation signposts above/below parts per configuration.
    // * - Returns an array of part wrappers with the original table as the last entry;
    // *   returns [] when the table fits without splitting.
    this._setCurrent(_table, _pageBottom, _fullPageHeight, _root);
    const splits = this._splitCurrentTable();
    this._resetCurrent();
    return splits;
  }

  // ===== Init / Reset / Constants =====

  _initConstants() {
    // Table splitting constraints

    // TODO(config): move signpost text/height to external config
    // * From config:
    // - if null is set - the element is not created in createSignpost().
    this._signpostHeight = parseFloat(this._splitLabelHeightFromConfig) || 0;

    // TODO(table): consider moving `_minPartLines` to paragraph/general splitting policy
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

  // ===== Preparation =====

  _prepareCurrentTableForSplitting() {
    this._lockCurrentTableWidths();
    this._collectCurrentTableEntries();
    this._updateCurrentTableDistributedRows();
    this._collectCurrentTableMetrics();
  }

  _lockCurrentTableWidths() {
    // * Keep table widths stable before measuring/splitting
    this._node.lockTableWidths(this._currentTable);
  }

  // ===== Split Flow =====

  _splitCurrentTable() {
    // TODO test more complex tables


    //  * Core pagination loop for the current table instance.
    //  * Prepares metrics, walks distributed rows to register page starts, builds parts.

    // High-level flow:
    // 1) Prepare table state and metrics
    // 2) Walk rows to register page starts
    // 3) Build parts by split indexes and append the original as the last part

    // * Prepare table.
    this._prepareCurrentTableForSplitting();
    // * Start with a short first part or immediately from the full height of the page.
    this._setCurrentTableFirstSplitBottom();

    // TODO(table): colSpan/rowSpan are not supported yet; guard later in split path

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

    // * Collect row indexes where new table parts should start after splitting.
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

      // * Create and insert a new table part that will contain rows from startId up to endId (excluding endId).
      const tableSliceWrapper = this._createAndInsertTableSlice({
        startId: startId,
        endId: endId,
        table: this._currentTable,
        tableEntries: this._currentTableEntries,
      });

      // * Return new table part to register in splits array.
      return tableSliceWrapper;
    });

    // * Use the rest of the original table to create the last slice.

    // * Insert the original table as the last part.
    // * It contains all rows from the last split point to the end.
    const lastPart = this._createAndInsertTableFinalSlice({ table: this._currentTable });

    this._debug._ && console.log('splits', splits);
    this._debug._ && console.log('lastPart', lastPart)

    this.logGroupEnd(`_splitCurrentTable`);

    return [...splits, lastPart]
  }

  _evaluateRowForSplitting(rowIndex, splitStartRowIndexes) {
    // Input: rowIndex; mutates splitStartRowIndexes
    // May split/replace TRs and advance splitBottom;
    // returns possibly decremented index (re-check under new window).
    // Honors final-part reclaimed height.

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
      const isLastRow = !this._currentTableDistributedRows[rowIndex + 1];
      const extraCapacity = this._getFinalPartReclaimedHeight(); // what we regain in the final part

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
        const { newRows, isFirstPartEmptyInAnyTD, needsScalingInFullPage } = this._splitTableRow(
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
            // * A) Tail case: keep the first slice on the current page.
            // * Scale only the first slice to fit the remaining page space.
            // * Ensure the first slice fits the current page window (before registration).
            const firstSlice = newRows[0];
            const firstSliceTop = this._node.getTop(firstSlice, this._currentTable);
            const availableTailHeight = this._currentTableSplitBottom - firstSliceTop;
            if (availableTailHeight > 0) {
              this._scaleProblematicTDs(firstSlice, availableTailHeight, this._getRowShellHeights(firstSlice));
            }
            // * Register the next slice (part 2 of this row) as a new page start.
            this._registerPageStartAt(rowIndex + 1, splitStartRowIndexes, 'Row split — next slice starts new page');
          } else {
            // * B) Full‑page case: move the whole row to the next page.
            // * If second pass of getSplitPoints() still reported unsplittable content,
            // * scale (reduce) the first slice to full‑page height.
            if (needsScalingInFullPage && newRows[0]) {
              this._debug._ && console.log('⚖️ _scaleProblematicTDs');
              this._scaleProblematicTDs(newRows[0], this._currentTableFullPartContentHeight, this._getRowShellHeights(newRows[0]));
            }
            // * No feasible short first fragment → move the whole row to the next page.
            this._registerPageStartAt(rowIndex, splitStartRowIndexes, 'Empty first part — move row to next page');
          }

          // * Roll back index to re-check from the newly updated splitBottom context.
          rowIndex -= 1;

        } else { // (!newRows.length)

          // * If the split failed and the array of new rows is empty,
          // * we need to take action, because the row did not fit.
          this._debug._ && console.log(
            `%c The row is not split. (ROW.${rowIndex})`, 'color:orange', this._currentTableDistributedRows[rowIndex],);

          // * If only short tail space is available, move the row to next page (no scaling on tail).
          // * If we are already in full-page context, scale ONLY problematic TD content to fit full-page height.

          const currRowTop = this._node.getTop(currentRow, this._currentTable);
          const availableRowHeight = this._currentTableSplitBottom - currRowTop;
          rowIndex = this._handleRowOverflow(
            rowIndex,
            currentRow,
            availableRowHeight,
            this._currentTableFullPartContentHeight,
            splitStartRowIndexes,
            'Split failed — move row to next page',
            'Split failed — scaled TDs for full-page'
          );
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

  // ===== Row Split Internals =====

  _splitTableRow(
    splittingRowIndex,
    splittingRow,
    rowFirstPartHeight,
    rowFullPageHeight,
  ) {
    // * Split row into TR clones by TD split points
    // * - compute per‑TD split points
    // * - slice TD content and assemble TR parts
    // * Returns: { newRows, isFirstPartEmptyInAnyTD, needsScalingInFullPage }

    this._debug._ && console.group( // Collapsed
      `%c ➗ Split the ROW ${splittingRowIndex}`, 'color:magenta;', ''
    );

    const splittingRowTdShellHeights = this._node.getTableRowShellHeightByTD(splittingRow);
    this._debug._ && console.log(`🧿 currentRowTdHeights`, splittingRowTdShellHeights);

    //* The splitting row and each clone gets the flag:
    this._node.setFlagSlice(splittingRow);

    const originalTDs = [...this._DOM.getChildren(splittingRow)];

    // *️⃣ Compute per‑TD split points (with second pass + sanitization) via slicers module.
    const computed = this._node.getSplitPointsPerCells(
      originalTDs,
      splittingRowTdShellHeights,
      rowFirstPartHeight,
      rowFullPageHeight,
      splittingRow
    );
    this._debug._ && console.log('[✖️] getSplitPointsPerCells result:', computed);
    let splitPointsPerTD = computed.splitPointsPerCell;
    const isFirstPartEmptyInAnyTD = computed.isFirstPartEmptyInAnyCell;
    let needsScalingInFullPage = computed.needsScalingInFullPage;

    // добавить в tdContentSplitPoints нулевой элемент
    // но также считать "первый пустой кусок"

    const newRows = [];
    const ifThereIsSplit = splitPointsPerTD.some(obj => obj.length);
    if (ifThereIsSplit) {

      const slicedTDsPerOrigTD = this._sliceCellsBySplitPoints(originalTDs, splitPointsPerTD);

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
      this._debug._ && console.log('🔴 There is no Split');
    }

    this.logGroupEnd(`%c ➗ Split the ROW ${splittingRowIndex}`);

    // * Return both the new rows and a flag indicating if the first part is empty
    return { newRows, isFirstPartEmptyInAnyTD, needsScalingInFullPage };

  }

  _sliceCellsBySplitPoints(cells, splitPointsPerCell) {
    // * Slice each TD by split points and return slices per TD
    return splitPointsPerCell.map((splitPoints, index) => {
      const cell = cells[index];
      return this._node.sliceNodeBySplitPoints({ index, rootNode: cell, splitPoints });
    });
  }

  // ===== 📐 Metrics =====

  _collectCurrentTableEntries() {
    this._currentTableEntries = this._node.getTableEntries(this._currentTable);
  }

  _collectCurrentTableMetrics() {
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

  _getDistributedRows(entries) {
    return [
      ...entries.rows,
      ...(entries.tfoot ? [entries.tfoot] : [])
    ]
  }

  _updateCurrentTableDistributedRows() {
    // * Rows that we distribute across the partitioned table
    this._currentTableDistributedRows = this._getDistributedRows(this._currentTableEntries);
  }

  _updateCurrentTableEntriesAfterSplit(index, newRows) {
    this._currentTableEntries.rows.splice(index, 1, ...newRows);
  }

  _getFinalPartReclaimedHeight() {
    return (this._signpostHeight || 0) + (this._currentTableTfootHeight || 0);
  }

  // ===== Split Geometry =====

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
    // Delegate to element-level paginator helper (no behavior change)
    Paginator.updateSplitBottom(this, elementOrValue, message);
  }

  _registerPageStartAt(index, splitStartRowIndexes, reason = 'register page start') {
    // Delegate to element-level paginator helper (no behavior change)
    Paginator.registerPageStartAt(this, index, splitStartRowIndexes, reason);
  }

  // ===== Overflow / Scaling =====

  _scaleProblematicTDs(row, totalRowHeight, shellsOpt) {
    // Two-tier safety note:
    // - Fine-grained scaling may already occur inside slicers.js (getSplitPoints),
    //   targeting specific inner elements that cannot be split.
    // - This helper is a coarser, row/TD-level fallback used by table.js to ensure
    //   geometry in full-page context. Tail cases are moved to the next page without scaling.
    //
    // Delegation:
    // - Uses generic fitters.scaleCellsToHeight via this._node to scale only
    //   overflowing TD contents within a row.
    // - Per‑TD budget: target = max(0, totalRowHeight - TD shell height).
    // - Returns true if any TD was scaled.

    const tds = [...this._DOM.getChildren(row)];
    // Use cached shells if possible: compute-once per TR per split run.
    const shells = Array.isArray(shellsOpt) ? shellsOpt : this._getRowShellHeights(row);
    // Delegate to generic scaler available on Node (fitters.scaleCellsToHeight)
    return this._node.scaleCellsToHeight(tds, totalRowHeight, shells);
  }

  _handleRowOverflow(rowIndex, row, availableRowHeight, fullPageHeight, splitStartRowIndexes, reasonTail, reasonFull) {
    // * Decide how to resolve overflow for the current row against the current window.
    // * Tail → move row to next page; Full-page → scale TDs, then move row.
    // * Returns rowIndex - 1 to trigger re-check under the new window.
    if (availableRowHeight < fullPageHeight) {
      this._registerPageStartAt(rowIndex, splitStartRowIndexes, reasonTail);
      return rowIndex - 1;
    }
    this._scaleProblematicTDs(row, fullPageHeight, this._getRowShellHeights(row));
    this._registerPageStartAt(rowIndex, splitStartRowIndexes, reasonFull);
    return rowIndex - 1;
  }

  _getRowShellHeights(row) {
    // * Get per-TD shell heights for a TR with caching.
    // * Uses a WeakMap per split run to avoid recomputation and to ensure automatic cleanup
    // * after TR nodes are replaced by splitting.
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

  // ===== Builders =====
  // 👪👪👪👪👪👪👪👪👪👪👪👪👪👪👪👪

  _createTopSignpost() {
    // TODO(config): move signpost text/height to external config
    return this._node.createSignpost('(table continued)', this._signpostHeight)
  }

  _createBottomSignpost() {
    // TODO(config): move signpost text/height to external config
    return this._node.createSignpost('(table continues on the next page)', this._signpostHeight)
  }

  _replaceRowInDOM(row, newRows) {
    this._debug._ && this._DOM.setAttribute(row, '.🚫_must_be_removed');
    this._DOM.insertInsteadOf(row, ...newRows);
  }

  _createAndInsertTableSlice({ startId, endId, table, tableEntries }) {
    // * Creates and insert a non-final table slice.
    // * Creates `flagged slice wrapper`, fills it with
    // * - cloned wrapper/colgroup/caption/thead,
    // * - tbody [startId, endId),
    // * - top signpost for non-first, bottom signpost always.
    // * Returns `flagged slice wrapper`.

    // Guard slice bounds (debug-only): 0 <= startId < endId <= rows.length
    if (this._assert) {
      const rowsLen = (tableEntries && tableEntries.rows) ? tableEntries.rows.length : 0;
      console.assert(Number.isInteger(startId) && Number.isInteger(endId),
        `_createAndInsertTableSlice: non-integer bounds: startId=${startId}, endId=${endId}`);
      console.assert(rowsLen >= 0, `_createAndInsertTableSlice: invalid rows length: ${rowsLen}`);
      console.assert(startId >= 0 && endId >= 0 && startId < endId && endId <= rowsLen,
        `_createAndInsertTableSlice: out-of-range slice [${startId}, ${endId}) for rowsLen=${rowsLen}`);
    }

    const tableSliceWrapper = this._node.createWithFlagNoBreak();

    // * Insert a new table part.
    this._DOM.insertBefore(table, tableSliceWrapper);

    const partEntries = tableEntries.rows.slice(startId, endId);

    if (startId) {
      // * if is not first table slice
      this._DOM.insertAtEnd(
        tableSliceWrapper,
        this._createTopSignpost(),
      );
    }

    const tableSlice = this._node.createTable({
        wrapper: this._DOM.cloneNodeWrapper(table),
        colgroup: this._DOM.cloneNode(tableEntries.colgroup),
        caption: this._DOM.cloneNode(tableEntries.caption),
        thead: this._DOM.cloneNode(tableEntries.thead),
        // tfoot, // * included only in the last part
        tbody: partEntries,
      });

    this._DOM.insertAtEnd(
      tableSliceWrapper,
      tableSlice,
      this._createBottomSignpost(),
    );

    return tableSliceWrapper
  }

  _createAndInsertTableFinalSlice({ table }) {
    // * Creates and inserts the final table slice:
    // * - creates `flagged slice wrapper`, and moves the rest of the table into it,
    // * - adds a top signpost (final slice has no bottom signpost here).
    // * Returns `flagged slice wrapper`.

    const tableSliceWrapper = this._node.createWithFlagNoBreak();
    this._DOM.insertBefore(table, tableSliceWrapper);
    this._DOM.insertAtEnd(
      tableSliceWrapper,
      this._createTopSignpost(),
      table // * including tfoot if available
    );

    return tableSliceWrapper
  }

}
