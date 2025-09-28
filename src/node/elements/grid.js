import * as Logging from '../../utils/logging.js';
import * as Paginator from './table.paginator.js';
import * as GridAdapter from './grid.adapter.js';
import * as PartsRecorder from '../modules/parts.recorder.js';
import { createLoopGuard } from '../../utils/loopGuard.js';

const CONSOLE_CSS_END_LABEL = `background:#999;color:#FFF;padding: 0 4px;`;

export default class Grid {
  constructor({
    config,
    DOM,
    node,
    selector,
  }) {
    // * From config:
    this._debug = config.debugMode ? { ...config.debugConfig.grid } : {};
    this._assert = config.consoleAssert ? true : false;

    // * Private
    this._DOM = DOM;
    this._selector = selector;
    this._node = node;

    Object.assign(this, Logging);

    this._resetCurrent();

    // todo
    // 1) move to config
    // Grid:
    this._minBreakableGridRows = 4;

    // TODO make function
    // * From config:
    // - if null is set - the element is not created in createSignpost().
    this._signpostHeight = parseFloat(config.splitLabelHeight) || 0;

  }

  split(gridNode, pageBottom, fullPageHeight, root, computedStyle) {
    this._resetCurrent();

    // Flow outline (parity with simple tables):
    // 1. Collect child grid cells and partition them into visual rows.
    // 2. Measure available space: short first window vs full-page window.
    // 3. Walk rows, registering split indexes when the next row would overflow.
    //    • If the first row itself does not fit → move whole row to next page (🚧 refine logic).
    //    • If rows can be sliced into parts → reuse slicers (🚧 not implemented yet).
    // 4. Build parts by cloning wrappers and moving current rows.
    // 5. Leave original grid as the final slice; no signposts / reclaimed height for now.
    //
    // Long-term grid targets:
    // - support deep slicing of a row's content (mirroring table TD splitting).
    // - fallback for non-breakable items (IMG/SVG) via scaling similar to Table.
    // - guard/skip complex layouts (non-monotonic placement, spans) with explicit logs.

    this._debug._ && console.group('%c_splitGridNode', 'background:#00FFFF', gridNode);

    const gridCells = this._node.getPreparedChildren(gridNode);
    this._node.lockNodesWidths(gridCells);

    const nodeComputedStyle = computedStyle ? computedStyle : this._DOM.getComputedStyle(gridNode);
    // * Use this._node.setInitStyle:
    // * In some layouts grid stays `position: static`; force a relative context so
    // * offset-based getters work (otherwise offsets are taken from body and rows
    // * start looking like a single chunk).

    if (!gridCells.length) {
      this._node.setInitStyle (false, gridNode, nodeComputedStyle);
      this._debug._ && console.groupEnd();
      return [];
    }

    this._node.setInitStyle (true, gridNode, nodeComputedStyle);

    const layoutScan = this._scanGridLayout(gridNode, nodeComputedStyle);
    if (!layoutScan.safe) {
      this._debug._ && console.warn('[grid.split] skip:', layoutScan.reason);
      this._node.setInitStyle (false, gridNode, nodeComputedStyle);
      this._debug._ && console.groupEnd();
      return [];
    }

    const ROW_TOP_STEP = 0.5; // tolerate sub-pixel jitter when detecting row breaks
    const currentRows = [];
    let hasRowSpan = false;
    let hasColumnSpan = false;
    const rowIndexSet = new Set();
    let previousRowTop = null;

    gridCells.forEach((gridCell) => {
      // ***** Rely on vertical position only:
      // ***** we support linear, monotonic grids for now.
      const top = this._node.getTop(gridCell, gridNode);

      // * first element of a new line
      if (
        !currentRows.length || previousRowTop == null       // * 1st row
        || Math.abs(top - previousRowTop) > ROW_TOP_STEP  // * new row
      ) {
        currentRows.push([gridCell]); // * add cell #0 to new row group
        previousRowTop = top;       // * note down the top of new row
        return;
      }

      // * ordinary element of the current row
      currentRows[currentRows.length - 1].push(gridCell);

      // ** Detect spans and collect row-start indices.
      // ** If row-starts jump beyond known current rows (implicit tracks/gaps),
      // ** or any cell spans rows/columns, skip splitting this grid.
      const cellStyle = this._DOM.getComputedStyle(gridCell);
      const rowEnd = cellStyle.gridRowEnd || '';
      const colEnd = cellStyle.gridColumnEnd || '';
      hasRowSpan = hasRowSpan || rowEnd.includes('span');
      hasColumnSpan = hasColumnSpan || colEnd.includes('span');

      const rowStart = parseInt(cellStyle.gridRowStart, 10);
      Number.isFinite(rowStart) && rowIndexSet.add(rowStart);
      // todo: span w/o 'span' keyword
      // todo: gridRowEnd/gridColumnEnd as Num/-1
      // todo: gridRowStart asNaN (named lines)
      // todo: improve "implicit row gaps"?
      // - misses within a set of starts:
      // - for example, if rowIndexSet contains {1,3,5}, and 2 and 4 are missing?
    });

    const hasImplicitRowGaps = rowIndexSet.size > 0 && Math.max(...rowIndexSet) > currentRows.length;
    if (hasImplicitRowGaps) {
      this._debug._ && console.warn('[grid.split] skip: implicit row gaps detected');
      this._node.setInitStyle (false, gridNode, nodeComputedStyle);
      this._debug._ && console.groupEnd();
      return [];
    }

    if (hasRowSpan || hasColumnSpan) {
      this._debug._ && console.warn('[grid.split] skip: span detected (row or column)');
      this._node.setInitStyle (false, gridNode, nodeComputedStyle);
      this._debug._ && console.groupEnd();
      return [];
    }

    this._debug._ && console.log('[grid.split] currentRows:', currentRows)

    // ** Prepare gridNode parameters for splitting
    const nodeTop = this._node.getTop(gridNode, root);
    const nodeWrapperHeight = this._node.getEmptyNodeHeight(gridNode);
    const firstPartHeight = pageBottom
      - nodeTop
      // - this._signpostHeight
      - nodeWrapperHeight;
    const fullPagePartHeight = fullPageHeight
      // - 2 * this._signpostHeight
      - nodeWrapperHeight;

    this._debug._ && console.log({firstPartHeight, fullPagePartHeight});

    //? #grid_refactor
    //  captures the active grid node, current rows, and full-page metrics
    //  in instance fields, letting the adapter feed consistent data
    //  into the shared paginator log, share currentRows through a single entries container,
    //  and collect the parts we build for downstream analysis/debugging.
    this._currentGridNode = gridNode;
    this._currentGridRows = currentRows;
    this._currentGridFullPartHeight = fullPagePartHeight;
    this._currentGridSplitLog = [];
    this._currentGridEntries = PartsRecorder.createEntries({ owner: gridNode, currentRows });
    this._currentGridRecordedParts = this._currentGridEntries;
    this._currentGridNode.__html2pdfRecordedParts = this._currentGridRecordedParts; // Expose for DevTools and external diagnostics

    // ** If there are enough rows for the split to be readable,
    // ** and the gridNode is not too big (because of the content),
    // ** then we will split it.
    if (
      currentRows.length < this._minBreakableGridRows
      && this._DOM.getElementOffsetHeight(gridNode) < fullPageHeight
    ) {
      this._debug._ && console.log(`%c END [grid.split]: DON'T SPLIT, it isn't breakable and fits in the page`, CONSOLE_CSS_END_LABEL);
      this._node.setInitStyle(false, gridNode, nodeComputedStyle);
      this._resetCurrent();
      this._debug._ && console.groupEnd();
      return []
    }

    // === Pagination across rows ===
    //? #grid_refactor
    //  replaces bespoke split-bottom math with updateSplitBottom/registerPageStartAt,
    //  so page windows and split indexes are maintained by the same helpers Table uses.

    const splitStartRowIndexes = [];
    let rowIndex = 0;
    const EPS = 0.5;
    const entries = this._currentGridEntries;
    //  *** #tempLoopGuard
    //  loopGuardLimit is just a safety cap: the while-loop should process each grid row
    //  a handful of times (tail window, full-page attempt, scaling).
    //  Even in the worst case we don’t expect to revisit any row more than a few passes,
    //  so we multiply the row count by 6 to give enough slack.
    //  If the loop ever exceeds that budget, something is wrong and the guard
    //  fires an assertion instead of spinning forever.
    const loopGuardLimit = Math.max(1, (currentRows.length || 1) * 6);
    const tickLoopGuard = createLoopGuard({
      label: 'grid.split',
      limit: loopGuardLimit,
      assert: this._assert,
    });

    this._updateCurrentGridSplitBottom(firstPartHeight, 'start with initial window');

    while (rowIndex < currentRows.length) {
      tickLoopGuard();

      const row = currentRows[rowIndex];
      const rowTop = this._getRowTop(row, gridNode);
      const rowBottom = this._getRowBottom(row, gridNode);
      const pageBottom = (typeof this._currentGridSplitBottom === 'number')
        ? this._currentGridSplitBottom
        : firstPartHeight;

      if (rowBottom <= pageBottom + EPS) {
        rowIndex += 1;
        continue;
      }

      const remainingSpace = pageBottom - rowTop;
      let splitResult = null;
      let usedRemainingWindow = false;

      if (remainingSpace > EPS) {
        splitResult = this._splitGridRow({
          rowIndex,
          row,
          gridNode: gridNode,
          firstPartHeight: remainingSpace,
          fullPagePartHeight,
        });
        usedRemainingWindow = true;
      }

      if (!splitResult || !splitResult.newRows.length) {
        splitResult = this._splitGridRow({
          rowIndex,
          row,
          gridNode: gridNode,
          firstPartHeight: fullPagePartHeight,
          fullPagePartHeight,
        });
        usedRemainingWindow = false;
      }

      if (splitResult && splitResult.newRows.length) {

        // * Keep currentRows/entries/guards in sync with freshly generated slices via shared kernel helper.
        this._node.paginationRefreshRowsAfterSplit(this._getSplitterAdapter(), {
          rowIndex,
          rowSlices: splitResult.newRows,
        });

        const firstSliceCells = currentRows[rowIndex];
        const firstSliceTop = this._getRowTop(firstSliceCells, gridNode);
        const firstSliceBottom = this._getRowBottom(firstSliceCells, gridNode);
        const placement = this._node.evaluateRowSplitPlacement({
          usedRemainingWindow,
          isFirstPartEmpty: splitResult.isFirstPartEmptyInAnyCell,
          firstSliceTop,
          firstSliceBottom,
          pageBottom,
          epsilon: EPS,
        });

        if (placement.placeOnCurrentPage) {
          if (placement.remainingWindowSpace > EPS) {
            this._scaleGridCellsToHeight(firstSliceCells, placement.remainingWindowSpace);
          }
          this._registerPageStartAt(rowIndex + 1, splitStartRowIndexes, 'Grid row slice — next part starts page');
        } else {
          this._node.paginationApplyFullPageScaling({
            needsScalingInFullPage: splitResult.needsScalingInFullPage,
            payload: { cells: firstSliceCells, targetHeight: fullPagePartHeight },
            scaleCallback: ({ cells, targetHeight }) => this._scaleGridCellsToHeight(cells, targetHeight),
          });
          this._registerPageStartAt(rowIndex, splitStartRowIndexes, 'Grid row overflow — move row to next page');
        }

        continue;
      }

      if (splitResult && splitResult.needsScalingInFullPage) {
        // No slices generated but slicers signalled that full-page scaling is required.
        // Apply the shared fallback immediately so the row fits before we move on.
        const rowCellsForScaling = currentRows[rowIndex];
        const cells = Array.isArray(rowCellsForScaling) ? rowCellsForScaling : [rowCellsForScaling].filter(Boolean);
        if (cells.length) {
          this._node.paginationApplyFullPageScaling({
            needsScalingInFullPage: true,
            payload: { cells, targetHeight: fullPagePartHeight },
            scaleCallback: ({ cells: scalingCells, targetHeight }) => this._scaleGridCellsToHeight(scalingCells, targetHeight),
          });
        }
        this._registerPageStartAt(rowIndex, splitStartRowIndexes, 'Grid oversized row scaled for full page');
        continue;
      }

      if (rowIndex > 0) {
        this._registerPageStartAt(rowIndex, splitStartRowIndexes, 'Grid row overflow — move row to next page');
        continue;
      }

      this._debug._ && console.warn('[grid.split] first row cannot be split to fit page', { row });
      this._node.setInitStyle (false, gridNode, nodeComputedStyle);
      this._resetCurrent();
      this._debug._ && console.groupEnd();
      return [];
    }

    this._debug._ && console.log('splitStartRowIndexes', splitStartRowIndexes);

    const finalStartId = splitStartRowIndexes.length ? splitStartRowIndexes.at(-1) : 0;
    // For telemetry: finalStartId mirrors table slices even though final build does not need it
    const sliceResults = splitStartRowIndexes
      .map((value, index, array) => this._buildGridSplit({
        startId: array[index - 1] || 0,
        endId: value,
        node: gridNode,
        entries,
      }))
      .filter(Boolean);

    const splits = [
      ...sliceResults.map(result => result.part),
      this._createAndInsertGridFinalSlice({ node: gridNode, entries, startId: finalStartId }),
    ];

    this._debug._ && console.log(
      'splits', splits
    );
    this._debug._ && console.log('[grid.split] recordedParts', this._currentGridRecordedParts?.parts); // available via gridNode.__html2pdfRecordedParts

    // create LAST PART
    // TODO ??? is that really needed?
    // const lastPart = this._node.createWithFlagNoBreak();
    // gridNode.before(lastPart);
    // this._DOM.insertAtEnd(
    //   lastPart,
    //   // this._node.createSignpost('(table continued)', this._signpostHeight),
    //   gridNode
    // );

    // parts handling
    splits.forEach((part, index) => this._DOM.setAttribute(part, '[part]', `${index}`));

    this._node.setInitStyle (false, gridNode, nodeComputedStyle);

    this._debug._ && console.log(`%c END [grid.split]`, CONSOLE_CSS_END_LABEL);
    this._debug._ && console.groupEnd();
    this._resetCurrent();

    return splits
  }

