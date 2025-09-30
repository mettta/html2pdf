// Shared branching logic for resolving overflowing rows during pagination.
// Heavy DOM mutations are delegated through adapter callbacks so table/grid can reuse the same flow.

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

export function paginationSplitRow({
  rowIndex,
  row,
  firstPartHeight,
  fullPageHeight,
  debug,
  decorateRowSlice,
}) {
  if (!row) {
    return { newRows: [], isFirstPartEmptyInAnyTD: false, needsScalingInFullPage: false };
  }

  // * Measure TD shells before slicing — downstream placement relies on these fixed heights.
  const shellHeights = this.getTableRowShellHeightByTD(row);
  debug && debug._ && console.log('🧿 currentRowTdHeights', shellHeights);

  this.setFlagSlice(row);
  const originalCells = [...this._DOM.getChildren(row)];

  // *️⃣ Determine split points per cell (with sanitisation) so table/grid share identical slice geometry.
  const computed = this.getSplitPointsPerCells(
    originalCells,
    shellHeights,
    firstPartHeight,
    fullPageHeight,
    row,
  ) || {};
  debug && debug._ && console.log('[✖️] getSplitPointsPerCells result:', computed);

  const splitPointsPerCell = computed.splitPointsPerCell || [];
  const isFirstPartEmptyInAnyTD = computed.isFirstPartEmptyInAnyCell;
  const needsScalingInFullPage = computed.needsScalingInFullPage;

  const newRows = [];
  const hasSplits = splitPointsPerCell.some(points => Array.isArray(points) && points.length);
  if (hasSplits) {
    // * Build balanced row slices. Caller may decorate each slice (e.g. tracing attributes in table).
    const generatedRows = this.paginationBuildBalancedRowSlices({
      originalRow: row,
      originalCells,
      splitPointsPerCell,
      sliceCell: ({ cell, index, splitPoints }) => this.sliceNodeBySplitPoints({ index, rootNode: cell, splitPoints }),
      beginRow: ({ originalRow, sliceIndex }) => {
        const rowWrapper = this._DOM.cloneNodeWrapper(originalRow);
        decorateRowSlice?.({ rowWrapper, rowIndex, sliceIndex, originalRow });
        return { rowWrapper };
      },
      cloneCellFallback: (origCell) => this._DOM.cloneNodeWrapper(origCell),
      handleCell: ({ context, cellClone }) => {
        this._DOM.insertAtEnd(context.rowWrapper, cellClone);
      },
      finalizeRow: ({ context }) => context.rowWrapper,
    });
    newRows.push(...generatedRows);
  } else if (debug && debug._) {
    console.log('🔴 There is no Split');
  }

  debug && debug._ && console.log('%c newRows \n', 'color:magenta; font-weight:bold', newRows);

  return { newRows, isFirstPartEmptyInAnyTD, needsScalingInFullPage };
}

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

  const splitResult = this.paginationSplitRow({
    rowIndex: evaluation.rowIndex,
    row,
    firstPartHeight: budget.firstPartHeight,
    fullPageHeight,
    debug,
    decorateRowSlice,
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
  registerPageStartAt,
  scaleProblematicSlice,
  applyFullPageScaling,
}) {
  // Decide where freshly generated slices should live: keep first slice in the current
  // tail window (possibly trimming to the remaining height) or escalate the whole row
  // to a full-page window. Returns the updated rowIndex (usually decremented to re-check).

  const { rowIndex } = evaluation;
  const firstSlice = Array.isArray(newRows) ? newRows[0] : null;

  if (!firstSlice) {
    // Defensive fallback: if we somehow lost the first slice, move the row to next page.
    registerPageStartAt?.({ targetIndex: rowIndex, reason: 'Row split produced empty first slice' });
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
  if (placement.placeOnCurrentPage) {
    // * Scale only the first slice to fit the remaining page space.
    if (placement.remainingWindowSpace > 0) {
      scaleProblematicSlice?.(firstSlice, placement.remainingWindowSpace);
    }
    registerPageStartAt?.({ targetIndex: rowIndex + 1, reason: 'Row split — next slice starts new page' });
  } else {
    // * Escalate to full-page window and scale the first slice if slicer reported it.
    applyFullPageScaling?.({
      row: firstSlice,
      needsScalingInFullPage,
      fullPageHeight,
    });
    registerPageStartAt?.({ targetIndex: rowIndex, reason: 'Empty first part — move row to next page' });
  }

  // * Roll back index to re-check from the newly updated splitBottom context.
  return rowIndex - 1;
}
