// Shared helpers for building row evaluation snapshots during pagination.
// Mixed into Node so helpers can reuse measurement utilities and stay adapter-friendly.

/**
 * Capture row geometry relative to the current split window.
 * Returns null when rowIndex falls outside the provided rows array.
 */
export function paginationBuildRowEvaluationContext({
  rows,
  rowIndex,
  table,
  splitBottom,
}) {
  if (!Array.isArray(rows)) {
    return null;
  }
  const row = rows[rowIndex];
  if (!row) {
    return null;
  }
  const rowTop = this.getTop(row, table);
  const rowBottom = this.getBottom(row, table);
  const nextRow = rows[rowIndex + 1];
  const nextMarker = nextRow
    ? this.getTop(nextRow, table)
    : rowBottom; // For the last row fall back to rowBottom.
  const delta = nextMarker - splitBottom;
  const tailWindowHeight = splitBottom - rowTop;
  const fitsCurrentWindow = delta <= 0;

  return {
    rowIndex,
    row,
    rowTop,
    rowBottom,
    nextMarker,
    delta,
    tailWindowHeight,
    isLastRow: !nextRow,
    fitsCurrentWindow,
  };
}

/**
 * Determine whether the reclaimed budget of the final slice (no bottom signpost + TFOOT)
 * is sufficient to keep the last row without an extra split.
 */
export function paginationCanAbsorbLastRow({
  evaluation,
  extraCapacity,
  splitBottom,
  debug,
}) {
  if (!evaluation || !evaluation.isLastRow) {
    return false;
  }
  const overflow = evaluation.rowBottom - splitBottom;
  if (debug && debug._) {
    console.log('🫟 last-row-extra-check', {
      overflow,
      extraCapacity,
      rowBottom: evaluation.rowBottom,
      splitBottom,
    });
  }
  return overflow <= extraCapacity;
}
