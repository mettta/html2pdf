// Shared branching logic for resolving overflowing rows during pagination.
// Heavy DOM mutations are delegated through adapter callbacks so table/grid can reuse the same flow.

/**
 * 🤖 Route an overflowing row through ROWSPAN fallback, fresh slicing, or already-sliced handling.
 * 🤖 Geometry: inspects flags (ROWSPAN, slice markers) to pick the appropriate Stage-5 branch without duplicating caller logic.
 */
export function paginationResolveOverflowingRow({
  evaluation,
  utils = {},
  handlers = {},
}) {
  if (!evaluation || !evaluation.row) {
    return evaluation?.rowIndex ?? 0;
  }

  const {
    rowHasSpan = () => false,
    isSlice = () => false,
  } = utils;

  const {
    handleRowWithRowspan = () => evaluation.rowIndex,
    handleSplittableRow = () => evaluation.rowIndex,
    handleAlreadySlicedRow = () => evaluation.rowIndex,
  } = handlers;

  const { row } = evaluation;

  if (rowHasSpan(row, evaluation)) {
    return handleRowWithRowspan({ evaluation });
  }

  if (!isSlice(row, evaluation)) {
    return handleSplittableRow({ evaluation });
  }

  return handleAlreadySlicedRow({ evaluation });
}

/**
 * 🤖 Apply conservative overflow strategy for ROWSPAN rows: move to next page or scale in a full-page window.
 * 🤖 Geometry: ROWSPAN prevents slicing, so we reuse the overflow resolver with the current tail height as available budget.
 */
export function paginationResolveRowWithRowspan({
  evaluation,
  splitStartRowIndexes,
  fullPageHeight,
  resolveOverflow,
  debug,
  afterResolve,
}) {
  const { rowIndex, tailWindowHeight } = evaluation;
  if (debug && debug._) {
    console.log('%c ⚠️ Row has ROWSPAN; use conservative fallback (no slicing)', 'color:DarkOrange; font-weight:bold');
  }
  const result = resolveOverflow({
    rowIndex,
    evaluation,
    availableRowHeight: tailWindowHeight,
    splitStartRowIndexes,
    fullPageHeight,
  });
  afterResolve?.({ evaluation, tailWindowHeight, fullPageHeight, result });
  return result;
}

/**
 * 🤖 Handle rows that are already marked as slices but still overflow, forwarding to overflow fallback.
 * 🤖 Geometry: re-evaluates tail space and logging before invoking row-level recovery.
 */
export function paginationResolveAlreadySlicedRow({
  evaluation,
  splitStartRowIndexes,
  resolveSplitFailure,
  fullPageHeight,
  debug,
}) {
  const { rowIndex, row, tailWindowHeight, delta } = evaluation;
  if (debug && debug._) {
    console.log(`%c Row # ${rowIndex} is slice! but don't fit`, 'color:DarkOrange; font-weight:bold', row);
    console.warn('%c SUPER BIG', 'background:red;color:white', delta, {
      part: fullPageHeight,
    });
  }
  return resolveSplitFailure({
    evaluation,
    splitStartRowIndexes,
    availableRowHeight: tailWindowHeight,
    fullPageHeight,
  });
}

/**
 * 🤖 Compute the height budget for the first slice: stay in tail window or escalate to full page if tail space is too small.
 */
export function paginationCalculateRowSplitBudget({
  tailWindowHeight,
  minMeaningfulRowSpace,
  fullPartHeight,
  debug,
}) {
  // * Insufficient remaining page space:
  // * Remaining space cannot host a meaningful fragment of the row on the current page,
  // * so we escalated to full-page height for the first part.
  if (tailWindowHeight < minMeaningfulRowSpace) {
    debug && debug._ && console.log(
      `%c ${tailWindowHeight} < ${minMeaningfulRowSpace} %c (remainingPageSpace < minMeaningfulRowSpace) → use full-page budget for the first part`,
      'color:red; font-weight:bold; background:#F1E9D2',
      '',
    );
    return {
      firstPartHeight: fullPartHeight,
      insufficientRemainingWindow: true,
    };
  }

  return {
    firstPartHeight: tailWindowHeight,
    insufficientRemainingWindow: false,
  };
}

