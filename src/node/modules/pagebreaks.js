// 🚧 pageBreaks

import { debugFor } from '../utils/debugFor.js';
const _isDebug = debugFor('pageBreaks');

// * CONTRACTS:  helper functions may return tri-state values
// - Element   → success (always a NEW candidate, never the origin element).
// - null      → searched but found nothing usable within bounds
//               (skip rules have already passed through hidden wrappers).
// - undefined → interrupted by page start / vertical limit;
//               indicates “stop semantic improvement” rather than “not found”.

/**
 * Try to improve a forcibly requested page start by walking to a better anchor.
 * Moves up via first-child parents and then left via no-hanging siblings
 * until no further safe movement is possible.
 *
 * @this {Node}
 * @param {Element} element - Starting element (current page-start candidate).
 * @param {Element} root - Pagination root (upper boundary for traversals).
 * @returns {Element} - Final anchor element to use as the forced page start.
 */
export function findBetterForcedPageStarter(element, root) {
  let current = element;

  while (true) {
    const firstChildParent = this.findFirstChildParent(current, root);
    if (firstChildParent && firstChildParent !== current) {
      current = firstChildParent;
      continue;
    }

    let left = this._DOM.getLeftNeighbor(current);
    while (left && this.shouldSkipFlowElement(left, { context: 'findBetterForcedPageStarter:left' })) {
      // ⚗️ filter out hidden wrappers on the left side
      left = this._DOM.getLeftNeighbor(left);
    }

    if (left && this.isNoHanging(left)) {
      current = left;
      continue;
    }

    break;
  }

  return current;
}

/**
 * Compute a semantically better page-start candidate within limits.
 *
 * Algorithm:
 * 1) Establish a stable baseline `betterCandidate` using `findFirstChildParentFromPage`.
 * 2) Iteratively improve by scanning left (`findPreviousNonHangingsFromPage`) and up
 *    (`findFirstChildParentFromPage`) while staying within the page/top limits.
 * 3) If we hit a limit (tri-state `undefined`) or cross the top boundary, stop semantic
 *    improvement and fall back to `betterCandidate`.
 * 4) Normalize the result so it never goes above the limit, is not after the flow start,
 *    and is not a skipped/hidden element.
 *
 * Returns an {Element} that is inside limits.
 * It may equal `pageStart` or `lastPageStart` after normalization.
 *
 * @this {Node}
 * @param {Element} pageStart - Current page-start anchor of the page being laid out.
 * @param {Element} lastPageStart - Anchor of the previous page (left/top limit).
 * @param {Element} root - Pagination root container.
 * @returns {Element} - A safe, normalized page-start element for the current page.
 */
