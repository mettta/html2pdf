// 🔪 slicers

import { debugFor } from '../utils/debugFor.js';
const _isDebug = debugFor('slicers');

/**
 * Find split points inside rootNode content.
 *
 * Walks through rootNode's children recursively (including nested).
 * Returns elements where content should be split.
 * Split points are later used by slicing functions.
 *
 * @param {Node} rootNode - The container node (e.g., TD).
 * @param {Element[]} children - Children of rootNode (direct, but may descend recursively).
 * @param {number} firstPartHeight - Available height for the first part.
 * @param {number} fullPageHeight - Available height for full page parts.
 * @param {Element[]} points - Collected split points.
 * @returns {Element[]|null[]} - Array of elements marking split points (can include null).
 *
 * @this {Node}
 */
export function getSplitPoints({
  rootNode,
  rootComputedStyle,
  children,
  firstPartHeight,
  fullPageHeight,
  firstChild,

  points = [],
}) {

  if (!children.length) {
    _isDebug(this) && console.log('🧶 [getSplitPoints] %c has no children, early returns []', 'font-weight:bold', {rootNode});
    return []
  }

  // * We need to cache the firstChild of the root node,
  // * because when we descend into the children and enter recursion,
  // * we cannot access the points.push(null) branch because the
  // * knowledge about the firstChild of the root is lost.

  const registerPoint = (element) => {

    const point = this.findBetterPageStart(
      element,
      points.at(-1),
      rootNode,
      rootNode
    );

    // * If we try to register the first element as a new page: `point === children[0]`,
    // * it is a something big that does not fit in first (short) tail part.
    // ? remove this statement!
    // // And this candidate should not be an only child. So there is at least one more (children[1]).
    // ! remove this '&& children[1]' from condition!
    // FIXME (need be tested).
    if (!points.length && point === firstChild) { // && children[1]
      _isDebug(this) && console.log('%c !points.length && point === children[0] && children[1]', 'color:red');
      _isDebug(this) && console.log('%c 🅾️ push(null) in registerPoint()', 'color:red');
      points.push(null)
      // 🤖 Early abort: null means "empty first slice" — no need to keep scanning.
      //     Caller can immediately trigger the second pass with full-page window.
      return true;
    } else {
      _isDebug(this) && console.log('%c 🧼🧼🧼🧼 push(point) in registerPoint()', 'color:violet', {point, points, firstChild}, points.length);
      points.push(point)
      return false;
    }

    // TODO: Perhaps 👆 `point === children[0]` means 'multiple shell'-case.
    // ? And we tried to make the break deeper, but findBetterPageStart brought us back to the top.
    // ? Although findBetterPageStart can handle such situations, we should test it more thoroughly.
  }

  _isDebug(this) && console.group('🧶 getSplitPoints'); // Collapsed
  _isDebug(this) && console.log('points.length', points.length);

  const _rootComputedStyle = rootComputedStyle
    ? rootComputedStyle
    : this._DOM.getComputedStyle(rootNode);

  // 🤖 Cache normalized metrics to avoid repeated DOM layout measurements while scanning children.
  const metricsCache = new WeakMap();
  const getMetricsBag = (element) => {
    let bag = metricsCache.get(element);
    if (!bag) {
      bag = Object.create(null);
      metricsCache.set(element, bag);
    }
    return bag;
  };
  const getNormalizedTopCached = (element) => {
    if (!element) return NaN;
    const bag = getMetricsBag(element);
    if (!('top' in bag)) {
      bag.top = this.getNormalizedTop(element, rootNode, _rootComputedStyle);
    }
    return bag.top;
  };
  const getNormalizedBottomWithMarginCached = (element) => {
    if (!element) return NaN;
    const bag = getMetricsBag(element);
    if (!('bottomWithMargin' in bag)) {
      bag.bottomWithMargin = this.getNormalizedBottomWithMargin(element, rootNode, _rootComputedStyle);
    }
    return bag.bottomWithMargin;
  };
  const getOffsetHeightCached = (element) => {
    if (!element) return 0;
    const bag = getMetricsBag(element);
    if (!('offsetHeight' in bag)) {
      bag.offsetHeight = this._DOM.getElementOffsetHeight(element);
    }
    return bag.offsetHeight;
  };

  // * (1)
  // * Need to make the getTop work with root = rootNode.
  // * A positioned ancestor is either:
  // * - an element with a non-static position, or
  // * - td, th, table in case the element itself is static positioned.
  // * So we need to set non-static position for rootNode
  // * for the calculation runtime.
  // * Because anything in the content could be with a non-static position,
  // * and then TD without positioning wouldn't work for it as a offset parent.
  // * (2)
  // * We need to take row tops from top to bottom, so we need a vertical alignment.
  this.setInitStyle (true, rootNode, _rootComputedStyle);

  // 🤖 Guarantee cleanup for temporary layout mutations even on early exits.
  let finalized = false;
  const finalize = () => {
    if (finalized) {
      return points;
    }
    finalized = true;
    _isDebug(this) && console.groupEnd(`walking through ${children.length} children`);
    // *** need to revert back to the original positioning & vertical align of the rootNode:
    this.setInitStyle (false, rootNode, rootComputedStyle);
    _isDebug(this) && console.groupEnd(`getSplitPoints`);
    return points;
  };

  // ⚠️ Normalizing offsetTop relative to TD.
  //
  // The available height (firstPartHeight / fullPageHeight) for TD content
  // is already calculated without TD's padding-top.
  // However, element.offsetTop inside TD starts from padding-top.
  //
  // If we directly use offsetTop (which starts from padding-top) to check
  // whether the element fits into the allowed space, we will accidentally
  // count padding-top twice:
  //  - Once when we reduced the available height by TD's padding-top.
  //  - Again because offsetTop inside TD starts after TD's padding-top.
  //
  // As a result, the actual usable space would appear smaller than it is
  // by the value of padding-top.
  //
  // To avoid this, we subtract padding-top from offsetTop.
  // This normalization is specific to this TD context.

  _isDebug(this) && console.group(`walking through ${children.length} children`, children); // Collapsed

  for (let i = 0; i < children.length; i++) {

    let floater; // * floater: bottom boundary (in rootNode coordinates) for the current slice.
    let capacity; // * capacity: vertical height budget for the current slice’s content.
    if (points.length === 0) { // * empty array => process first slice
      floater = firstPartHeight;

      // TODO: Not implemented: when we calculate the height of the first slice, but for the entire page.
      // `firstPartHeight is calculated minus the top and bottom signpostHeight.
      //  But for the first slice, it is sufficient to subtract only the bottom signpostHeight.
      // ! Simple correction doesn't work here:
      // capacity = fullPageHeight + 24;

      capacity = firstPartHeight;
    } else if (points.at(-1) === null) { // * case with empty first slice
      floater = fullPageHeight;
      capacity = fullPageHeight;
    } else {
      // ⚠️ See comment above about normalization.
      const anchorTop = getNormalizedTopCached(points.at(-1));
      if (!Number.isFinite(anchorTop)) {
        _isDebug(this) && console.warn('🛑 [getSplitPoints] non-finite anchorTop — aborting slice computation', {
          anchor: points.at(-1),
          anchorTop,
          fullPageHeight,
        });
        return finalize();
      }
      floater = anchorTop + fullPageHeight;
      capacity = fullPageHeight;
    }

    const currentElement = children[i];
    const previousElement = children[i - 1];
    const nextElement = children[i + 1];

    _isDebug(this) && console.log({currentElement, previousElement, nextElement});

    // ⚠️ See comment above about normalization.
    let nextElementTop;
    let isNextElementTopFinite = false;
    if (nextElement) {
      nextElementTop = getNormalizedTopCached(nextElement);
      if (Number.isFinite(nextElementTop)) {
        isNextElementTopFinite = true;
      } else {
        // 🤖 Treat unmeasurable next-element top as an overflow candidate.
        _isDebug(this) && console.warn('[getSplitPoints] nextElementTop is not finite', { nextElement, nextElementTop });
      }
    }


    if (this.isForcedPageBreak(currentElement)) {
      //register
      const forcedBreakPushedNull = registerPoint(currentElement);

      // TODO #ForcedPageBreak
      // TODO MAKE IT VERY BIG
      _isDebug(this) && console.warn(
        '🍎', [currentElement], 'isForcedPageBreak'
      );
      // 🤖 Case: Forced Page Break — `pushedNull` here means the break sits on the very first child, so the tail slice would be empty.
      // 🤖 Geometrically: we must abandon the short window and switch to the full-page pass so the next page can start correctly.
      if (forcedBreakPushedNull) {
        return finalize();
      }
      continue;
    }

    let shouldSplitCurrent = false;
    let currentElementBottom;

    if (nextElement && isNextElementTopFinite && nextElementTop <= floater) {
      currentElementBottom = getNormalizedBottomWithMarginCached(currentElement); // ⚠️ See comment above about normalization.

      if (currentElementBottom <= floater) {
        // * CurrentElement does fit in the remaining space on the page.
        _isDebug(this) && console.log('[getSplitPoints]', i,
          `current fits tail window: nextTop ${nextElementTop} <= ${floater}, currentBottom ${currentElementBottom} <= ${floater}`,
        );
        // * go to next index
        continue;
      }

      // 🤖 nextElement stays within the floater, but currentElement itself overflows — treat as split case.
      _isDebug(this) && console.log('[getSplitPoints] nextTop <= floater but currentBottom overflow', {
        currentElement,
        currentElementBottom,
        floater,
        nextElement,
        nextElementTop,
      });
      shouldSplitCurrent = true;
    }

    if (!shouldSplitCurrent && nextElement && (!isNextElementTopFinite || nextElementTop > floater)) {
      // * Next element will definitely be on the next page.
      // * And the CurrentElement? It's not clear yet. Let's check its bottom.
      _isDebug(this) && console.log('[getSplitPoints]',
        `next overtook the floater : (nextElementTop) ${nextElementTop} > ${floater}`, {currentElement},
        "does current overflow? let's check.",
        { isNextElementTopFinite }
      );

      if (this.isSVG(currentElement) || this.isIMG(currentElement)) {
        // TODO needs testing
        _isDebug(this) && console.log('%cIMAGE', 'color:red;text-weight:bold')
      }

      currentElementBottom = getNormalizedBottomWithMarginCached(currentElement); // ⚠️ See comment above about normalization.

      if (currentElementBottom <= floater) {
        if (isNextElementTopFinite) {
          // * CurrentElement does fit in the remaining space on the page.
          _isDebug(this) && console.log('[getSplitPoints]',
            `current fits: (currentElementBottom) ${currentElementBottom} <= ${floater}, 🍎 register nextElement as Point.`, {currentElement, nextElement});

          const pushedNull = registerPoint(nextElement);
          // 🤖 Case: Next Element Overflow — if we get `pushedNull`, findBetterPageStart slid back to the first child, signalling the tail cannot host any content.
          // 🤖 Geometrically this means "start of next page" coincides with page top, so we abort and let the fallback recalc with full height.
          if (pushedNull) {
            _isDebug(this) && console.log('%cNULL CASE, return', 'color:red;text-weight:bold');
            return finalize();
          }
          // * go to next index
          continue;
        }

        // 🤖 Unable to measure the next element; keep scanning without splitting.
        _isDebug(this) && console.log('[getSplitPoints] nextElementTop not finite and current fits tail window', {
          currentElementBottom,
          floater,
          nextElement,
        });
      } else {
        // *** currentElementBottom > floater
        // * CurrentElement does NOT fit in the remaining space on the page.
        _isDebug(this) && console.log(
          `🔪🥒 try to split overflowing current: (currentElementBottom > ) ${currentElementBottom} > ${floater}`, {currentElement},
        );

        shouldSplitCurrent = true;
      }
    }

    if (!nextElement) {
      _isDebug(this) && console.log('%c[getSplitPoints] !nextElement', 'color:red');
      // * I am my parent's only child, and even if my bottom fits on the page,
      // * I will have to merge with the bottom edges of my parent,
      // * who we already know does not fit (which is why we are here).
      // * That's why I'm immediately going into a branch of splitting here.

      _isDebug(this) && console.log('%c[getSplitPoints] * Try to split it. 🔪🥒', 'color:blue');
      currentElementBottom = currentElementBottom ?? getNormalizedBottomWithMarginCached(currentElement); // ⚠️ See comment above about normalization.

      let containerElement = currentElement;
      if (currentElement.parentElement && rootNode.contains(currentElement.parentElement)) {
        let ancestor = currentElement.parentElement;
        while (ancestor && rootNode.contains(ancestor)) {
          if (ancestor === rootNode) {
            // 🤖 Stop climbing before hitting the root itself — its height reflects row layout, not local overflow.
            break;
          }
          if (this._DOM.getRightNeighbor(ancestor)) {
            break;
          }
          containerElement = ancestor;
          ancestor = ancestor.parentElement;
        }
      }

      const containerBottom = containerElement === currentElement
        ? currentElementBottom
        : getNormalizedBottomWithMarginCached(containerElement); // ⚠️ See comment above about normalization.
      if (containerBottom <= floater) {
        _isDebug(this) && console.log('%c 🍕 [getSplitPoints] !nextElement branch fits with container shell', 'color:violet', {
          currentElementBottom,
          containerBottom,
          floater,
          containerElement,
        });
        // 🤖 Последний ребёнок (вместе с оболочкой) помещается целиком: оставляем как есть.
        continue;
      }

      // * Try to split it. 🔪🥒.  🍉
      shouldSplitCurrent = true;
    }


    // 🤖 Non-finite nextElementTop is already captured above; keep evaluating current overflow state here.

    if (!shouldSplitCurrent) {
      continue;
    }

    // * Try to split it. 🔪🥒.  🍉


    let localPoints = [];

    // TODO: The code below requires further refinement.

    const currentElementChildren = this.getSplitChildren(currentElement, firstPartHeight, fullPageHeight, rootNode);

    // * Parse children:
    if (currentElementChildren.length) {

      // * Process children if exist:
      // 🤖 Intentional: we pass the SAME `points` array into recursion.
      //     This accumulates split markers for the whole TD content and
      //     allows checks like `localPoints.length === 0` to mean
      //     "we are still in the first slice (tail window) of this TD".
      //     Do NOT replace with a new array — first-slice semantics would break.
      localPoints = getSplitPoints.call(this, {
        rootNode,
        rootComputedStyle: _rootComputedStyle,
        children: currentElementChildren,
        firstPartHeight,
        fullPageHeight,
        firstChild,

        points,
      });

      // *** END of 'has children'

      if (localPoints.length === 0) {
        // 🤖 Case: current element (with children) did not produce inner split points
        //     in the first slice. This is the "tail window" scenario.
        //     We use `room = max(firstPartHeight, fullPageHeight)` here ON PURPOSE:
        //       - The first part can be as large as, or even larger than, a full page
        //         (e.g., no top signpost deducted for the first part), so `room` is the
        //         maximum admissible height for a non‑breakable element in the first slice.
        //       - The action (move to next page vs. scale) is STILL deferred to the
        //         row/table layer to maintain strict geometry; slicers only classify.
        const room = Math.max(firstPartHeight, fullPageHeight);

        const currentElementHeight = getOffsetHeightCached(currentElement);
        const isUnbreakableOversized =
          currentElementHeight > room &&
          (
            !localPoints.length ||
            (localPoints.length === 1 && localPoints[0] === null)
          );

        _isDebug(this) && console.log('room (Math.max)', room);

        if (isUnbreakableOversized) {
          _isDebug(this) && console.warn(
            '%c⚠️ UNSPLITTABLE OVERSIZED ELEMENT — SCALE IT',
            'color:white; background:red; font-weight:bold;',
            currentElement,
            `height: ${currentElementHeight}`
          );
          if (!points.length && currentElement === firstChild) {
            _isDebug(this) && console.warn('🅾️ (1) points.push(null) in isUnbreakableOversized');
            points.push(null);
            // 🤖 Early abort after placing sentinel: let the second pass handle next window.
            return finalize();
          }
          // 🤖 Early scaling here breaks strict geometry when the paginator
          //     later re-computes the window (moves to full-page). Better approach:
          //     - Register split (null/next) and let table.js decide scaling:
          //       either scale tail (if really tail case) or scale in full-page.
          //     - Leave this call disabled (see similar handling in the 'no children' branch).
          // this.fitElementWithinHeight(currentElement, room)
          if (nextElement) {
            const pushedNull = registerPoint(nextElement);
            // 🤖 Case: Unbreakable Oversized With Children — `pushedNull` means the next page must begin exactly at root's first child.
            // 🤖 Geometrically we cannot fit any tail content, so we stop and delegate to the fallback (second pass / scaling decision).
            if (pushedNull) return finalize();
          }
        } else {

          // FIXME: быстрый фикс, но помог. Проверить тщательно логику.
          // Element is unbreakable and fits a full page, but does not fit the tail.
          // Start the next page from currentElement (first slice may be empty when it is the first).
          // 🤖 If this starts the next page from currentElement, and it happens to be
          //     the very first child (empty first slice), registerPoint will push null
          //     and we should abort to let the second pass run immediately.
          if (registerPoint(currentElement)) return finalize();
        }
      }

    } else {

      // !currentElementChildren.length
      _isDebug(this) && console.log('🍎 currentElementChildren.length == 0');

      // 🤖 NOTE: scaling is intentionally disabled here (see commented code below).
      //     Tail vs full-page decisions are handled in a higher layer (row/table),
      //     which ensures consistent window geometry before any scaling occurs.

      const currentElementHeight = getOffsetHeightCached(currentElement);
      const isUnbreakableOversized =
        currentElementHeight > capacity &&
        (
          !localPoints.length ||
          (localPoints.length === 1 && localPoints[0] === null)
        );
      if (isUnbreakableOversized) {
        _isDebug(this) && console.warn(
          '%c⚠️ UNSPLITTABLE OVERSIZED ELEMENT — SCALE IT',
          'color:white; background:red; font-weight:bold;',
          currentElement,
          `height: ${currentElementHeight}`
        );
        _isDebug(this) && console.warn('🅾️ (2) points.push(null) in isUnbreakableOversized');
        if (!points.length && currentElement === firstChild) {
          points.push(null);
          // 🤖 Early abort after placing sentinel: proceed to second pass.
          return finalize();
        }
        // 🤖 Keep scaling disabled here for the same reason as above: avoid early
        //     visual transform before the paginator repositions the window.
        // this.fitElementWithinHeight(currentElement, capacity)
        if (nextElement) {
          _isDebug(this) && console.warn('🅾️🅾️🅾️🅾️🅾️🅾️🅾️🅾️ registerPoint(nextElement)');
          const pushedNull = registerPoint(nextElement);
          // 🤖 Case: Unbreakable Oversized Without Children — `pushedNull` bubbles up when even the next sibling would start at the first child.
          // 🤖 Geometrically this declares the first page empty; we stop so the fallback logic can reschedule layout.
          if (pushedNull) {
            return finalize();
          }
        }
      } else {


        // * If no children,
        // * move element to the next page.
        const pushedNull = registerPoint(currentElement);
        // 🤖 Case: Move Current To Next Page — `pushedNull` here means even the first inline block must start on the next page, leaving the current slice blank.
        // 🤖 Geometrically we cannot consume height in the tail, so we bail out to let the fallback choose scaling/full-page flow.
        if (pushedNull) return finalize();
        // ** But,

    }

    } // *** END of 'no children'

  }

  return finalize();
}

