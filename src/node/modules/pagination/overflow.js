// Shared overflow helpers for table-like pagination. Keep geometry decisions reusable.
// All functions expect adapters/callbacks so table, grid and future splitters
// can share the tail-vs-full-page logic without duplicating DOM wiring.
// Important: helpers operate on problematic cell content only — caller controls
// which nodes are scaled so TR/grid-row structure remains unchanged.

/**
 * Scale overflowing row cells to targetHeight using provided callbacks.
 * The caller supplies DOM/selectors so the helper remains framework-agnostic
 * and only problematic cell content is touched (no structural row mutations).
 *
 * @param {object} params
 * @param {string} [params.ownerLabel] - debug label for logs.
 * @param {object} params.DOM - DOM facade with getChildren().
 * @param {HTMLElement} params.row - row whose cells should be scaled.
 * @param {number} params.targetHeight - height budget for the row content.
 * @param {Array<number>} [params.cachedShells] - optional pre-measured shell heights.
 * @param {function(HTMLElement):Array<number>} params.getRowShellHeights - callback returning per-cell shell heights.
 * @param {function(HTMLElement[], number, Array<number>):boolean} params.scaleCellsToHeight - fits cell content into target height.
 * @returns {boolean}
 */
export function scaleRowCellsToHeight({
  ownerLabel,
  DOM,
  row,
  targetHeight,
  cachedShells,
  getRowShellHeights,
  scaleCellsToHeight,
}) {
  if (!row) {
    console.warn('[pagination.overflow] Missing row for scaling.', { owner: ownerLabel });
    return false;
  }
  if (typeof scaleCellsToHeight !== 'function') {
    console.warn('[pagination.overflow] scaleCellsToHeight callback is required.', { owner: ownerLabel });
    return false;
  }
  const domFacade = DOM;
  const children = domFacade && typeof domFacade.getChildren === 'function'
    ? domFacade.getChildren(row)
    : null;
  const cells = children ? [...children] : [];
  const shells = Array.isArray(cachedShells)
    ? cachedShells
    : typeof getRowShellHeights === 'function'
      ? getRowShellHeights(row)
      : [];
  return scaleCellsToHeight(cells, targetHeight, shells);
}

/**
 * Decide how to resolve overflow for the current window.
 * Moves the row to the next page when tail capacity is insufficient,
 * or scales content in full-page context before registering the split.
 *
 * @param {object} params
 * @param {string} [params.ownerLabel]
 * @param {number} params.rowIndex
 * @param {HTMLElement} params.row
 * @param {number} params.availableRowHeight - remaining space in current window.
 * @param {number} params.fullPageHeight - height budget for a dedicated page.
 * @param {number[]} params.splitStartRowIndexes - accumulator with split markers.
 * @param {string} params.reasonTail - log message for tail move.
 * @param {string} params.reasonFull - log message for full-page handling.
 * @param {function(number, number[], string):void} params.registerPageStartAt - shared paginator hook.
 * @param {function(HTMLElement, number, Array<number>=):boolean} params.scaleProblematicCells
 * @param {function(string, object):void} [params.debugLogger]
 * @returns {number} - next row index to evaluate (re-check under new window)
 */
export function handleRowOverflow({
  ownerLabel,
  rowIndex,
  row,
  availableRowHeight,
  fullPageHeight,
  splitStartRowIndexes,
  reasonTail,
  reasonFull,
  registerPageStartAt,
  scaleProblematicCells,
  debugLogger,
}) {
  if (!Array.isArray(splitStartRowIndexes)) {
    console.warn('[pagination.overflow] splitStartRowIndexes must be an array.', { owner: ownerLabel });
    return rowIndex;
  }
  if (typeof registerPageStartAt !== 'function') {
    console.warn('[pagination.overflow] registerPageStartAt callback is required.', { owner: ownerLabel });
    return rowIndex;
  }

  if (availableRowHeight < fullPageHeight) {
    registerPageStartAt(rowIndex, splitStartRowIndexes, reasonTail);
    return rowIndex - 1;
  }

  if (typeof debugLogger === 'function') {
    debugLogger('⚠️ Full-page overflow: scaling row before moving', { owner: ownerLabel, rowIndex, reasonFull });
  }

  if (typeof scaleProblematicCells === 'function') {
    scaleProblematicCells(row, fullPageHeight);
  } else {
    console.warn('[pagination.overflow] scaleProblematicCells callback is missing.', { owner: ownerLabel, rowIndex });
  }

  registerPageStartAt(rowIndex, splitStartRowIndexes, reasonFull);
  return rowIndex - 1;
}

/**
 * Wrapper around handleRowOverflow used when slicing failed and the row must fallback.
 * Performs additional validation so callers see diagnostics before routing to overflow resolver.
 */
export function handleRowSplitFailure(params) {
  // * If only short tail space is available, move the row to next page (no scaling on tail).
  // * If we are already in full-page context, scale ONLY problematic TD/Cell content to fit full-page height.
  const {
    ownerLabel,
    rowIndex,
    row,
    availableRowHeight,
  } = params;

  if (!Number.isFinite(availableRowHeight) || availableRowHeight < 0) {
    console.warn('[pagination.overflow] availableRowHeight is missing or negative.', {
      owner: ownerLabel,
      rowIndex,
      availableRowHeight,
    });
  }
  if (!row) {
    console.warn('[pagination.overflow] Missing row in split failure handler.', {
      owner: ownerLabel,
      rowIndex,
    });
    return rowIndex;
  }

  return handleRowOverflow(params);
}