export function findBetterPageStart(pageStart, lastPageStart, root) {
  _isDebug(this) && console.group('➗ findBetterPageStart');
  let interruptedWithUndefined = false;
  // ** undefined from helpers => we touched a hard limit (page start / top limit)
  let interruptedWithLimit = false;
  // ** secondary guard: we crossed or touched boundaries during local checks below

  // * Y-threshold: nothing above (smaller than) this coordinate can be returned;
  // * limited to the element from which the last registered page starts:
  const topLimit = this.getTop(lastPageStart, root);

  _isDebug(this) && console.log(
    "Start calculations:",
    { pageStart, lastPageStart, root, topLimit },
  );

  // ** Stable baseline: prefer upward first-child parent unless it crosses the top limit.
  // * Let's keep a stable intermediate improvement here, based on findFirstChildParent.
  // * If helper fails (null/undefined), do not pick a candidate above the limit.
  const fcpp = this.findFirstChildParentFromPage(pageStart, topLimit, root);
  let betterCandidate;
  if (fcpp) {
    betterCandidate = fcpp;
  } else {
    const psTop = this.getTop(pageStart, root);
    // * If pageStart is above the limit, fall back to lastPageStart; else keep pageStart.
    betterCandidate = (psTop < topLimit) ? lastPageStart : pageStart;
  }

  _isDebug(this) && console.log("betterCandidate:", betterCandidate,);

  let currentCandidate = betterCandidate;

  // ** Improvement passes: try left (no-hanging) then up (first-child parent)
  while (true) {
    // * ⬅ * Going left/up on “no hanging” until we reach the limit.
    const previousCandidate = this.findPreviousNonHangingsFromPage(
      currentCandidate,
      topLimit,
      root
    ); // *** returns new element, undefined or null
    if (previousCandidate === undefined) {
      _isDebug(this) && console.warn('🫥 previousCandidate', previousCandidate);
      interruptedWithUndefined = true;
      break;
    }
    _isDebug(this) && console.log('• previousCandidate', { previousCandidate });
    if (previousCandidate) {
      currentCandidate = previousCandidate;
      continue;
    }
    _isDebug(this) && console.log('• update currentCandidate', { previousCandidate });

    // * ⬆ * Going up, through the first children.
    const firstChildParent = this.findFirstChildParentFromPage(
      currentCandidate,
      topLimit,
      root
    ); // *** returns new element, undefined or null
    if (firstChildParent === undefined) {
      _isDebug(this) && console.warn('🫥 firstChildParent', firstChildParent);
      interruptedWithUndefined = true;
      break;
    }
    _isDebug(this) && console.log('• firstChildParent', { firstChildParent });
    if (firstChildParent) {
      currentCandidate = firstChildParent;
      continue;
    }
    _isDebug(this) && console.log('• update currentCandidate', { firstChildParent });

    break;
  }

  // ! Now in the case of a long enough sequence of “previous candidates”,
  // ! we abolish the rule at all, and split the node inside the shell
  // ! with a single child (like headers).

  // * We should be able to check “start of last page” here:
  // * - as the previous element (left)
  // * - as the parent element (up)

  if (currentCandidate == lastPageStart || this.getTop(currentCandidate, root) < topLimit) {
    interruptedWithLimit = true;
    _isDebug(this) && console.log('☝️ Top page limit has been reached', currentCandidate);
  }

  // TODO: needs more tests
  let prev = this._DOM.getLeftNeighbor(currentCandidate);
  while (prev && this.shouldSkipFlowElement(prev, { context: 'findBetterPageStart:leftCheck' })) {
    // ⚗️ filter out hidden wrappers near the current candidate
    prev = this._DOM.getLeftNeighbor(prev);
  }
  if (prev == lastPageStart) {
    interruptedWithLimit = true;
    _isDebug(this) && console.log('👈 Left limit has been reached (left neighbor is the last page start)', prev, betterCandidate);
  }

  // ** If we hit any limit, fall back to the baseline; otherwise take the improved candidate
  // * If `undefined` is returned, it means that we have reached the limit
  // * in one of the directions (past page start). Therefore we cancel attempts
  // * to improve the page break semantically and leave only geometric improvement.
  let result = (interruptedWithUndefined || interruptedWithLimit) ? betterCandidate : currentCandidate;

  // ** Normalize 1/3: never return a node physically above the limit
  if (this.getTop(result, root) < topLimit) {
    result = lastPageStart;
  }

  // ** Normalize 2/3: don't start immediately after the content flow start marker
  if (this.isAfterContentFlowStart(result)) {
    result = pageStart;
  }

  // ** Normalize 3/3: avoid returning a skipped/hidden wrapper; prefer baseline fallback.
  // **    If the chosen candidate is skipped/hidden,
  // **    we do NOT accept it as a final anchor. We are no longer searching
  // **    (no further left/up passes), so instead of “continuing past”,
  // **    we resolve or roll back:
  // **      - Prefer `betterCandidate` if it is flow-visible.
  // **      - Otherwise fall back to `lastPageStart`.
  if (this.shouldSkipFlowElement(result, { context: 'findBetterPageStart:result' })) {
    // ** default fallback: monotonic, always-safe anchor from the previous page
    let fallback = lastPageStart;
    // ** consider the semantic baseline if it differs from the rejected result
    if (betterCandidate !== result) {
      // ** accept baseline only if it is flow-visible; otherwise ignore it
      const fallbackCandidate = this.shouldSkipFlowElement(betterCandidate, { context: 'findBetterPageStart:fallback' })
        ? null
        : betterCandidate;
      // ** prefer the visible baseline over lastPageStart
      if (fallbackCandidate) {
        fallback = fallbackCandidate;
      }
    }
    // ** replace the invalid (skipped/hidden) result with the selected visible fallback
    result = fallback;
  }

  _isDebug(this) && console.log({
    interruptedWithUndefined,
    interruptedWithLimit,
    pageStart,
    betterCandidate,
    currentCandidate,
    result,
  });

  _isDebug(this) && console.log('➗ end, return:', result);
  _isDebug(this) && console.groupEnd();

  return result
}

