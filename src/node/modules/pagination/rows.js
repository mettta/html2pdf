// Shared helpers for balancing row slices across table-like elements.
// Each helper is adapter-driven so table/grid can plug in their DOM utilities.

import { debugFor } from '../../utils/debugFor.js';
const _isDebug = debugFor('pagination');

/**
 * 🤖 Slice each cell by split points reported by the slicer.
 * 🤖 Geometry: preserves column alignment by generating per-cell fragments before reassembling row slices.
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
 * 🤖 Assemble balanced row slices by stitching sliced cells column-by-column.
 * 🤖 Geometry: ensures each slice inherits missing cells via fallback clones so column structure remains stable.
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
 * 🤖 Convenience wrapper: slice cells then build balanced row fragments.
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
 * 🤖 Evaluate whether the first slice stays in the current tail window and how much space is left.
 * 🤖 Geometry: compares first slice top/bottom with splitBottom to drive placement/scale decisions.
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
 * 🤖 Replace the working row list entry with generated slices so future passes read updated geometry.
 * @this {Node}
 */
export function replaceCurrentRowsAfterRowSplit({ currentRows, index, rowSlices }) {
  if (!Array.isArray(currentRows)) return [];
  currentRows.splice(index, 1, ...rowSlices);
  return currentRows;
}