  //? #grid_refactor
  //  adds _resetCurrent, _getPaginatorAdapter,
  //  and thin wrappers around the shared paginator functions
  //  (_updateCurrentGridSplitBottom, _registerPageStartAt)
  //  plus adapter hooks (_createAndInsertGridSlice, _createAndInsertGridFinalSlice)
  //  and a shared entries container so the adapter sees the same currentRows reference
  //  the paginator mutates, whether cells stay as elements or become wrappers.

  _resetCurrent() {
    this._currentGridNode = undefined;
    this._currentGridRows = undefined;
    this._currentGridEntries = undefined;
    this._currentGridRecordedParts = undefined;
    this._currentGridSplitBottom = undefined;
    this._currentGridFullPartHeight = undefined;
    this._currentGridSplitLog = undefined;
    this._currentGridRowFlags = undefined;
  }

  _getPaginatorAdapter() {
    return {
      label: 'grid',
      getSplitBottom: () => this._currentGridSplitBottom,
      setSplitBottom: (value) => { this._currentGridSplitBottom = value; },
      computeSplitBottomForElement: (element) => {
        if (!element || !this._currentGridNode) {
          return this._currentGridSplitBottom || 0;
        }
        return this._node.getTop(element, this._currentGridNode) + (this._currentGridFullPartHeight || 0);
      },
      getRows: () => {
        if (!Array.isArray(this._currentGridRows)) {
          return [];
        }
        return this._currentGridRows.map((group) => {
          if (!group) {
            return null;
          }
          if (group instanceof HTMLElement) {
            return group;
          }
          if (Array.isArray(group)) {
            const cell = group.find((candidate) => candidate instanceof HTMLElement);
            if (cell) {
              return cell;
            }
            const top = this._getRowTop(group, this._currentGridNode);
            return Number.isFinite(top) ? top : null;
          }
          const top = this._getRowTop(group, this._currentGridNode);
          return Number.isFinite(top) ? top : null;
        });
      },
      shouldAssert: () => this._assert,
      getDebug: () => this._debug,
      getSplitBottomLog: () => this._currentGridSplitLog,
    };
  }