// GET SERVICE ELEMENTS

/**
 * @relation(PAGINATION-6, scope=function)
 *
 * INTENTION: Locate explicit user-defined page break markers inside a container element.
 *
 * INPUT: A DOM element to search inside. Uses a predefined selector to find break markers.
 *
 * EXPECTED_RESULTS: Array of matching elements (or empty).
 */
/**
 * Returns all forced page-break markers inside the given element.
 *
 * @this {Node}
 * @param {Element} element - Container to search within.
 * @returns {Element[]} - Array of matched elements (may be empty).
 */
export function findAllForcedPageBreakInside(element) {
  return this._DOM.getAll(this._selector.printForcedPageBreak, element);
}

/**
* @relation(PAGINATION-7, scope=function)
*
* INTENTION: Identify a suitable wrapper that may influence page break logic, unless interrupted.
*
* INPUT: Element to start from, top limit (Y), and root container.
*        Traverses upward while element is first child.
*        Stops at page start marker or if position is above limit.
*
* EXPECTED_RESULTS: DOM element, or null if not found, or undefined if interrupted.
*/
/**
 * Finds the topmost parent where `element` is the first child, constrained by a vertical limit.
 *
 * Returns:
 * - {Element}   → found a **new** suitable parent (distinct from input).
 * - {null}      → no suitable parent found; traversal ended normally.
 * - {undefined} → interrupted by isPageStartElement() or crossing the top limit;
 *                 semantic improvement should stop for this direction.
 *
 * *      If we reached PageStart while moving UP the tree -
 * *      we don't need intermediate results,
 * *      (we'll want to ignore the rule for semantic break improvement).
 *
 * @this {Node}
 * @param {Element} element - Start element.
 * @param {number} topLimit - Y threshold; anything above (smaller than) this is out of bounds.
 * @param {Element} root - Pagination root; traversal stops at this boundary.
 * @returns {Element|null|undefined}
 */
export function findFirstChildParentFromPage(element, topLimit, root) {
  _isDebug(this) && console.group('⬆ findFirstChildParentFromPage');
  _isDebug(this) && console.log({element, topLimit, root});

  let firstSuitableParent = null;
  let current = element;
  let interruptedByPageStart = false;

  while (true) {
    let parent = this._DOM.getParentNode(current);
    while (parent && this.shouldSkipFlowElement(parent, { context: 'findFirstChildParentFromPage:parent' })) {
      // ⚗️ skip non-flow parents while moving upward
      parent = this._DOM.getParentNode(parent);
    }

    // * Stop at root boundary: do not climb to or above root.
    if (!parent || parent === root) {
      break;
    }

    let firstChild = this._DOM.getFirstElementChild(parent);
    while (firstChild && this.shouldSkipFlowElement(firstChild, { context: 'findFirstChildParentFromPage:firstChild' })) {
      // ⚗️ advance to the first child that participates in the flow
      firstChild = this._DOM.getRightNeighbor(firstChild);
    }
    if (!firstChild) {
      current = parent;
      continue;
    }

    const isFirstChild = firstChild === current;
    if (!isFirstChild) {
      // * First interrupt with end of nesting, with result passed to return.
      _isDebug(this) && console.log('parent is NOT the First Child', { parent });
      break;
    }

    const flowParent = this.resolveFlowElement(parent, { prefer: 'first' });
    if (!flowParent) {
      current = parent;
      continue;
    }

    const parentIsPageStart = this.isPageStartElement(parent) || this.isPageStartElement(flowParent);
    const parentTop = this.getTop(flowParent, root);

    if (parentIsPageStart || parentTop < topLimit) {
      // * Interrupt with limit reached, with resetting the result, using interruptedByPageStart.
      _isDebug(this) && console.warn('🫥 findFirstChildParentFromPage // interruptedByPageStart');
      interruptedByPageStart = true;
      break;
    }

    _isDebug(this) && console.log({ parent });
    firstSuitableParent = flowParent;
    current = parent;
  }

  _isDebug(this) && console.groupEnd('⬆ findFirstChildParentFromPage');
  return interruptedByPageStart ? undefined : firstSuitableParent;
}