/**
 * 🤖 Generate balanced row slices using shared split-point calculations and adapter callbacks.
 * 🤖 Geometry: pre-measures cell shells then slices each cell so resulting rows preserve column alignment.
 */
export function paginationSplitRow({
  rowIndex,
  row,
  firstPartHeight,
  fullPageHeight,
  debug,
  decorateRowSlice,
  rowAdapter,
}) {
  if (!row) {
    return { newRows: [], isFirstPartEmptyInAnyTD: false, needsScalingInFullPage: false };
  }

  const adapter = rowAdapter ?? createDefaultRowAdapter.call(this, { row, rowIndex, decorateRowSlice });

  const parentForSplit = adapter.getParentContainer?.({ row, rowIndex }) ?? row;
  const originalCells = adapter.getOriginalCells?.({ row, rowIndex }) ?? [];
  if (!Array.isArray(originalCells) || originalCells.length === 0) {
    return { newRows: [], isFirstPartEmptyInAnyTD: false, needsScalingInFullPage: false };
  }

  const shellHeights = adapter.getShellHeights?.({ row, rowIndex, cells: originalCells }) ?? [];
  debug && debug._ && console.log('🧿 row shell heights', shellHeights);

  adapter.markOriginalRow?.({ row, rowIndex, cells: originalCells });

  const computed = this.getSplitPointsPerCells(
    originalCells,
    shellHeights,
    firstPartHeight,
    fullPageHeight,
    parentForSplit,
  ) || {};
  debug && debug._ && console.log('[✖️] getSplitPointsPerCells result:', computed);

  const splitPointsPerCell = computed.splitPointsPerCell || [];
  const isFirstPartEmptyInAnyTD = computed.isFirstPartEmptyInAnyCell;
  const needsScalingInFullPage = computed.needsScalingInFullPage;

  const sliceCell = adapter.sliceCell || (({ cell, index, splitPoints }) => this.sliceNodeBySplitPoints({ index, rootNode: cell, splitPoints }));
  const beginRow = adapter.beginRow || (({ originalRow, sliceIndex }) => {
    const rowWrapper = this._DOM.cloneNodeWrapper(originalRow);
    decorateRowSlice?.({ rowWrapper, rowIndex, sliceIndex, originalRow });
    return { rowWrapper };
  });
  const cloneCellFallback = adapter.cloneCellFallback || ((origCell) => this._DOM.cloneNodeWrapper(origCell));
  const handleCell = adapter.handleCell || (({ context, cellClone }) => {
    this._DOM.insertAtEnd(context.rowWrapper, cellClone);
  });
  const finalizeRow = adapter.finalizeRow || (({ context }) => context.rowWrapper);

  const newRows = [];
  const hasSplits = splitPointsPerCell.some(points => Array.isArray(points) && points.length);
  if (hasSplits) {
    const generatedRows = this.paginationBuildBalancedRowSlices({
      originalRow: row,
      originalCells,
      splitPointsPerCell,
      sliceCell,
      beginRow,
      cloneCellFallback,
      handleCell,
      finalizeRow,
    });
    newRows.push(...generatedRows);
  } else if (debug && debug._) {
    console.log('🔴 There is no Split');
  }

  // ********************
  // * normalize cuts in the resulting cells in rows
  newRows.length && this.markSliceCutsInRows(newRows);

  debug && debug._ && console.log('%c newRows \n', 'color:magenta; font-weight:bold', newRows);

  return { newRows, isFirstPartEmptyInAnyTD, needsScalingInFullPage };
}

