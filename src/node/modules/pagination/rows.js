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
 * Build new row wrappers from sliced cells and ensure structural parity with original row.
 * @param {Object} params
 * @param {HTMLElement} params.originalRow
 * @param {HTMLElement[]} params.originalCells
 * @param {HTMLElement[][]} params.slicedCellsPerOriginal
 * @param {Function} params.createRowClone - ({ originalRow, sliceIndex }) => HTMLElement
 * @param {Function} params.cloneCellFallback - (cell) => HTMLElement
 * @param {Function} params.insertCell - ({ rowClone, cellClone }) => void
 * @returns {HTMLElement[]}
 */
export function buildRowSlices({
  originalRow,
  originalCells,
  slicedCellsPerOriginal,
  createRowClone,
  cloneCellFallback,
  insertCell,
}) {
  const maxSlices = Math.max(...slicedCellsPerOriginal.map(arr => arr.length));
  const rows = [];

  for (let sliceIndex = 0; sliceIndex < maxSlices; sliceIndex++) {
    const rowClone = createRowClone({ originalRow, sliceIndex });

    originalCells.forEach((origCell, cellIdx) => {
      const slicedCandidates = slicedCellsPerOriginal[cellIdx];
      const cellClone = slicedCandidates[sliceIndex] || cloneCellFallback(origCell);
      insertCell({ rowClone, cellClone });
    });

    rows.push(rowClone);
  }

  return rows;
}