/**
* @relation(PAGINATION-8, scope=function)
*
* INTENTION: Locate a safe leftward element for layout anchoring.
*
* INPUT: Current element, vertical Y-limit, and root container.
*        Traverses previous siblings marked as no-hanging.
*        Stops at page start marker or when above limit.
*
* EXPECTED_RESULTS: DOM element, or null if not found, or undefined if interrupted.
*/
/**
 * Finds the previous sibling in flow marked as `no-hanging`, constrained by a vertical limit.
 * Resolves wrappers to flow elements while scanning left.
 *
 * Returns:
 * - {Element}   → found a **new** leftward candidate.
 * - {null}      → none found on this level; traversal ended normally.
 * - {undefined} → interrupted by page start element or crossing the top limit;
 *                 semantic improvement should stop for this direction.
 *
 * *      If we reached PageStart while moving UP the tree -
 * *      we don't need intermediate results,
 * *      (we'll want to ignore the rule for semantic break improvement).
 *
 * @this {Node}
 * @param {Element} element - Current element to scan from.
 * @param {number} topLimit - Y threshold; anything above (smaller than) this is out of bounds.
 * @param {Element} root - Pagination root; used for coordinate calculations.
 * @returns {Element|null|undefined}
 */
export function findPreviousNonHangingsFromPage(element, topLimit, root) {
  _isDebug(this) && console.group('⬅ findPreviousNonHangingsFromPage');

  let suitableSibling = null;
  let current = element;
  let interruptedByPageStart = false;

  while (true) {
    let prev = this._DOM.getLeftNeighbor(current);
    while (prev && this.shouldSkipFlowElement(prev, { context: 'findPreviousNonHangingsFromPage:left' })) {
      // ⚗️ skip hidden siblings while scanning backwards
      prev = this._DOM.getLeftNeighbor(prev);
    }

    _isDebug(this) && console.log({ interruptedByPageStart, topLimit, prev, current });

    if (!prev || prev === current) break; // * return last computed

    if (!this.isNoHanging(prev)) break;

    let flowPrev = this.resolveFlowElement(prev, { prefer: 'last' });
    if (!flowPrev) {
      current = prev;
      continue;
    }
    while (flowPrev && this.shouldSkipFlowElement(flowPrev, { context: 'findPreviousNonHangingsFromPage:flow' })) {
      // ⚗️ keep resolving flow element until it is part of the layout
      flowPrev = this.resolveFlowElement(this._DOM.getLeftNeighbor(flowPrev), { prefer: 'last' });
    }
    if (!flowPrev) {
      current = prev;
      continue;
    }

    const prevIsPageStart = this.isPageStartElement(prev) || this.isPageStartElement(flowPrev);
    const prevTop = this.getTop(flowPrev, root);

    if (prevIsPageStart || prevTop < topLimit) {
      interruptedByPageStart = true;
      break;
    }

    // * isNoHanging(prev) && !isPageStartElement(prev)
    // * I'm looking at the previous element:
    suitableSibling = flowPrev;
    current = flowPrev;
  }

  _isDebug(this) && console.groupEnd('⬅ findPreviousNonHangingsFromPage');
  return interruptedByPageStart ? undefined : suitableSibling;
}

// ***
// * Structural utilities used as internal building blocks for page break logic.
// * These functions assist higher-level page break algorithms by walking the DOM tree.