  _getSplitterAdapter() {
    return {
      label: 'grid',
      rows: {
        getCurrentRows: () => this._currentGridRows || [],
        replaceRow: ({ rowIndex, rowSlices }) => {
          if (!Array.isArray(this._currentGridRows)) return;
          this._node.replaceCurrentRowsAfterRowSplit({
            currentRows: this._currentGridRows,
            index: rowIndex,
            rowSlices,
          });
        },
        syncEntries: () => {
          if (this._currentGridEntries) {
            this._currentGridEntries.currentRows = this._currentGridRows;
          }
          if (this._currentGridRecordedParts) {
            this._currentGridRecordedParts.currentRows = this._currentGridRows;
          }
        },
        getGuardConfig: () => ({
          rows: this._currentGridRows || [],
          DOM: this._DOM,
        }),
      },
      guards: {
        onFlags: ({ flags }) => {
          this._currentGridRowFlags = flags;
        },
      },
    };
  }

  _updateCurrentGridSplitBottom(elementOrValue, message = 'unknown case') {
    Paginator.updateSplitBottom(this._getPaginatorAdapter(), elementOrValue, message);
  }

  _registerPageStartAt(index, splitStartRowIndexes, reason = 'register page start') {
    Paginator.registerPageStartAt(this._getPaginatorAdapter(), index, splitStartRowIndexes, reason);
  }

