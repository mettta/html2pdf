// Shared helpers for balancing row slices across table-like elements.
// Each helper is adapter-driven so table/grid can plug in their DOM utilities.

/**
 * Slice each cell by its split points using provided adapter.
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
 * @param {Object} params
 * @param {any} params.originalRow
 * @param {any[]} params.originalCells
 * @param {Array<any[]>} params.slicedCellsPerOriginal
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
 * Evaluate whether the first slice can stay on the current page window.
 * Returns placement decision and available tail height.
 */
export function evaluateRowSplitPlacement({
  usedTailWindow,
  isFirstPartEmpty,
  firstSliceTop,
  firstSliceBottom,
  pageBottom,
  epsilon = 0.5,
}) {
  const availableTailHeight = pageBottom - firstSliceTop;
  const fitsTailWindow = usedTailWindow
    && !isFirstPartEmpty
    && firstSliceBottom <= pageBottom + epsilon;
  return {
    placeOnCurrentPage: fitsTailWindow,
    availableTailHeight,
  };
}
