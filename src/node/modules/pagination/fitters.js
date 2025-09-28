// Shared pagination fitters for table/grid elements.

/**
 * Scale row cells to fit the given height using Node.fitters.
 * @this {Node}
 * @param {Object} params
 * @param {HTMLElement[]} params.cells
 * @param {number} params.targetHeight
 * @param {number[]} [params.shells]
 * @returns {boolean}
 */
export function paginationScaleCellsToHeight({ cells, targetHeight, shells }) {
  if (!Array.isArray(cells) || !cells.length || !(targetHeight > 0)) {
    return false;
  }
  return this.scaleCellsToHeight(cells, targetHeight, shells);
}

/**
 * Decide whether scaling should be applied given slicer feedback.
 * @param {Object} params
 * @param {boolean} params.needsScalingInFullPage
 * @param {Array} params.cells
 * @returns {boolean}
 */
export function paginationShouldScaleFullPage({ needsScalingInFullPage, cells }) {
  return Boolean(needsScalingInFullPage && Array.isArray(cells) && cells.length);
}