  _scaleGridCellsToHeight(cells, targetHeight) {
    if (!Array.isArray(cells) || !cells.length || !(targetHeight > 0)) {
      return false;
    }
    const shells = this._node.paginationComputeCellShellHeights({ cells });
    // In debug builds log the cell heights before/after scaling so we can confirm
    // geometry changed; otherwise silent overflow is hard to diagnose.
    const beforeHeights = this._debug._ ? cells.map(cell => this._DOM.getElementOffsetHeight(cell)) : null;
    const scaled = this._node.paginationScaleCellsToHeight({ cells, targetHeight, shells });
    if (this._debug._) {
      const afterHeights = cells.map(cell => this._DOM.getElementOffsetHeight(cell));
      console.log('[grid.scaleCells] target:', targetHeight, 'shells:', shells, 'before:', beforeHeights, 'after:', afterHeights, 'scaled:', scaled);
    }
    return scaled;
  }

  _buildGridSplit({ startId, endId, node, entries }) {
    const currentRows = entries?.currentRows || this._currentGridRows || [];
    if (startId === endId) {
      // Empty slice means pagination markers collided; log and assert in dev.
      this._debug._ && console.warn('[grid.split] _buildGridSplit: skip empty slice request', startId, endId);
      this._assert && console.assert(false, '[grid.split] _buildGridSplit: empty slice encountered');
      return null;
    }
    if (this._debug._) {
      const rowsPreview = currentRows.slice(startId, endId);
      console.log(`=> [grid.split] _buildGridSplit: slice rows [${startId}, ${endId})`, rowsPreview);
    }
    const part = this._createAndInsertGridSlice({ startId, endId, node, entries });
    const telemetryRows = this._collectGridTelemetryRows(currentRows, startId, endId);
    this._recordGridPart(part, {
      startId,
      endId,
      type: 'slice',
      rows: telemetryRows,
    });
    return { part, telemetryRows };
  }

