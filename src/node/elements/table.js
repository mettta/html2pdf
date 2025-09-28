import * as Logging from '../../utils/logging.js';
import * as Paginator from './table.paginator.js';
import * as TableAdapter from './table.adapter.js';
import * as PartsRecorder from '../modules/parts.recorder.js';

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
    this._currentTableRecordedParts = undefined;
    this._currentTableDistributedRows = undefined;
    this._currentTableFirstPartContentBottom = undefined;
    this._currentTableFullPartContentHeight = undefined;
    this._currentTableTfootHeight = undefined;
    // ** current Table parameters updated dynamically during splitting
    this._currentTableSplitBottom = undefined;
    this._logSplitBottom_ = [];
    // ** current per-run caches
    this._currentRowShellCache = undefined;

    // ** analysis flags (guards) — set by _analyzeCurrentTableStructure()
    // Whether any row contains ROWSPAN>1; triggers conservative fallback (no slicing for that row)
    this._currentTableHasRowspan = undefined;
    // Whether any row contains COLSPAN>1; handled within-row slicing but warn to monitor results
    this._currentTableHasColspan = undefined;
    // Whether the number of TD/TH per row varies; indicates non-uniform row structure
    this._currentTableInconsistentCells = undefined;
    // Whether getTableEntries() detected unexpected children in <table>
    this._currentTableHasUnexpectedChildren = undefined;
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
    this._currentTableRecordedParts = PartsRecorder.createEntries({ owner: this._currentTable, currentRows: this._currentTableDistributedRows });
    if (this._currentTableEntries) {
      this._currentTableEntries.recordedParts = this._currentTableRecordedParts;
    }
    this._currentTable.__html2pdfRecordedParts = this._currentTableRecordedParts; // Expose for DevTools and external diagnostics
    // Run structural guards (non-fatal): detect spans/inconsistencies and log.
    // TODO(table): consider early fallback (no split + scaling) on irregular tables.
    this._analyzeCurrentTableStructure();
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
    const finalStartRowIndex = splitStartRowIndexes.length
      ? splitStartRowIndexes[splitStartRowIndexes.length - 1]
      : 0;
    // For telemetry: final part start mirrors slice boundaries even if the builder does not need it

    // * Insert the original table as the last part.
    // * It contains all rows from the last split point to the end.
    const lastPart = this._createAndInsertTableFinalSlice({ table: this._currentTable, startId: finalStartRowIndex });

    this._debug._ && console.log('splits', splits);
    this._debug._ && console.log('lastPart', lastPart)
    this._debug._ && console.log('[table.split] recordedParts', this._currentTableRecordedParts?.parts); // also exposed via table.__html2pdfRecordedParts

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
      const hasSpanInRow = this._rowHasSpan(currentRow);

      // Conservative fallback for rows with ROWSPAN: don't slice TDs
      // - If doesn't fit tail → move to next page
      // - If doesn't fit full-page → scale problematic TDs to full-page height
      if (hasSpanInRow) {
        this._debug._ && console.log('%c ⚠️ Row has ROWSPAN; use conservative fallback (no slicing)', 'color:DarkOrange; font-weight:bold');
        const currRowTop = this._node.getTop(currentRow, this._currentTable);
        const availableRowHeight = this._currentTableSplitBottom - currRowTop;
        rowIndex = this._handleRowOverflow(
          rowIndex,
          currentRow,
          availableRowHeight,
          this._currentTableFullPartContentHeight,
          splitStartRowIndexes,
          'Row with ROWSPAN — move to next page',
          'Row with ROWSPAN — scaled TDs to full page'
        );
        if (this._debug._ && availableRowHeight >= this._currentTableFullPartContentHeight) {
          console.warn('[table.fallback] ROWSPAN row required full-page scaling to fit.');
        }
        this.logGroupEnd(`Row # ${origRowIndex} (from ${origRowCount}) is checked`);
        return rowIndex;
      }

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
        let insufficientRemainingWindow = false;

        if (remainingPageSpace < _minMeaningfulRowSpace) {
          this._debug._ && console.log(
            `%c ${remainingPageSpace} < ${_minMeaningfulRowSpace} %c (remainingPageSpace < _minMeaningfulRowSpace) → use full-page budget for the first part`,
            'color:red; font-weight:bold; background:#F1E9D2', '',
          );
          // * Insufficient remaining page space:
          // * Remaining space cannot host a meaningful fragment of the row on the current page,
          // * so we escalated to full-page height for the first part.
          rowFirstPartHeight = this._currentTableFullPartContentHeight;
          insufficientRemainingWindow = true;
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

          // * Keep currentRows/entries/guards in sync with freshly generated slices via shared kernel helper.
          this._node.paginationRefreshRowsAfterSplit(this._getSplitterAdapter(), {
            rowIndex,
            rowSlices: newRows,
          });

          // * Decide if we must start the row on the next page.
          // * 1) Content-level: isFirstPartEmptyInAnyTD — splitPoints reported an empty first fragment in some TD.
          // * 2) Geometry-level: insufficientRemainingWindow — the little page space left forced escalation to full-page height.
          // * If either is true, place first slice in a full‑page window on the next page.
          const firstSlice = newRows[0];
          const firstSliceTop = this._node.getTop(firstSlice, this._currentTable);
          const firstSliceBottom = this._node.getBottom(firstSlice, this._currentTable);
          const placement = this._node.evaluateRowSplitPlacement({
            usedRemainingWindow: !insufficientRemainingWindow,
            isFirstPartEmpty: isFirstPartEmptyInAnyTD,
            firstSliceTop,
            firstSliceBottom,
            pageBottom: this._currentTableSplitBottom,
            epsilon: 0,
          });

          if (placement.placeOnCurrentPage) {
            // * Scale only the first slice to fit the remaining page space.
            if (placement.remainingWindowSpace > 0) {
              this._scaleProblematicTDs(firstSlice, placement.remainingWindowSpace, this._getRowShellHeights(firstSlice));
            }
            this._registerPageStartAt(rowIndex + 1, splitStartRowIndexes, 'Row split — next slice starts new page');
          } else {
            // * Escalate to full-page window and scale the first slice if slicer requested it.
            this._node.paginationApplyFullPageScaling({
              needsScalingInFullPage: needsScalingInFullPage && Boolean(firstSlice),
              payload: {
                row: firstSlice,
                targetHeight: this._currentTableFullPartContentHeight,
              },
              scaleCallback: ({ row, targetHeight }) => {
                if (!row) return false;
                this._debug._ && console.log('⚖️ _scaleProblematicTDs');
                return this._scaleProblematicTDs(row, targetHeight, this._getRowShellHeights(row));
              },
            });
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

      const generatedRows = this._node.paginationBuildBalancedRowSlices({
        originalRow: splittingRow,
        originalCells: originalTDs,
        splitPointsPerCell: splitPointsPerTD,
        sliceCell: ({ cell, index, splitPoints }) => this._node.sliceNodeBySplitPoints({ index, rootNode: cell, splitPoints }),
        beginRow: ({ originalRow, sliceIndex }) => {
          const rowWrapper = this._DOM.cloneNodeWrapper(originalRow);
          this._DOM.setAttribute(rowWrapper, `.splitted_row_${splittingRowIndex}_part_${sliceIndex}`);
          return { rowWrapper };
        },
        cloneCellFallback: (origTd) => this._DOM.cloneNodeWrapper(origTd),
        handleCell: ({ context, cellClone }) => {
          this._DOM.insertAtEnd(context.rowWrapper, cellClone);
        },
        finalizeRow: ({ context }) => context.rowWrapper,
      });

      newRows.push(...generatedRows);

    } else {

      // rowFullPageHeight
      this._debug._ && console.log('🔴 There is no Split');
    }

    this.logGroupEnd(`%c ➗ Split the ROW ${splittingRowIndex}`);

    // * Return both the new rows and a flag indicating if the first part is empty
    return { newRows, isFirstPartEmptyInAnyTD, needsScalingInFullPage };

  }

  // ===== 📐 Metrics =====

  _collectCurrentTableEntries() {
    this._currentTableEntries = this._node.getTableEntries(this._currentTable);
  }

  _rowHasSpan(tr) {
    // Returns true if any TD/TH in this row has ROWSPAN > 1
    // Note: we intentionally ignore COLSPAN here — it's within a single row
    // and can be handled by the regular slicing logic.
    const cells = [...this._DOM.getChildren(tr)];
    for (const td of cells) {
      const tag = this._DOM.getElementTagName(td);
      if (tag !== 'TD' && tag !== 'TH') continue;
      const rs = parseInt(td.getAttribute('rowspan'));
      if (Number.isFinite(rs) && rs > 1) return true;
    }
    return false;
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

  // ===== Guards / Analysis =====

  _analyzeCurrentTableStructure() {
    // Analyze rows/columns for unsupported features and irregularities.
    // Sets non-fatal flags; current behavior is unchanged.

    const entries = this._currentTableEntries;
    const rows = (this._currentTableDistributedRows || []);

    const flags = this._node.computeRowFlags({
      rows,
      DOM: this._DOM,
      cellTagFilter: (tag, cell) => {
        const containerTag = this._DOM.getElementTagName(cell.parentNode);
        return containerTag !== 'TFOOT' && (tag === 'TD' || tag === 'TH');
      },
    });

    this._currentTableHasRowspan = flags.hasRowspan;
    this._currentTableHasColspan = flags.hasColspan;
    this._currentTableInconsistentCells = flags.inconsistentCells;

    if (this._debug._) {
      if (flags.hasRowspan) {
        console.warn('[table.guard] ROWSPAN detected — slicing not implemented; applying conservative fallback.', { table: this._currentTable });
      }
      if (flags.hasColspan) {
        console.warn('[table.guard] COLSPAN present — handled within-row slicing; monitor results.', { table: this._currentTable });
      }
      if (flags.inconsistentCells) {
        console.warn('[table.guard] Inconsistent cell counts across rows — results may vary.', { table: this._currentTable });
      }
    }

    // TODO(table): if irregular, prefer fallback strategy:
    // - avoid physical split; scale problematic rows to full-page window;
    // - or early return [] to keep the original table intact.
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

  _getPaginatorAdapter() {
    return {
      label: 'table',
      getSplitBottom: () => this._currentTableSplitBottom,
      setSplitBottom: (value) => { this._currentTableSplitBottom = value; },
      computeSplitBottomForElement: (element) => (
        this._node.getTop(element, this._currentTable) + this._currentTableFullPartContentHeight
      ),
      getRows: () => this._currentTableDistributedRows,
      shouldAssert: () => this._assert,
      getDebug: () => this._debug,
      getSplitBottomLog: () => this._logSplitBottom_,
    };
  }

  _getSplitterAdapter() {
    const guardConfigFactory = () => ({
      rows: this._currentTableDistributedRows || [],
      DOM: this._DOM,
      cellTagFilter: (tag, cell) => {
        const parent = cell?.parentNode;
        const containerTag = parent ? this._DOM.getElementTagName(parent) : undefined;
        return containerTag !== 'TFOOT' && (tag === 'TD' || tag === 'TH');
      },
    });

    return {
      label: 'table',
      rows: {
        getCurrentRows: () => this._currentTableDistributedRows || [],
        replaceRow: ({ rowIndex, rowSlices }) => {
          this._node.applyRowSlicesToEntriesAfterRowSplit(this._currentTableEntries, rowIndex, rowSlices);
        },
        syncEntries: () => {
          this._updateCurrentTableDistributedRows();
          if (this._currentTableRecordedParts) {
            this._currentTableRecordedParts.currentRows = this._currentTableDistributedRows;
          }
        },
        getGuardConfig: guardConfigFactory,
        onRowsChanged: () => {
          if (this._currentTableRecordedParts) {
            this._currentTableRecordedParts.currentRows = this._currentTableDistributedRows;
          }
        },
      },
      guards: {
        getConfig: guardConfigFactory,
        onFlags: ({ flags }) => {
          if (!flags) return;
          this._currentTableHasRowspan = Boolean(flags.hasRowspan);
          this._currentTableHasColspan = Boolean(flags.hasColspan);
          this._currentTableInconsistentCells = Boolean(flags.inconsistentCells);
        },
      },
    };
  }

  _updateCurrentTableSplitBottom(elementOrValue, message = 'unknown case') {
    // Delegate to element-level paginator helper (no behavior change)
    Paginator.updateSplitBottom(this._getPaginatorAdapter(), elementOrValue, message);
  }

  _registerPageStartAt(index, splitStartRowIndexes, reason = 'register page start') {
    // Delegate to element-level paginator helper (no behavior change)
    Paginator.registerPageStartAt(this._getPaginatorAdapter(), index, splitStartRowIndexes, reason);
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
    const part = TableAdapter.createAndInsertTableSlice(this, { startId, endId, table, tableEntries });
    const rows = Array.isArray(this._currentTableDistributedRows)
      ? this._currentTableDistributedRows.slice(startId, endId).map((row, offset) => ({
        rowIndex: startId + offset,
        row,
        cells: Array.from(this._DOM.getChildren(row) || []),
      }))
      : [];
    this._recordTablePart(part, { startId, endId, type: 'slice', rows });
    return part;
  }

  _createAndInsertTableFinalSlice({ table, startId = 0 }) {
    const part = TableAdapter.createAndInsertTableFinalSlice(this, { table });
    const totalRows = Array.isArray(this._currentTableDistributedRows)
      ? this._currentTableDistributedRows.length
      : 0;
    const rows = Array.isArray(this._currentTableDistributedRows)
      ? this._currentTableDistributedRows.slice(startId).map((row, offset) => ({
        rowIndex: startId + offset,
        row,
        cells: Array.from(this._DOM.getChildren(row) || []),
      }))
      : [];
    this._recordTablePart(part, { startId, endId: totalRows, type: 'final', rows });
    return part;
  }

  _recordTablePart(part, meta = {}) {
    const entries = this._currentTableRecordedParts;
    if (!entries || !part) {
      return null;
    }
    const {
      startId = null,
      endId = null,
      type = 'unknown',
      rows = [],
      meta: extraMeta,
    } = meta || {};
    return PartsRecorder.recordPart({
      entries,
      part,
      startIndex: startId,
      endIndex: endId,
      type,
      rows,
      meta: extraMeta,
    });
  }

}
