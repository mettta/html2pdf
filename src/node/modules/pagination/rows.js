// Shared helpers for balancing row slices across table-like elements.
// Each helper is adapter-driven so table/grid can plug in their DOM utilities.

/**
 * Slice each cell by its split points using provided adapter.
 * @this {Node}
 * @param {Object} params
 * @param {HTMLElement[]} params.cells
 * @param {Array<Array<number>>} params.splitPointsPerCell
 * @param {Function} params.sliceCell - ({ cell, index, splitPoints }) => HTMLElement[]
 */
export function sliceCellsBySplitPoints({ cells, splitPointsPerCell, sliceCell }) {
  return splitPointsPerCell.map((splitPoints, index) => {
    const cell = cells[index];
    return sliceCell({ cell, index, splitPoints });
  });
}

/**
 * Build balanced row slices using adapter callbacks.
 *
 * @this {Node}
 * @param {Object} params
 * @param {(HTMLElement|Array<HTMLElement>)} params.originalRow
 * @param {(HTMLElement|Array<HTMLElement>)[]} params.originalCells
 * @param {Array<Array<HTMLElement>>} params.slicedCellsPerOriginal
 * @param {Function} params.beginRow - ({ originalRow, sliceIndex }) => any
 * @param {Function} params.cloneCellFallback - (cell) => any
 * @param {Function} params.handleCell - ({ context, cellClone, originalCell, cellIndex }) => void
 * @param {Function} params.finalizeRow - ({ context }) => any
 * @returns {any[]}
 */
export function buildRowSlices({
  originalRow,
  originalCells,
  slicedCellsPerOriginal,
  beginRow,
  cloneCellFallback,
  handleCell,
  finalizeRow,
}) {
  const maxSlices = Math.max(...slicedCellsPerOriginal.map(arr => arr.length));
  const rows = [];

  for (let sliceIndex = 0; sliceIndex < maxSlices; sliceIndex++) {
    const context = beginRow({ originalRow, sliceIndex });

    originalCells.forEach((origCell, cellIdx) => {
      const slicedCandidates = slicedCellsPerOriginal[cellIdx];
      const cellClone = slicedCandidates[sliceIndex] || cloneCellFallback(origCell);
      handleCell({ context, cellClone, originalCell: origCell, cellIndex: cellIdx });
    });

    rows.push(finalizeRow({ context }));
  }

  return rows;
}

/**
 * Convenience wrapper to slice cells and build balanced row fragments in one go.
 * @this {Node}
 */
export function paginationBuildBalancedRowSlices({
  originalRow,
  originalCells,
  splitPointsPerCell,
  sliceCell,
  beginRow,
  cloneCellFallback,
  handleCell,
  finalizeRow,
}) {
  if (!Array.isArray(splitPointsPerCell) || !splitPointsPerCell.length) {
    return [];
  }

  const slicedCellsPerOriginal = this.sliceCellsBySplitPoints({
    cells: originalCells,
    splitPointsPerCell,
    sliceCell,
  });

  return this.buildRowSlices({
    originalRow,
    originalCells,
    slicedCellsPerOriginal,
    beginRow,
    cloneCellFallback,
    handleCell,
    finalizeRow,
  });
}

/**
 * Evaluate whether the first slice can stay on the current page window.
 * Returns placement decision and available tail height.
 * @this {Node}
 */
export function evaluateRowSplitPlacement({
  usedRemainingWindow,
  isFirstPartEmpty,
  firstSliceTop,
  firstSliceBottom,
  pageBottom,
  epsilon = 0.5,
}) {
  // usedRemainingWindow — remaining window was attempted (portion of current page before escalating).
  // isFirstPartEmpty — slicer reported an empty first fragment.
  // remainingWindowSpace — remaining vertical space in the current window ("remaining window")
  // (from the top of the first slice to pageBottom). Used to decide tail scaling.
  const remainingWindowSpace = Math.max(0, pageBottom - firstSliceTop);
  // hasRemainingWindowSpace — true when we are operating in a tail window and the first slice is not empty;
  // only then the fragment may stay on the current page.
  const hasRemainingWindowSpace = usedRemainingWindow && !isFirstPartEmpty;
  // exceedsWindow — diagnostic flag: first slice bottom exceeds pageBottom + epsilon.
  const exceedsWindow = firstSliceBottom > pageBottom + epsilon;
  return {
    placeOnCurrentPage: hasRemainingWindowSpace,
    remainingWindowSpace,
    exceedsWindow,
  };
}

/**
 * Replace an entry inside currentRows with the generated row slices after split.
 * Keeps shared row caches aligned for subsequent pagination steps.
 * @this {Node}
 */
export function replaceCurrentRowsAfterRowSplit({ currentRows, index, rowSlices }) {
  if (!Array.isArray(currentRows)) return [];
  currentRows.splice(index, 1, ...rowSlices);
  return currentRows;
}
