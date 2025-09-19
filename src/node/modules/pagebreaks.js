// 🚧 pagebreaks

import { debugFor } from '../utils/debugFor.js';
const _isDebug = debugFor('pagebreaks');

/**
 * @this {Node}
 */
export function findBetterForcedPageStarter(element, root) {
  let current = element;

  while (true) {
    const firstChildParent = this.findFirstChildParent(current, root);
    if (firstChildParent && firstChildParent !== current) {
      current = firstChildParent;
      continue;
    }

    const left = this._DOM.getLeftNeighbor(current);
    if (left && this.isNoHanging(left)) {
      current = left;
      continue;
    }

    break;
  }

  return current;
}

/**
 * @this {Node}
 */
export function findBetterPageStart(pageStart, lastPageStart, root) {
  _isDebug(this) && console.group('➗ findBetterPageStart');

  let interruptedWithUndefined = false;
  let interruptedWithLimit = false;

  // * limited to the element from which the last registered page starts:
  const topLimit = this.getTop(lastPageStart, root);

  _isDebug(this) && console.log(
    "Start calculations:",
    { pageStart, lastPageStart, root, topLimit },
  );

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

  // We should be able to check “start of last page” here:
  // - as the previous element (left)
  // - as the parent element (up)

  if (currentCandidate == lastPageStart || this.getTop(currentCandidate, root) < topLimit) {
    interruptedWithLimit = true;
    _isDebug(this) && console.log('☝️ Top page limit has been reached', currentCandidate);
  }

  // TODO: needs more tests
  const prev = this._DOM.getLeftNeighbor(currentCandidate);
  if (prev == lastPageStart) {
    interruptedWithLimit = true;
    _isDebug(this) && console.log('👈 Left limit has been reached (left neighbor is the last page start)', prev, betterCandidate);
  }

  // If `undefined` is returned, it means that we have reached the limit
  // in one of the directions (past page start). Therefore we cancel attempts
  // to improve the page break semantically and leave only geometric improvement.
  let result = (interruptedWithUndefined || interruptedWithLimit) ? betterCandidate : currentCandidate;

  // * Normalize: never return a candidate above the limit.
  if (this.getTop(result, root) < topLimit) {
    result = lastPageStart;
  }

  if (this.isAfterContentFlowStart(result)) {
    result = pageStart;
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
 * Returns all forced page break markers inside the given element.
 *
 * @relation(PAGINATION-6, scope=function)
 *
 * INTENTION: Locate explicit user-defined page break markers inside a container element.
 *
 * INPUT: A DOM element to search inside. Uses a predefined selector to find break markers.
 *
 * EXPECTED_RESULTS: Array of matching elements (or empty).
 */
/**
 * @this {Node}
 */
export function findAllForcedPageBreakInside(element) {
  return this._DOM.getAll(this._selector.printForcedPageBreak, element);
}

/**
* Finds the topmost parent where the element is the first child, within vertical limits.
*
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
 * @this {Node}
 */
export function findFirstChildParentFromPage(element, topLimit, root) {
  // Returns:
  // ** Nothing found, loop terminated normally  |  null
  // ** Found matching parent                    |  DOM element
  // ** Interrupted by isPageStartElement()      |  undefined
  //
  // If we reached PageStart while moving UP the tree -
  // we don't need intermediate results,
  // (we'll want to ignore the rule for semantic break improvement).

  _isDebug(this) && console.group('⬆ findFirstChildParentFromPage');
  _isDebug(this) && console.log({element, topLimit, root});

  let firstSuitableParent = null;
  let current = element;
  let interruptedByPageStart = false;

  while (true) {
    const parent = this._DOM.getParentNode(current);
    if (!parent) break;

    // Stop at root boundary: do not climb to or above root.
    if (parent === root) {
      break;
    }

    const isFirstChild = this._DOM.getFirstElementChild(parent) === current;
    if (!isFirstChild) {
      // First interrupt with end of nesting, with result passed to return.
      _isDebug(this) && console.warn({ '!isFirstChild': parent });
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
      // Interrupt with limit reached, with resetting the result, using interruptedByPageStart.
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
* Finds the previous no-hanging sibling within vertical limits.
*
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
 * @this {Node}
 */
export function findPreviousNonHangingsFromPage(element, topLimit, root) {
  // Returns:
  // ** Nothing found, loop terminated normally  |  null
  // ** Found matching parent                    |  DOM element
  // ** Interrupted by isPageStartElement()      |  undefined
  //
  // If we reached PageStart while moving LEFT the tree -
  // we don't need intermediate results,
  // (we'll want to ignore the rule for semantic break improvement).

  _isDebug(this) && console.group('⬅ findPreviousNonHangingsFromPage');

  let suitableSibling = null;
  let current = element;
  let interruptedByPageStart = false;

  while (true) {
    const prev = this._DOM.getLeftNeighbor(current);

    _isDebug(this) && console.log({ interruptedByPageStart, topLimit, prev, current });

    if (!prev || !this.isNoHanging(prev) || prev === current) break; // * return last computed

    const flowPrev = this.resolveFlowElement(prev, { prefer: 'last' });
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
    // I'm looking at the previous element:
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
 * Ascends the DOM to find the nearest parent where the element is the first child.
 *
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
 * @this {Node}
 */
export function findFirstChildParent(element, rootElement) {
  let parent = this._DOM.getParentNode(element);
  let firstSuitableParent = null;

  while (parent && parent !== rootElement) {
    const firstChild = this._DOM.getFirstElementChild(parent);

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
* Ascends the DOM to find the nearest parent where the element is the last child.
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
 * @this {Node}
 */
export function findLastChildParent(element, rootElement) {
  let parent = this._DOM.getParentNode(element);
  let lastSuitableParent = null;

  while (parent && parent !== rootElement) {
    const lastChild = this._DOM.getLastElementChild(parent);

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
// TODO: And it's not being used.
/**
 * @this {Node}
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
    const lastChild = this._DOM.getLastElementChild(current);

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
      const parent = current.parentElement;

      // * If there is no parent or we reached the initial element, stop
      if (!parent || parent === element) {
        // _isDebug(this) && console.log('💠 Reached top or initial element, stopping ascent.');
        break;
      }

      // * Check if the current element is the first child of its parent
      if (this._DOM.getFirstElementChild(parent) === current) {
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
