// Shared overflow helpers for table-like pagination. Keep geometry decisions reusable.
// All functions expect adapters/callbacks so table, grid and future splitters
// can share the tail-vs-full-page logic without duplicating DOM wiring.
// Important: helpers operate on problematic cell content only — caller controls
// which nodes are scaled so TR/grid-row structure remains unchanged.

/**
 * 🤖 Shrink only the content of those cells that cause the overflow, using caller-supplied fitters.
 * 🤖 Geometry: keeps the root/row shell and other cells untouched
 *    while scaling problematic cells content
 *    so the total row height matches the tail/full-page budget.
 *
 * @param {object} params
 * @param {string} [params.ownerLabel] - debug label for logs.
 * @param {object} params.DOM - DOM facade with getChildren().
 * @param {HTMLElement} params.row - row whose cells should be scaled.
 * @param {number} params.targetHeight - height budget for the row content.
 * @param {Array<number>} [params.cachedShells] - optional pre-measured shell heights.
 * @param {function(HTMLElement):Array<number>} params.getRowShellHeightsCallback - callback returning per-cell shell heights.
 * @param {function(HTMLElement[], number, Array<number>):boolean} params.scaleCellsToHeightCallback - fits cell content into target height.
 * @returns {boolean}
 */
export function scaleRowCellsToHeight({
  ownerLabel,
  DOM,
  row,
  targetHeight,
  cachedShells,
  getRowShellHeightsCallback,
  scaleCellsToHeightCallback,
}) {
  if (!ownerLabel) {
    console.warn('[scaleRowCellsToHeight] 👤 Owner wanted!', { owner: ownerLabel });
  }
  if (!row) {
    console.warn('[pagination.overflow] Missing row for scaling.', { owner: ownerLabel });
    return false;
  }
  if (typeof scaleCellsToHeightCallback !== 'function') {
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
    : typeof getRowShellHeightsCallback === 'function'
      ? getRowShellHeightsCallback(row)
      : [];
  return scaleCellsToHeightCallback(cells, targetHeight, shells);
}

/**
 * Decide how to resolve overflow for the current window.
 *
 * 🤖 Geometry: compares remaining window height with the dedicated full-page budget
 *    and triggers scaling only when full height is available.
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
 * @param {function(number, number[], string):void} params.registerPageStartCallback - shared paginator hook.
 * @param {function(HTMLElement, number, Array<number>=):boolean} params.scaleProblematicCellsCallback
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
  registerPageStartCallback,
  scaleProblematicCellsCallback,
  debugLogger,
}) {
  if (!ownerLabel) {
    console.warn('[handleRowOverflow] 👤 Owner wanted!', { owner: ownerLabel });
  }
  if (!Array.isArray(splitStartRowIndexes)) {
    console.warn('[pagination.overflow] splitStartRowIndexes must be an array.', { owner: ownerLabel });
    return rowIndex;
  }
  if (typeof registerPageStartCallback !== 'function') {
    console.warn('[pagination.overflow] registerPageStart callback is required.', { owner: ownerLabel });
    return rowIndex;
  }

  // * handleRowOverflow (and its wrapper handleRowSplitFailure) are only called
  // * after Stage 5 in the table has determined that “the row does not fit in the current window.”
  // * Next come three specific branches, each with its own conditions.
  // *
  // * 1) ROWSPAN fallback
  //      rowHasSpan(row) == true
  //      paginationResolveOverflowingRow → handleRowWithRowspan → paginationResolveRowWithRowspan
  // * 2) Already-sliced row, which again does not fit
  //      isSlice(row) == true
  //      paginationResolveAlreadySlicedRow → resolveSplitFailure → _resolveRowSplitFailure → handleRowSplitFailure → handleRowOverflow
  // * 3) A fresh row that could not be sliced into fragments
  //      Entry condition: Stage 5 went through handleSplittableRow,
  //      but paginationSplitRow returned an empty array newRows.
  //      paginationProcessRowSplitResult calls onSplitFailure → _resolveRowSplitFailure → handleRowSplitFailure → handleRowOverflow
  // *************
  //  So these cases involve scaling problematic content.
  //  But the budget for scaling is always maximum — and that is fullPageHeight.
  //  If the current window tail is smaller than the maximum budget, we move the row (return rowIndex - 1)%
  if (availableRowHeight < fullPageHeight) {
    //      Here, availableRowHeight is the same as evaluation.tailWindowHeight,
    //      passed without changes (if there is no remainder, the value will be ≤ 0).
    registerPageStartCallback(rowIndex, splitStartRowIndexes, reasonTail);
    return rowIndex - 1;
  }

  if (typeof debugLogger === 'function') {
    debugLogger('⚠️ Full-page overflow: scaling row before moving', { owner: ownerLabel, rowIndex, reasonFull });
  }

  //  ... otherwise we can try to “resolve” it in the full window by scaling the problematic CELLs content
  //  (scaleProblematicCells)...
  if (typeof scaleProblematicCellsCallback === 'function') {
    scaleProblematicCellsCallback(row, fullPageHeight);
  } else {
    console.warn('[pagination.overflow] scaleProblematicCells callback is missing.', { owner: ownerLabel, rowIndex });
  }

  // ... then register/update splitBottom, and reevaluate the row (rowIndex - 1)).
  registerPageStartCallback(rowIndex, splitStartRowIndexes, reasonFull);
  return rowIndex - 1;
}

//  handleRowSplitFailure exists so the “split produced no usable fragments” branch
//  has its own gatekeeper before we hand control back to the general overflow resolver.
//  When Stage 5 fails to slice a row we’re dealing with the highest-risk scenario:
//  the DOM may already contain half-inserted nodes, geometry caches might be stale,
//  and we must stop and look at the inputs before reusing the tail/full-page machinery.
//  The wrapper does exactly that. First, it validates we still have the row node
//  and a non‑negative availableRowHeight; missing data here means we cannot safely
//  call the generic resolver. Second, it emits the failure‑specific diagnostics,
//  making it obvious in logs that the slicer returned nothing and we’re falling back.
//  Only after these guardrails does it delegate to handleRowOverflow,
//  which assumes geometry is sane and focuses on the pure decision
//  “move to next page or scale in full-page context”.
//  Putting those checks directly into handleRowOverflow would force
//  every normal overflow call to pay for failure-specific validation and logging,
//  and would blur responsibility—handleRowOverflow would silently be doing two different jobs.
//  By keeping handleRowSplitFailure as a dedicated shim, we isolate the slow path,
//  retain explicit logging for the failure case, and keep the core overflow logic tight and single-purpose.
/**
 * Wrapper around handleRowOverflow used when slicing failed and the row must fallback.
 * Performs additional validation so callers see diagnostics before routing to overflow resolver.
 *
 * 🤖 Validate fallback parameters and forward to tail/full-page resolver when slicing produced no usable fragments.
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

  if (!ownerLabel) {
    console.warn('[handleRowSplitFailure] 👤 Owner wanted!', { owner: ownerLabel });
  }

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
