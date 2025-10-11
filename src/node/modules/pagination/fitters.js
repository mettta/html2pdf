// Shared pagination fitters for table/grid elements.

import { debugFor } from '../../utils/debugFor.js';
const _isDebug = debugFor('pagination');

/**
 * 🤖 Delegate cell scaling to Node fitters so row content shrinks to target height.
 * Scale row cells to fit the given height using Node.fitters.
 *
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
 * 🤖 Check slicer feedback before running full-page scaling.
 * Decide whether scaling should be applied given slicer feedback.
 *
 * @param {Object} params
 * @param {boolean} params.needsScalingInFullPage
 * @param {Array} params.cells
 * @returns {boolean}
 */
export function paginationShouldScaleFullPage({ needsScalingInFullPage, cells }) {
  return Boolean(needsScalingInFullPage && Array.isArray(cells) && cells.length);
}

/**
 * 🤖 Apply full-page scaling when slicers request it, using caller-provided scaling callback.
 * Run full-page scaling fallback requested by slicers.
 * Accepts a custom scale callback so table/grid can reuse shared decision logic.
 *
 * @param {Object} params
 * @param {boolean} params.needsScalingInFullPage
 * @param {Function} params.scaleCallback - invoked with provided payload when scaling is required.
 * @param {Object} [params.payload]
 * @returns {boolean}
 */
export function paginationApplyFullPageScaling({ needsScalingInFullPage, scaleCallback, payload }) {
  if (!needsScalingInFullPage) {
    return false;
  }
  if (typeof scaleCallback !== 'function') {
    return false;
  }
  const result = scaleCallback(payload || {});
  if (!result && this && this._debug && this._debug._) {
    _isDebug(this) && console.warn('[pagination.scaling] requested full-page scaling but callback reported no change', payload);
  }
  return Boolean(result);
}