function createDefaultRowAdapter({ row, rowIndex, decorateRowSlice }) {
  const isArrayRow = Array.isArray(row);
  const self = this;

  return {
    getParentContainer: () => (isArrayRow ? null : row),
    getOriginalCells: () => (
      isArrayRow
        ? [...row]
        : [...self._DOM.getChildren(row)]
    ),
    getShellHeights: ({ cells }) => (
      isArrayRow
        ? []
        : self.getTableRowShellHeightByTD(row)
    ),
    markOriginalRow: ({ cells }) => {
      if (isArrayRow) {
        // cells.forEach(cell => self.setFlagSlice(cell));
      } else {
        self.setFlagSlice(row);
      }
    },
    // * beginRow is the starter template for each future slice.
    // * For grid (row = array of cells) we prep { cells: [] } — only the cells are kept; they share the original grid container.
    // * For table (row = <tr>), we clone the <tr> so the new fragment inherits borders, attributes, and width limits; dev-attrs/log flags are applied right away.
    beginRow: ({ originalRow, sliceIndex }) => {
      if (isArrayRow) {
        return { cells: [] };
      }
      const rowWrapper = self._DOM.cloneNodeWrapper(originalRow);
      decorateRowSlice?.({ rowWrapper, rowIndex, sliceIndex, originalRow });
      return { rowWrapper };
    },
    cloneCellFallback: (origCell) => self._DOM.cloneNodeWrapper(origCell),
    handleCell: ({ context, cellClone }) => {
      if (isArrayRow) {
        self.setFlagSlice(cellClone);
        context.cells.push(cellClone);
      } else {
        self._DOM.insertAtEnd(context.rowWrapper, cellClone);
      }
    },
    // * finalizeRow returns what paginationProcessRowSplitResult will insert:
    // * For grid it returns the built cell array (context.cells) that the grid-adapter can render into a DOM fragment.
    // * For table it returns the ready <tr> clone (context.rowWrapper) — directly inserted into the table.
    finalizeRow: ({ context }) => (isArrayRow ? context.cells : context.rowWrapper),
  };
}

/**
 * 🤖 Orchestrate DOM replacement, recorder updates, placement, and fallback after slicing.
 * 🤖 Geometry: decides whether the new slices stay on current page, absorb tail, or require full-page scaling.
 */
export function paginationProcessRowSplitResult({
  evaluation,
  splitResult,
  splitStartRowIndexes,
  insufficientRemainingWindow,
  extraCapacity,
  fullPageHeight,
  debug,
  handlers = {},
}) {
  // * Shared post-processing: coordinates DOM replacement, recorder updates, placement, and fallback.
  const { newRows, isFirstPartEmptyInAnyTD, needsScalingInFullPage } = splitResult || {};
  const { rowIndex, row, isLastRow, tailWindowHeight } = evaluation;

  const {
    onReplaceRow,
    onAbsorbTail,
    onRefreshRows,
    onPlacement,
    onSplitFailure,
  } = handlers;

  if (Array.isArray(newRows) && newRows.length) {
    onReplaceRow?.({ evaluation, newRows });
    if (isLastRow) {
      onAbsorbTail?.({ evaluation, newRows, extraCapacity });
    }
    onRefreshRows?.({ evaluation, newRows, splitStartRowIndexes });
    return onPlacement?.({
      evaluation,
      newRows,
      insufficientRemainingWindow,
      isFirstPartEmptyInAnyTD,
      needsScalingInFullPage,
      splitStartRowIndexes,
    }) ?? evaluation.rowIndex;
  }

  // * If the split failed and the array of new rows is empty,
  // * we need to take action, because the row did not fit.
  if (debug && debug._) {
    console.log(
      `%c The row is not split. (ROW.${rowIndex})`,
      'color:orange',
      row,
    );
  }

  return onSplitFailure?.({
    evaluation,
    splitStartRowIndexes,
    availableRowHeight: tailWindowHeight,
    fullPageHeight,
  }) ?? evaluation.rowIndex;
}

/**
 * 🤖 Full Stage-5 pipeline for splittable rows: compute budget, slice, then post-process placement.
 */