/**
 * Compute split points per cell for a row-like item.
 * Performs two passes:
 * 1) First pass with (firstPartHeight, fullPageHeight) per cell (minus shell).
 * 2) If any cell reports an empty first part ([null] sentinel), rerun with
 *    fullPageHeight for both budgets. After second pass, sanitize [null] → []
 *    and set needsScalingInFullPage=true if any persisted.
 *
 * Returns:
 *  - splitPointsPerCell: Element[][] per cell
 *  - isFirstPartEmptyInAnyCell: boolean
 *  - needsScalingInFullPage: boolean
 *
 * @this {Node}
 * @param {Element[]} cells
 * @param {number[]} shells - per-cell shell heights
 * @param {number} rowFirstPartHeight
 * @param {number} rowFullPageHeight
 * @param {Element} parentItem - parent row/container (for getSplitChildren)
 */
export function getSplitPointsPerCells(
  cells,
  shells,
  rowFirstPartHeight,
  rowFullPageHeight,
  parentItem
) {
  _isDebug(this) && console.group('[✖️] getSplitPointsPerCells');

  const firstPass = cells.map((cell, ind) => {
    _isDebug(this) && console.group(`(•) Split CELL.${ind} in:`, parentItem);

    let pts = [];

    const firstH = rowFirstPartHeight - (shells[ind] || 0);
    const fullH = rowFullPageHeight - (shells[ind] || 0);

    // * Prepare children splitting long nodes
    let ch = this.getSplitChildren(cell, firstH, fullH, parentItem);
    if(ch.length) {
      const firstChild = ch[0];
      _isDebug(this) && console.log('firstChild', firstChild);
      // * Find split points
      pts = this.getSplitPoints({
        rootNode: cell,
        children: ch,
        firstPartHeight: firstH,
        fullPageHeight: fullH,
        firstChild: firstChild,
      });
    } else {
      _isDebug(this) && console.log(`(•) empty cell #${ind}`);
    }

    _isDebug(this) && console.log(`(•) return splitPoints for CELL#${ind}`, pts);
    _isDebug(this) && console.groupEnd();
    return pts;
  });

  const isFirstPartEmptyInAnyCell = firstPass.some(isFirstSliceEmpty);
  _isDebug(this) && console.log('🧽🧽🧽🧽🧽🧽🧽 isFirstPartEmptyInAnyCell', isFirstPartEmptyInAnyCell);

  let splitPointsPerCell = firstPass;
  let needsScalingInFullPage = false;

  if (isFirstPartEmptyInAnyCell) {
    splitPointsPerCell = cells.map((cell, ind) => {
      _isDebug(this) && console.group(`(••) Split CELL.${ind} in:`, parentItem);
      const firstH = rowFirstPartHeight - (shells[ind] || 0); // for symmetry
      const fullH = rowFullPageHeight - (shells[ind] || 0);
      const ch = this.getSplitChildren(cell, firstH, fullH, parentItem);
      const firstChild = ch[0];
      _isDebug(this) && console.log('firstChild', firstChild);
      let pts = [];
      if (ch.length) {
        pts = this.getSplitPoints({
        rootNode: cell,
        children: ch,
        firstPartHeight: fullH,
        fullPageHeight: fullH,
        firstChild: firstChild,
        });
      }
      _isDebug(this) && console.log(`(••) return splitPoints for CELL#${ind}`, pts);
      _isDebug(this) && console.groupEnd();
      return pts;
    });
    _isDebug(this) && console.log('[••] splitPointsPerCell', splitPointsPerCell);

    for (let i = 0; i < splitPointsPerCell.length; i++) {
      const pts = splitPointsPerCell[i];
      if (isFirstSliceEmpty(pts) && pts.length === 1) {
        _isDebug(this) && console.log('🧽🧽🧽🧽🧽🧽🧽 needsScalingInFullPage', splitPointsPerCell[i]);
        splitPointsPerCell[i] = [];
        needsScalingInFullPage = true;
      }
    }
  }

  _isDebug(this) && console.groupEnd('[✖️] getSplitPointsPerCells');
  return { splitPointsPerCell, isFirstPartEmptyInAnyCell, needsScalingInFullPage };
}

