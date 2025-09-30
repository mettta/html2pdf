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