export function paginationResolveSplittableRow({
  evaluation,
  splitStartRowIndexes,
  extraCapacity,
  fullPageHeight,
  minPartLines,
  debug,
  decorateRowSlice,
  onBudgetInfo,
  handlers = {},
}) {
  if (!evaluation || !evaluation.row) {
    return evaluation?.rowIndex ?? 0;
  }

  const { row } = evaluation;
  const minMeaningfulRowSpace = this.getTableRowHeight(row, minPartLines);
  const budget = this.paginationCalculateRowSplitBudget({
    tailWindowHeight: evaluation.tailWindowHeight,
    minMeaningfulRowSpace,
    fullPartHeight: fullPageHeight,
    debug,
  });

  onBudgetInfo?.({ evaluation, firstPartHeight: budget.firstPartHeight, fullPartHeight: fullPageHeight });

  const rowSliceAdapterFactory = handlers.getRowSliceAdapter;
  const rowSliceAdapter = rowSliceAdapterFactory?.({ evaluation, row, rowIndex: evaluation.rowIndex, decorateRowSlice });

  const splitResult = this.paginationSplitRow({
    rowIndex: evaluation.rowIndex,
    row,
    firstPartHeight: budget.firstPartHeight,
    fullPageHeight,
    debug,
    decorateRowSlice,
    rowAdapter: rowSliceAdapter,
  });

  return this.paginationProcessRowSplitResult({
    evaluation,
    splitResult,
    splitStartRowIndexes,
    insufficientRemainingWindow: budget.insufficientRemainingWindow,
    extraCapacity,
    fullPageHeight,
    debug,
    handlers,
  });
}

/**
 * 🤖 Decide where the first slice lives: stay in tail window (with optional trimming) or move entire row to a full-page window.
 * 🤖 Geometry: compares slice top/bottom against current splitBottom and registers page starts accordingly.
 */
export function paginationHandleRowSlicesPlacement({
  evaluation,
  table,
  newRows,
  insufficientRemainingWindow,
  isFirstPartEmptyInAnyTD,
  needsScalingInFullPage,
  splitStartRowIndexes,
  pageBottom,
  fullPageHeight,
  debug,
  registerPageStartCallback,
  scaleProblematicSliceCallback,
  applyFullPageScalingCallback,
}) {
  // Decide where freshly generated slices should live: keep first slice in the current
  // tail window (possibly trimming to the remaining height) or escalate the whole row
  // to a full-page window. Returns the updated rowIndex (usually decremented to re-check).

  const { rowIndex } = evaluation;
  const firstSlice = Array.isArray(newRows) ? newRows[0] : null;

  if (!firstSlice) {
    // Defensive fallback: if we somehow lost the first slice, move the row to next page.
    registerPageStartCallback?.({ targetIndex: rowIndex, reason: 'Row split produced empty first slice' });
    return rowIndex - 1;
  }

  const firstSliceTop = this.getTop(firstSlice, table);
  const firstSliceBottom = this.getBottom(firstSlice, table);

  // * Decide whether the first slice can remain in the current tail window or must escalate to a full-page window.
  const placement = this.evaluateRowSplitPlacement({
    usedRemainingWindow: !insufficientRemainingWindow,
    isFirstPartEmpty: isFirstPartEmptyInAnyTD,
    firstSliceTop,
    firstSliceBottom,
    pageBottom,
    epsilon: 0,
  });

  // TODO: "Scale only the first slice..."
  // ? Find out why we have a reduction in the first piece and in which case was this required?
  // ? All our tests are performed without height fitting (with commented helpers earlier).
  //    ? Commit:
  //    ? node/Table: Ensure the first slice fits the current page window (before registration)
  //    ? Maryna Balioura on 9/7/2025, 5:23:42 PM

  // TODO: CASE IN /table.html in the 1st slice (empty space vs ???)
  if (placement.placeOnCurrentPage) {
    // * Scale only the first slice to fit the remaining page space.
    if (placement.remainingWindowSpace > 0) {
      scaleProblematicSliceCallback?.(firstSlice, placement.remainingWindowSpace);
    }
    registerPageStartCallback?.({ targetIndex: rowIndex + 1, reason: 'Row split — next slice starts new page' });
  } else {
    // * Escalate to full-page window and scale the first slice if slicer reported it.
    applyFullPageScalingCallback?.({
      row: firstSlice,
      needsScalingInFullPage,
      fullPageHeight,
    });
    registerPageStartCallback?.({ targetIndex: rowIndex, reason: 'Empty first part — move row to next page' });
  }

  // * Roll back index to re-check from the newly updated splitBottom context.
  return rowIndex - 1;
}