/**
 * Slices rootNode content (supports nested elements) into parts by splitPoints.
 *
 * 1. Clones rootNode.
 * 2. Removes content outside the split range.
 * 3. Returns each clone as-is (rootNode preserved as wrapper).
 *
 * Differs from sliceNodeContentBySplitPoints: returns rootNode clones, not neutral blocks.
 *
 * @param {Object} param0
 * @param {number} index - Debug index for logging purposes.
 * @param {Node} rootNode - The container node whose content will be split.
 * @param {Element[]} splitPoints - Elements marking where each split should occur.
 * @returns {Node[]} - An array of rootNode clones, each containing a portion of the content.
 *
 * @this {Node}
 */
export function sliceNodeBySplitPoints({ index, rootNode, splitPoints }) {
  _isDebug(this) && console.group(`🔪 (${index}) sliceNodeBySplitPoints`, splitPoints);

  const slices = [];

  // Expectations for input:
  // - splitPoints is sanitized upstream (no sentinel/null markers).
  // - An empty array means "no split" and yields a single full-content slice.
  // - Every point must be an Element contained within rootNode's subtree.
  if (splitPoints.length > 0) {
    this.strictAssert(
      splitPoints.every(p => p !== null),
      'sliceNodeBySplitPoints: splitPoints contains null — sanitize upstream before slicing'
    );
  }
  this.strictAssert(
    splitPoints.every(p => !p || (p.nodeType === Node.ELEMENT_NODE && (rootNode === p || rootNode.contains(p)))),
    'sliceNodeBySplitPoints: split point is not an Element within rootNode'
  );

  for (let i = 0; i <= splitPoints.length; i++) {
    const startElement = splitPoints[i - 1] ?? null;
    const endElement = splitPoints[i] ?? null;

    const slice = this.cloneAndCleanOutsideRange(rootNode, startElement, endElement);
    // * Range is [startElement .. endElement) — end is exclusive.

    this.normalizeContentCuts({
      slice,
      top: startElement !== null,
      bottom: endElement !== null,
    });

    if (this._DOM.getChildNodes(slice).length > 0) {
      slices.push(slice);
    }
  }

  _isDebug(this) && console.log(slices);
  _isDebug(this) && console.groupEnd(`🔪 (${index}) sliceNodeBySplitPoints`);
  return slices;
}

