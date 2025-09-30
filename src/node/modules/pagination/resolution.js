// Shared branching logic for resolving overflowing rows during pagination.
// The actual DOM mutations stay in adapter-provided callbacks so table/grid can plug in their specifics.

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
