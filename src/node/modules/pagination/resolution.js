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