/**
 * @this {Node}
 */
export function normalizeContentCuts({
  slice,
  top = false,
  bottom = false,
}) {
  if (!slice) {
    _isDebug(this) && console.log('[normalizeContentCuts] no slice has been passed; return');
    return
  };

  if (top) {
    const topChain = [...this.getFirstChildrenChain(slice)];
    topChain.forEach(el => this.markCleanTopCut(el));
    _isDebug(this) && console.log('[normalizeContentCuts] topChain 👗', topChain);
  }

  if (bottom) {
    const bottomChain = [...this.getLastChildrenChain(slice)];
    bottomChain.forEach(el => this.markCleanBottomCut(el));
    _isDebug(this) && console.log('[normalizeContentCuts] bottomChain 👗', bottomChain);
  }
}

/**
 * Slices rootNode content (supports nested elements) into parts by splitPoints.
 *
 * 1. Clones rootNode.
 * 2. Removes content outside the split range.
 * 3. Extracts inner content into neutral containers.
 *
 * Returns neutral containers with content slices, discards rootNode itself.
 *
 * @param {Object} param0
 * @param {number} index - Debug index for logging purposes.
 * @param {Node} rootNode - The container node whose content will be split.
 * @param {Element[]} splitPoints - Elements marking where each split should occur.
 * @returns {Node[]} - An array of wrapper nodes, each containing a portion of the content.
 *
 * @this {Node}
 */