/**
 * @relation(PAGINATION-3, scope=function)
 *
 * INTENTION: Identify the outermost block where the current element is the leading child,
 *            to inform layout decisions such as merging or page-breaking.
 *
 * INPUT: A DOM element and a root boundary element.
 *        Ascends while the current element is the first child of its parent.
 *        Stops if the parent equals root or breaks the condition.
 *
 * EXPECTED_RESULTS: Returns the highest such parent element if found;
 *                   otherwise returns null.
 */
/**
 * Ascends the DOM to find the nearest parent where the element is the first child.
 *
 * @this {Node}
 * @param {Element} element - Start element.
 * @param {Element} rootElement - Root boundary for traversal.
 * @returns {Element|null} - Highest such parent, or null if none.
 */
export function findFirstChildParent(element, rootElement) {
  let parent = this._DOM.getParentNode(element);
  let firstSuitableParent = null;

  while (parent && parent !== rootElement) {
    if (parent === rootElement) break;
    while (parent && this.shouldSkipFlowElement(parent, { context: 'findFirstChildParent:parent' })) {
      // ⚗️ skip non-flow parents while climbing the tree
      parent = this._DOM.getParentNode(parent);
    }
    if (!parent || parent === rootElement) break;

    let firstChild = this._DOM.getFirstElementChild(parent);
    while (firstChild && this.shouldSkipFlowElement(firstChild, { context: 'findFirstChildParent:firstChild' })) {
      // ⚗️ move to next sibling to find flow-participating first child
      firstChild = this._DOM.getRightNeighbor(firstChild);
    }
    if (!firstChild) {
      parent = this._DOM.getParentNode(parent);
      continue;
    }

    if (element === firstChild) {
      firstSuitableParent = parent;
      element = parent;
      parent = this._DOM.getParentNode(element);
    } else {
      return firstSuitableParent;
    }
  }

  return firstSuitableParent;
}

/**
*
* @relation(PAGINATION-5, scope=function)
*
* INTENTION: Identify the outermost block where the current element is the trailing child,
*            to inform layout decisions such as avoiding orphaned elements or improving grouping.
*
* INPUT: A DOM element and a root boundary element.
*        Ascends while the current element is the last child of its parent.
*        Stops if the parent equals root or breaks the condition.
*
* EXPECTED_RESULTS: Returns the highest such parent element if found;
*                   otherwise returns null.
*/
/**
 * Ascends the DOM to find the nearest parent where the element is the last child.
 *
 * @this {Node}
 * @param {Element} element - Start element.
 * @param {Element} rootElement - Root boundary for traversal.
 * @returns {Element|null} - Highest such parent, or null if none.
 */
export function findLastChildParent(element, rootElement) {
  let parent = this._DOM.getParentNode(element);
  let lastSuitableParent = null;

  while (parent && parent !== rootElement) {
    if (parent === rootElement) break;
    while (parent && this.shouldSkipFlowElement(parent, { context: 'findLastChildParent:parent' })) {
      // ⚗️ skip hidden parents while climbing upwards
      parent = this._DOM.getParentNode(parent);
    }
    if (!parent || parent === rootElement) break;

    let lastChild = this._DOM.getLastElementChild(parent);
    while (lastChild && this.shouldSkipFlowElement(lastChild, { context: 'findLastChildParent:lastChild' })) {
      // ⚗️ shift left until the last child contributes to layout
      lastChild = this._DOM.getLeftNeighbor(lastChild);
    }
    if (!lastChild) {
      parent = this._DOM.getParentNode(parent);
      continue;
    }

    if (element === lastChild) {
      lastSuitableParent = parent;
      element = parent;
      parent = this._DOM.getParentNode(element);
    } else {
      return lastSuitableParent;
    }
  }

  return lastSuitableParent;
}

// findSuitableNonHangingPageStart: Added January 1, 25,
// Commit: 407bd8166a9b9265b21ea3bfbdb80d0cb15e173f [407bd81]
// "Node: add findSuitableNoHangingPageStart function to determine the best element for page breaks"
// FIXME: And it's not being used.
/**
 * Find a suitable page-start candidate that avoids leaving an isNoHanging element last on a page.
 * Descend to the deepest relevant child, then ascend through first-child parents,
 * and finally validate against a vertical floater threshold.
 *
 * @this {Node}
 * @param {Element} element - Initial element to evaluate.
 * @param {number} topFloater - Y threshold below which a candidate is considered valid.
 * @returns {Element|null} - Candidate if it satisfies the position constraint; otherwise null.
 */
