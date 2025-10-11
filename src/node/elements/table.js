import * as Logging from '../../utils/logging.js';
import * as Paginator from './structuredElementPaginator.js';
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
    // 🤖 Snapshot of created parts recorded for diagnostics and DevTools (moved with the table instance).
    this._currentTableRecordedParts = undefined;
    // 🤖 Working array of rows (tbody + trailing tfoot) that Stage-5 logic mutates when slices are produced.
    this._currentTableDistributedRows = undefined;
    this._currentTableFirstPartContentBottom = undefined;
    this._currentTableFullPartContentHeight = undefined;
    this._currentTableTfootHeight = undefined;
    // ** current Table parameters updated dynamically during splitting
    this._currentTableSplitBottom = undefined;
    // 🤖 Keep raw split-bottom checkpoints for debugging;
    // todo: table.paginator can expose this to DevTools timelines.
    this._logSplitBottom_ = [];
    // ** current per-run caches
    this._currentRowShellCache = undefined;
    this._currentOverflowHelpers = undefined;

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
    // 🤖 Pin the current table context and provision per-run caches so downstream helpers read a consistent geometry snapshot.
    this._currentTable = _table;
    this._currentFirstPageBottom = _pageBottom;
    this._currentFullPageHeight = _fullPageHeight;
    this._currentRoot = _root;
    this._currentRowShellCache = new WeakMap();
    this._currentOverflowHelpers = this._composeOverflowHelpers();
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
    // 🤖 Walk the distributed rows, register page breaks, and rebuild table slices so each chunk fits the available viewport.
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
      // * _evaluateAndResolveRow() may roll back index to re-check newly inserted rows after splitting.
      index = this._evaluateAndResolveRow(index, splitStartRowIndexes);
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

  _evaluateAndResolveRow(rowIndex, splitStartRowIndexes) {
    // 🤖 Evaluate a single row against the current split window, then either keep it, reclaim short-tail space, or trigger overflow handling.
    // Input: rowIndex; mutates splitStartRowIndexes
    // May split/replace TRs and advance splitBottom;
    // returns possibly decremented index (re-check under new window).
    // Honors final-part reclaimed height.

    // * Keep the original parameters for logging.
    const origRowIndex = rowIndex;
    const origRowCount = this._currentTableDistributedRows.length;
    this._debug._ && console.group(`🔲 %c Check the Row # ${origRowIndex} (from ${origRowCount})`, '',);

    // Stage 1 — capture geometry snapshot relative to the current split window.
    const evaluation = this._node.paginationBuildRowEvaluationContext({
      rows: this._currentTableDistributedRows,
      rowIndex,
      table: this._currentTable,
      splitBottom: this._currentTableSplitBottom,
    });

    if (!evaluation?.row) {
      console.warn('[table.split] Missing row during evaluation.', { rowIndex });
      this.logGroupEnd(`Row # ${origRowIndex} (from ${origRowCount}) is checked`);
      return rowIndex;
    }

    if (this._debug._) {
      const fitsCurrentWindow = evaluation.fitsCurrentWindow;
      const logColor = fitsCurrentWindow ? 'green' : 'orange';
      const logOps = fitsCurrentWindow ? '<=' : '>';
      console.log(
        `%c📐 does row fit? %c ${fitsCurrentWindow} %c :: ${evaluation.nextMarker} ${logOps} ${this._currentTableSplitBottom} %c(Δ=${evaluation.delta})`,
        '',
        `font-weight:bold;color:${logColor};`,
        '',
        `color:${logColor};`
      );
    }

    this._debug._ && console.info({
      row: evaluation.row,
      rows: [...this._currentTableDistributedRows],
    });

    // Stage 2 — if the row fits entirely inside the present window, no pagination action is needed.
    if (evaluation.fitsCurrentWindow) {
      this._debug._ && console.log(`%c ✓ Row # ${rowIndex}: PASS`, 'color:green');
      this.logGroupEnd(`Row # ${origRowIndex} (from ${origRowCount}) is checked`);
      return rowIndex;
    }

    // Stage 3 — compute reclaimed budget of the final slice (bottom signpost skipped, TFOOT stays with the table).
    const extraCapacity = this._node.calculateFinalPartReclaimedHeight({
      signpostHeight: this._signpostHeight,
      tfootHeight: this._currentTableTfootHeight,
    });

    // Stage 4 — special-case the last row:
    // if removing the final signpost frees enough height,
    // let the current row stay intact (no extra part, no slicing).
    if (this._node.paginationCanAbsorbLastRow({
      evaluation,
      extraCapacity,
      splitBottom: this._currentTableSplitBottom,
      debug: this._debug,
    })) {
      // 🫟 Early tail drop on the very first split attempt:
      // Special case: last row can fit if we remove the bottom signpost (final chunk has no footer label).
      // If this is the last data row and the last slice height is small enough
      // to fit into the extra capacity of the final chunk (no bottom signpost + TFOOT),
      // skip creating the last slice row entirely.
      // FIXME: rowBottom is already measured in the evaluation helper; reuse stored geometry instead of recalculating.
      // Treat as fitting the final window: do not split and do not register a new chunk.
      this._debug._ && console.log('🫟 last-row-fits-without-bottom-signpost: skip split');
      this.logGroupEnd(`Row # ${origRowIndex} (from ${origRowCount}) is checked`);
      return rowIndex;
    }

    // Stage 5 — the row does not fit in the current window: route the row through spans fallback / slicing / scaling decisions.
    const updatedIndex = this._resolveOverflowingRow({
      evaluation,
      splitStartRowIndexes,
      extraCapacity,
    });

    this.logGroupEnd(`Row # ${origRowIndex} (from ${origRowCount}) is checked`);
    return updatedIndex;
  }

  // ===== Row Split Internals =====

  _resolveOverflowingRow({ evaluation, splitStartRowIndexes, extraCapacity }) {
    // 🤖 Route an overflowing row through ROWSPAN fallback, fresh slicing, or already-sliced recovery while keeping paginator state in sync.
    // Row exceeds the current window: decide between conservative fallback, slicing, or scaling.
    return this._node.paginationResolveOverflowingRow({
      evaluation,
      utils: {
        rowHasSpan: (row) => this._rowHasSpan(row),
        isSlice: (row) => this._node.isSlice(row),
      },
      handlers: {
        // Conservative fallback: defer to shared ROWSPAN handler with table-specific overflow logic.
        handleRowWithRowspan: () => this._node.paginationResolveRowWithRowspan({
          evaluation,
          splitStartRowIndexes,
          fullPageHeight: this._currentTableFullPartContentHeight,
          resolveOverflow: ({ evaluation, splitStartRowIndexes: indexes, availableRowHeight, fullPageHeight }) => (
            this._forwardOverflowFallback({
              rowIndex: evaluation.rowIndex,
              row: evaluation.row,
              availableRowHeight,
              fullPageHeight,
              splitStartRowIndexes: indexes,
              reasonTail: 'Row with ROWSPAN — move to next page',
              reasonFull: 'Row with ROWSPAN — scaled TDs to full page',
              branch: 'rowspan',
            })
          ),
          debug: this._debug,
          afterResolve: ({ tailWindowHeight, fullPageHeight }) => {
            if (this._debug._ && tailWindowHeight >= fullPageHeight) {
              console.warn('[table.fallback] ROWSPAN row required full-page scaling to fit.');
            }
          },
        }),
        // Primary path (Stage 5): attempt to slice the row using shared helpers + table-specific adapters.
        handleSplittableRow: () => this._resolveSplittableRow({ evaluation, splitStartRowIndexes, extraCapacity }),
        // Already sliced row overflow: reuse shared handler to either move or scale.
        handleAlreadySlicedRow: () => this._node.paginationResolveAlreadySlicedRow({
          evaluation,
          splitStartRowIndexes,
          fullPageHeight: this._currentTableFullPartContentHeight,
          debug: this._debug,
          resolveSplitFailure: ({ evaluation, splitStartRowIndexes: indexes, availableRowHeight, fullPageHeight }) => (
            this._forwardOverflowFallback({
              rowIndex: evaluation.rowIndex,
              row: evaluation.row,
              availableRowHeight,
              fullPageHeight,
              splitStartRowIndexes: indexes,
              reasonTail: `Slice doesn't fit tail — move to next page`,
              reasonFull: 'Scaled TD content to fit full page',
              branch: 'alreadySliced',
            })
          ),
        }),
      },
    });
  }

  _resolveSplittableRow({ evaluation, splitStartRowIndexes, extraCapacity }) {
    // 🤖 Delegate the Stage-5 "splittable" branch to shared pagination helpers and wire table-specific adapters for DOM mutations.
    const { rowIndex } = evaluation;

    this._debug._ && console.group(
      `%c 🔳 Try to split the ROW ${rowIndex} %c (from ${this._currentTableDistributedRows.length})`,
      'color:magenta;',
      '',
    );

    const updatedIndex = this._node.paginationResolveSplittableRow({
      evaluation,
      splitStartRowIndexes,
      extraCapacity,
      fullPageHeight: this._currentTableFullPartContentHeight,
      minPartLines: this._minPartLines,
      debug: this._debug,
      // Tag generated slices with source indices so DevTools trace origins.
      decorateRowSlice: ({ rowWrapper, rowIndex: sourceRowIndex, sliceIndex }) => {
        this._DOM.setAttribute(rowWrapper, `.splitted_row_${sourceRowIndex}_part_${sliceIndex}`);
      },
      onBudgetInfo: ({ evaluation, firstPartHeight, fullPartHeight }) => {
        this._debug._ && console.info({
          currRowTop: evaluation.rowTop,
          '• splitBottom': this._currentTableSplitBottom,
          '• is row sliced?': false,
          'remaining page space': evaluation.tailWindowHeight,
          'first part height': firstPartHeight,
          'full part height': fullPartHeight,
        });
      },
      handlers: {
        onReplaceRow: ({ evaluation, newRows }) => {
          this._replaceRowInDOM(evaluation.row, newRows);
        },
        onAbsorbTail: ({ newRows, extraCapacity }) => {
          this._node.absorbShortTrailingSliceIfFits({
            slices: newRows,
            extraCapacity,
            ownerLabel: 'table',
            debug: this._debug,
          });
        },
        onRefreshRows: ({ evaluation, newRows }) => {
          this._node.paginationRefreshRowsAfterSplit(this._getSplitterAdapter(), {
            rowIndex: evaluation.rowIndex,
            rowSlices: newRows,
          });
        },
        onPlacement: ({ evaluation, newRows, insufficientRemainingWindow, isFirstPartEmptyInAnyTD, needsScalingInFullPage }) => (
          this._node.paginationHandleRowSlicesPlacement({
            evaluation,
            table: this._currentTable,
            newRows,
            insufficientRemainingWindow,
            isFirstPartEmptyInAnyTD,
            needsScalingInFullPage,
            splitStartRowIndexes,
            pageBottom: this._currentTableSplitBottom,
            fullPageHeight: this._currentTableFullPartContentHeight,
            debug: this._debug,
            registerPageStartCallback: ({ targetIndex, reason }) => this._registerPageStartAt(targetIndex, splitStartRowIndexes, reason),
            scaleProblematicSliceCallback: (slice, targetHeight) => {
              if (!(targetHeight > 0)) return;
              this._debug._ && console.log('⚖️ scaleProblematicCellsToHeight');
              this._scaleProblematicCellsToHeight(slice, targetHeight, this._getRowShellHeights(slice));
            },
            applyFullPageScalingCallback: ({ row: slice, needsScalingInFullPage: needsScaling, fullPageHeight }) => {
              this._node.paginationApplyFullPageScaling({
                needsScalingInFullPage: needsScaling && Boolean(slice),
                payload: {
                  row: slice,
                  targetHeight: fullPageHeight,
                },
                scaleCallback: ({ row, targetHeight }) => {
                  this._debug._ && console.log('⚖️ scaleProblematicCellsToHeight');
                  return this._scaleProblematicCellsToHeight(row, targetHeight, this._getRowShellHeights(row));
                },
              });
            },
          })
        ),
      onSplitFailure: ({ evaluation, splitStartRowIndexes, availableRowHeight, fullPageHeight }) => (
        this._forwardOverflowFallback({
          rowIndex: evaluation.rowIndex,
          row: evaluation.row,
          availableRowHeight,
          fullPageHeight,
          splitStartRowIndexes,
          reasonTail: 'Split failed — move row to next page',
          reasonFull: 'Scaled TDs to fit full-page',
          branch: 'splitFailure',
        })
      ),
      },
    });

    this.logGroupEnd(`🔳 Try to split the ROW ${rowIndex} (from ${this._currentTableDistributedRows.length})`);
    return updatedIndex;
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
    const tableWrapperHeight = this._node.getEmptyNodeHeightByProbe(
      this._currentTable,
      // * We need content for the outer table tag to be rendered, but we reset
      // * the TD/TR styles because they are later considered individually for each cell.
      '<tr style="padding:0;border:0;"><td style="padding:0;border:0;"></td></tr>'
    );

    // TODO: Top margin is excluded since it's reset on new pages now!
    const tableTop = this._node.getTopForPageStartCandidate(this._currentTable, this._currentRoot);
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
      - tableTop // tableTopWithTopMargin
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
    // 🤖 Build the logical row array that paginator consumes: tbody rows plus trailing tfoot when present.
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
    // 🤖 Persist newly generated slices inside cached table entries so future geometry reads the updated row list.
    this._currentTableEntries.rows.splice(index, 1, ...newRows);
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
    // 🤖 Provide table-specific accessors so shared paginator utilities can read and update split-bottom geometry.
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
    // 🤖 Expose row collection/guard hooks for shared slicer helpers; keeps table entries and recorder metadata in sync after DOM edits.
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

  _composeOverflowHelpers() {
    // 🤖 Bundle paginator callbacks and scaling hooks so overflow resolvers can issue page breaks and cell scaling without touching Table internals.
    // Shared callbacks wrapping paginator + scaling hooks for reuse across helpers.
    // Scaling callback must only shrink overflowing cell content (TD/TH for tables, cells for grids),
    // keeping the structural row wrapper untouched so geometric reasoning remains predictable.
    const scaleCellsToHeightCallback = this._node.scaleCellsToHeight.bind(this._node);
    const getRowShellHeightsCallback = this._getRowShellHeights.bind(this);
    const registerPageStartCallback = this._registerPageStartAt.bind(this);
    const debugLogger = this._debug && this._debug._
      ? (message, payload) => console.log(message, payload)
      : undefined;

    const helpers = {
      ownerLabel: 'table',
      registerPageStartCallback,
      debugLogger,
      scaleProblematicCellsCallback: (row, targetHeight, cachedShells) => this._node.scaleRowCellsToHeight({
        ownerLabel: 'table',
        DOM: this._DOM,
        row,
        targetHeight,
        cachedShells,
        getRowShellHeightsCallback,
        scaleCellsToHeightCallback,
      }),
    };

    this._currentOverflowHelpers = helpers;
    return helpers;
  }

  _scaleProblematicCellsToHeight(row, targetHeight, shellsOpt) {
    // 🤖 Escalate to shared overflow scaler, passing cached shell heights so TD content shrinks precisely to the available height budget.
    // Scale only overflowing TD contents inside the row (shell height budget) — structure remains intact.
    // Two-tier safety note:
    // - Fine-grained scaling may already occur inside slicers.js (getSplitPoints), targeting nested nodes.
    // - This helper is the coarse fallback that touches only overflowing TD contents so the row fits the budget.
    //   TR geometry and non-problematic cells stay intact; grid/table callers wire their cell selectors.
    // - Tail windows still prefer moving the row; scaling kicks in only in full-page contexts via overflow helpers.
    const helpers = this._currentOverflowHelpers || this._composeOverflowHelpers();
    return helpers.scaleProblematicCellsCallback(row, targetHeight, shellsOpt);
  }

  _forwardOverflowFallback({
    rowIndex,
    row,
    availableRowHeight,
    fullPageHeight,
    splitStartRowIndexes,
    reasonTail,
    reasonFull,
    branch,
  }) {
    // 🤖 Common entry point for overflow recovery: delegate to shared helpers with table-specific adapters.
    // 🤖 Geometry: preserves detailed diagnostics per branch (ROWSPAN, already-sliced, split failure) while reusing one wiring path.
    // 🤖 Branch legend:
    // 🤖   - 'rowspan'       → Stage 5 fallback for rows containing ROWSPAN cells.
    // 🤖   - 'alreadySliced' → Rows that already carry slice markers but still overflow the window.
    // 🤖   - 'splitFailure'  → Fresh row failed to produce slices (shared splitter returned newRows = []).
    const helpers = this._currentOverflowHelpers || this._composeOverflowHelpers();
    const payload = {
      ownerLabel: `table:${branch}`,
      rowIndex,
      row,
      availableRowHeight,
      fullPageHeight,
      splitStartRowIndexes,
      reasonTail,
      reasonFull,
      registerPageStartCallback: helpers.registerPageStartCallback,
      scaleProblematicCellsCallback: helpers.scaleProblematicCellsCallback,
      debugLogger: helpers.debugLogger,
    };

    if (this._debug._) {
      console.log(
        `%c[table.overflow] branch=${branch} rowIndex=${rowIndex} tail=${availableRowHeight} full=${fullPageHeight}`,
        'color:orange; font-weight:bold',
        { reasonTail, reasonFull }
      );
    }

    if (branch === 'splitFailure') {
      return this._node.handleRowSplitFailure(payload);
    }
    return this._node.handleRowOverflow(payload);
  }

  _getRowShellHeights(row) {
    // 🤖 Cache per-cell shell heights so repeated scaling passes reuse the same geometry snapshot for the row wrapper.
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

  // ===== Builders =====
  // 👪👪👪👪👪👪👪👪👪👪👪👪👪👪👪👪

  _createTopSignpost() {
    // 🤖 Build the continuation label shown above intermediate table parts.
    // TODO(config): move signpost text/height to external config
    return this._node.createSignpost('(table continued)', this._signpostHeight)
  }

  _createBottomSignpost() {
    // 🤖 Build the continuation label shown below non-final parts to hint at more rows ahead.
    // TODO(config): move signpost text/height to external config
    return this._node.createSignpost('(table continues on the next page)', this._signpostHeight)
  }

  _replaceRowInDOM(row, newRows) {
    // 🤖 Swap the original TR with generated slices, tagging the source row for debug visibility.
    this._debug._ && this._DOM.setAttribute(row, '.🚫_must_be_removed');
    this._DOM.insertInsteadOf(row, ...newRows);
  }

  _createAndInsertTableSlice({ startId, endId, table, tableEntries }) {
    // 🤖 Clone structural pieces and attach a tbody fragment representing rows [startId, endId) as a standalone printable chunk.
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
    // 🤖 Prepare the last table part that retains TFOOT and rows from the final checkpoint onward.
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
    // 🤖 Store telemetry about generated table chunks so DevTools and diagnostics can inspect slice composition.
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