export function sliceNodeContentBySplitPoints({ index, rootNode, splitPoints }) {
  _isDebug(this) && console.group(`🔪 (${index}) sliceNodeContentBySplitPoints`);

  const slices = [];

  for (let i = 0; i <= splitPoints.length; i++) {
    const startElement = splitPoints[i - 1] ?? null;
    const endElement = splitPoints[i] ?? null;

    // * Clone rootNode and remove content outside [startElement, endElement)
    const slice = this.cloneAndCleanOutsideRange(rootNode, startElement, endElement);
    _isDebug(this) && console.log({slice});

    // * Create a neutral wrapper for extracted content
    const wrapper = this.createNeutralBlock();

    // * Move inner content from the cloned rootNode slice to the neutral wrapper.
    // * The cloned rootNode itself is discarded: we split content, not root wrapper.
    while (slice.firstChild) {
      wrapper.appendChild(slice.firstChild);
    }

    if (wrapper.childNodes.length > 0) {
      slices.push(wrapper);
    }
  }

  _isDebug(this) && console.log(slices);

  _isDebug(this) && console.groupEnd(`🔪 (${index}) sliceNodeContentBySplitPoints`);
  return slices;
}

// 🤖 Helper: check sentinel that marks an empty first slice in split points result
export function isFirstSliceEmpty(points) {
  if (!Array.isArray(points)) {
    return false;
  }
  return points.length > 0 && points[0] === null;
}