export function findSuitableNonHangingPageStart(element, topFloater) {
  // * This function finds the best element to start a new page when certain elements
  // * (e.g., headings or similar items) cannot remain as the last item on the current page.
  // * It descends to find the deepest restricted child, then ascends to identify
  // * the highest valid parent that can start a new page. Finally, it checks if the
  // * candidate is positioned above the page break threshold (topFloater).
  // * Returns:
  // * - The most suitable element to start a new page if a valid candidate is found
  // *   (either the initial element or a refined child/parent candidate).
  // * - Null if no valid candidate satisfies the position constraint.

  let current = element; // * Current element being checked
  let candidate = null; // * Candidate to be returned

  // _isDebug(this) && console.log('💠 Initial element:', current);

  // * === 1. Descend to find the candidate ===
  while (true) {
    let lastChild = this._DOM.getLastElementChild(current);
    while (lastChild && this.shouldSkipFlowElement(lastChild, { context: 'findSuitableNonHangingPageStart:descend' })) {
      // ⚗️ during descent, ignore non-flow descendants
      lastChild = this._DOM.getLeftNeighbor(lastChild);
    }

    // * If there are no children, stop descending
    if (!lastChild) {
      // _isDebug(this) && console.log('💠 No further children, stopping descent at:', current);
      break;
    }

    // * If the last child has the isNoHanging flag, it becomes the candidate
    if (this.isNoHanging(lastChild)) {
      // _isDebug(this) && console.log('💠 Found isNoHanging child:', lastChild);
      candidate = lastChild; // * Update the candidate
      break; // * Stop descending because the flag was found
    }

    // * Continue descending to the last child
    current = lastChild;
  }

  // * If no candidate was found, set the initial element as the candidate
  // * and skip the wrapper search
  if (!candidate) {
    candidate = element;
    // _isDebug(this) && console.log('💠 No isNoHanging element found, using initial element as candidate:', candidate);
  } else {
    // * === 2. Ascend to find the best wrapper ===
    current = candidate; // * Start moving up from the current candidate

    while (current && current !== element) {
      let parent = this._DOM.getParentNode(current);
      while (parent && this.shouldSkipFlowElement(parent, { context: 'findSuitableNonHangingPageStart:ascend' })) {
        // ⚗️ while ascending, skip wrappers that do not contribute to flow
        parent = this._DOM.getParentNode(parent);
      }

      // * If there is no parent or we reached the initial element, stop
      if (!parent || parent === element) {
        // _isDebug(this) && console.log('💠 Reached top or initial element, stopping ascent.');
        break;
      }

      // * Check if the current element is the first child of its parent
      let firstChild = this._DOM.getFirstElementChild(parent);
      while (firstChild && this.shouldSkipFlowElement(firstChild, { context: 'findSuitableNonHangingPageStart:ascendFirst' })) {
        // ⚗️ locate the true first child when climbing up wrappers
        firstChild = this._DOM.getRightNeighbor(firstChild);
      }

      if (firstChild && firstChild === current) {
        // _isDebug(this) && console.log('💠 Parent satisfies the condition, updating candidate to:', parent);
        candidate = parent; // * Update the candidate to its parent
        current = parent; // * Move up to the parent
      } else {
        // _isDebug(this) && console.log('💠 Parent does NOT satisfy the condition, stopping ascent.');
        break; // * Stop ascending if the condition is not met
      }
    }
  }

  // _isDebug(this) && console.log('💠 Final candidate after ascent:', candidate);

  // * === 3. Position check ===
  if (this.getTop(candidate) > topFloater) {
    // _isDebug(this) && console.log('💠 Candidate satisfies position check, returning:', candidate);
    return candidate;
  }

  // _isDebug(this) && console.log('💠 Candidate does not satisfy position check, returning null');
  return null;

}