  _createAndInsertGridSlice({ startId, endId, node, entries }) {
    return GridAdapter.createAndInsertGridSlice(this, { startId, endId, node, entries });
  }

  _createAndInsertGridFinalSlice({ node, entries, startId }) {
    const part = GridAdapter.createAndInsertGridFinalSlice(this, { node, entries });
    const currentRows = entries?.currentRows || this._currentGridRows || [];
    const telemetryRows = this._collectGridTelemetryRows(currentRows, startId);
    this._recordGridPart(part, {
      startId,
      endId: currentRows.length,
      type: 'final',
      rows: telemetryRows,
    });
    return part;
  }

  // TODO(grid/table): evaluate moving telemetry collection into a shared helper (see docs/_Grid_Table_Refactor_Roadmap.md).
  _collectGridTelemetryRows(currentRows, startId, endId) {
    if (!Array.isArray(currentRows)) {
      return [];
    }
    const slice = currentRows.slice(startId, typeof endId === 'number' ? endId : undefined);
    return slice.map((row, offset) => {
      const cells = Array.isArray(row) ? [...row] : [row];
      return {
        rowIndex: startId + offset,
        row,
        cells,
      };
    });
  }

  _recordGridPart(part, meta = {}) {
    const entries = this._currentGridRecordedParts;
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

  _splitGridRow({ rowIndex, row, gridNode, firstPartHeight, fullPagePartHeight }) {
    if (!Array.isArray(row) || !row.length) {
      return { newRows: [], isFirstPartEmptyInAnyCell: false, needsScalingInFullPage: false };
    }

    const shells = row.map(() => 0);
    const computed = this._node.getSplitPointsPerCells(
      row,
      shells,
      firstPartHeight,
      fullPagePartHeight,
      gridNode
    );

    let { needsScalingInFullPage } = computed;
    const splitPointsPerCell = (computed.splitPointsPerCell || []).map((points) => {
      if (!Array.isArray(points) || !points.length) {
        return [];
      }
      if (points.length === 1 && points[0] === null) {
        // Slicers emit [null] when a cell cannot be split – table path interprets
        // this as “scale the whole row on the next page”. Mirror that here so grid
        // escalates to full-page fallback instead of attempting to build slices
        // with phantom entries.
        needsScalingInFullPage = true;
        return [];
      }
      return points.filter(point => point != null);
    });

    const hasSplits = splitPointsPerCell.some(list => list.length);

    if (!hasSplits) {
      return {
        newRows: [],
        isFirstPartEmptyInAnyCell: computed.isFirstPartEmptyInAnyCell,
        needsScalingInFullPage,
      };
    }

    row.forEach(cell => this._node.setFlagSlice(cell));

    const anchor = row[0];
    const generatedRows = this._node.paginationBuildBalancedRowSlices({
      originalRow: row,
      originalCells: row,
      splitPointsPerCell,
      sliceCell: ({ cell, index, splitPoints }) => this._node.sliceNodeBySplitPoints({ index, rootNode: cell, splitPoints }),
      beginRow: () => ({ fragment: this._DOM.createDocumentFragment(), cells: [] }),
      cloneCellFallback: (originalCell) => this._DOM.cloneNodeWrapper(originalCell),
      handleCell: ({ context, cellClone }) => {
        this._node.setFlagSlice(cellClone);
        context.fragment.append(cellClone);
        context.cells.push(cellClone);
      },
      finalizeRow: ({ context }) => {
        this._DOM.insertBefore(anchor, context.fragment);
        return context.cells;
      },
    });

    row.forEach(cell => this._DOM.removeNode(cell));

    return {
      newRows: generatedRows,
      isFirstPartEmptyInAnyCell: computed.isFirstPartEmptyInAnyCell,
      needsScalingInFullPage,
    };
  }

  _getRowTop(row, gridNode) {
    if (Array.isArray(row)) {
      let minTop = Infinity;
      row.forEach(cell => {
        const candidate = this._node.getTop(cell, gridNode);
        if (Number.isFinite(candidate)) {
          minTop = Math.min(minTop, candidate);
        }
      });
      return minTop === Infinity ? 0 : minTop;
    }
    if (row) {
      return this._node.getTop(row, gridNode) || 0;
    }
    return 0;
  }

  _getRowBottom(row, gridNode) {
    if (Array.isArray(row)) {
      let maxBottom = -Infinity;
      row.forEach(cell => {
        // Include margins because grid rows often rely on bottom margin and gap
        // spacing; offsetHeight alone would miss that extra geometry and lead to
        // false "fits exactly" decisions.
        const candidate = this._node.getBottomWithMargin(cell, gridNode);
        if (Number.isFinite(candidate)) {
          maxBottom = Math.max(maxBottom, candidate);
        }
      });
      return maxBottom === -Infinity ? 0 : maxBottom;
    }
    if (row) {
      return this._node.getBottomWithMargin(row, gridNode) || 0;
    }
    return 0;
  }

  _scanGridLayout(_node, nodeComputedStyle) {
    const autoFlow = nodeComputedStyle.gridAutoFlow || '';
    if (!autoFlow.startsWith('row')) {
      return { safe: false, reason: `grid-auto-flow=${autoFlow}` };
    }
    if (autoFlow.includes('dense')) {
      // TODO(grid): support dense flow by re-evaluating row ordering.
      return { safe: false, reason: 'grid-auto-flow dense not supported yet' };
    }

    const templateAreas = nodeComputedStyle.gridTemplateAreas || 'none';
    if (templateAreas !== 'none') {
      return { safe: false, reason: 'grid-template-areas present' };
    }

    const templateColumns = nodeComputedStyle.gridTemplateColumns || '';
    const templateRows = nodeComputedStyle.gridTemplateRows || '';
    const complexTemplate = (value) => (
      value.includes('subgrid') ||
      value.includes('auto-fit') ||
      value.includes('auto-fill') ||
      value.includes('fit-content')
    );
    if (complexTemplate(templateColumns) || complexTemplate(templateRows)) {
      return { safe: false, reason: 'complex track sizing (subgrid/auto-fit/fit-content)' };
    }

    const hasNamedLines = /\[.*?\]/.test(templateColumns) || /\[.*?\]/.test(templateRows);
    if (hasNamedLines) {
      // TODO(grid): replicate named lines per slice once templates are copied over.
      return { safe: false, reason: 'named grid lines detected' };
    }

    return { safe: true };
  }

}