/**
 * @this {Node}
 *
 * Clone the root node and keep only the range between startElement and endElement.
 * Removes all elements outside this range (before start, after end, including end).
 * Used for DOM slicing (e.g., splitting pages).
 *
 * @param {Node} root - Node to clone and trim.
 * @param {Element|null} startElement - First element of the range.
 * @param {Element|null} endElement - Last element of the range.
 * @returns {Node} - Trimmed clone.
 */
export function cloneAndCleanOutsideRange(root, startElement, endElement) {
  startElement && startElement.setAttribute('split', `start`);
  endElement && endElement.setAttribute('split', `end`);
  let clone = root.cloneNode(true);

  // Delete elements before startPoint (if startPoint is not the first)
  if (startElement) {
    // * remove siblings to left
    let startEl = clone.querySelector(`[split="start"]`);
    let prev = startEl.previousElementSibling;
    while (prev) {
      let toRemove = prev;
      prev = prev.previousElementSibling;
      toRemove.remove();
    }
    // * remove ancestors outside range
    let ancestor = startEl.parentElement;
    while (ancestor && ancestor !== root) {
      let sibling = ancestor.previousElementSibling;
      while (sibling) {
        let toRemove = sibling;
        sibling = sibling.previousElementSibling;
        toRemove.remove();
      }
      ancestor = ancestor.parentElement;
    }
    startEl.removeAttribute('split'); // * Clear attribute
  }

  // Delete elements after and including endPoint (if endPoint is not the last)
  if (endElement) {
    // * remove siblings to right and element
    let endEl = clone.querySelector(`[split="end"]`);
    let next = endEl.nextElementSibling;
    while (next) {
      let toRemove = next;
      next = next.nextElementSibling;
      toRemove.remove();
    }
    // * remove ancestors outside range
    let ancestor = endEl.parentElement;
    while (ancestor && ancestor !== root) {
      let sibling = ancestor.nextElementSibling;
      while (sibling) {
        let toRemove = sibling;
        sibling = sibling.nextElementSibling;
        toRemove.remove();
      }
      ancestor = ancestor.parentElement;
    }
    endEl.remove(); // * remove end element
  }
  // * Clear attributes
  startElement && startElement.removeAttribute('split');
  endElement && endElement.removeAttribute('split');
  return clone;
}
