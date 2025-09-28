// Shared pagination metrics helpers.

/**
 * Compute per-cell shell heights (padding/border contributions) for table-like rows.
 * Approximates shell as (cell offset height) - (content height).
 *
 * @this {Node}
 * @param {Object} params
 * @param {HTMLElement[]} params.cells
 * @returns {number[]}
 */
export function paginationComputeCellShellHeights({ cells }) {
  if (!Array.isArray(cells) || !cells.length) {
    return [];
  }

  return cells.map((cell) => {
    if (!cell) return 0;
    // Grid cells are not wrapped in TR/TD shells, so we approximate the structural
    // contribution by inspecting padding/borders. Using offsetHeight - content height
    // is unreliable because getContentHeightByProbe detaches nodes and breaks offsetParent.
    const style = this._DOM.getComputedStyle(cell);
    const paddingTop = parseFloat(style?.paddingTop) || 0;
    const paddingBottom = parseFloat(style?.paddingBottom) || 0;
    const borderTop = parseFloat(style?.borderTopWidth) || 0;
    const borderBottom = parseFloat(style?.borderBottomWidth) || 0;
    const inset = paddingTop + paddingBottom + borderTop + borderBottom;
    return Number.isFinite(inset) ? Math.max(0, inset) : 0;
  });
}
