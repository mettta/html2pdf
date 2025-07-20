// 🔪 slicers

import { debugFor } from '../utils/debugFor.js';
const _isDebug = debugFor('slicers');

/**
 * High-level wrapper to slice content into parts based on height.
 * * Here, the split points are searched for once without additional checks.
 * * Therefore, in the context of the table, the functions `getSplitPoints()`
 * * and `sliceNodeContentBySplitPoints()` are used separately.
 * @this {Node}
 */
export function sliceNodeContent({ rootNode, firstPartHeight, fullPageHeight, root }) {
  const tdChildren = this.getSplitChildren(rootNode, firstPartHeight, fullPageHeight, root);
  const splitPoints = getSplitPoints.call(this, {
    rootNode: rootNode,
    children: tdChildren,
    firstPartHeight,
    fullPageHeight,
  });

  const contentSlices = sliceNodeContentBySplitPoints.call(this, {
    rootNode: rootNode,
    splitPoints,
  });

  _isDebug(this) && console.log('🍇', {contentSlices})
  return contentSlices;
}

/**
 * Find split points inside rootNode content.
 *
 * Walks through rootNode's children recursively (including nested).
 * Returns elements where content should break into pages.
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

  points = [],
}) {

  const registerPoint = (element) => {

    const point = this.findBetterPageStart(
      element,
      points.at(-1),
      rootNode,
      rootNode
    );

    // * If we try to register the first element as a new page: `point === children[0]`,
    // * it is a something big that does not fit in first part.
    if (!points.length && point === children[0]) {
      _isDebug(this) && console.log('%c point === children[0]', 'color:red');
      points.push(null)
    } else {
      points.push(point)
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
  _setInitStyle.call(this, true, rootNode, _rootComputedStyle);

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

  const rootPaddingTop = parseFloat(_rootComputedStyle.paddingTop) || 0;

  _isDebug(this) && console.groupCollapsed(`walking through ${children.length} children`);
  for (let i = 0; i < children.length; i++) {

    const currentElement = children[i];
    const previousElement = children[i - 1];
    const nextElement = children[i + 1];

    _isDebug(this) && console.log('🍎', {currentElement, previousElement, nextElement});

    const nextElementTop = nextElement
      ? this.getTop(nextElement, rootNode) - rootPaddingTop // ⚠️ See comment above about normalization.
      : undefined;

    const floater = (points.length === 0) // * empty array => process first slice
      ? firstPartHeight
      : (
        (points.at(-1) === null) // * case with empty first slice
          ? fullPageHeight
          : fullPageHeight + this.getTop(points.at(-1), rootNode) - rootPaddingTop // ⚠️ See comment above about normalization.
      );

    if (this.isForcedPageBreak(currentElement)) {
      //register
      registerPoint(currentElement);

      // TODO #ForcedPageBreak
      // TODO MAKE IT VERY BIG
      _isDebug(this) && console.warn(
        '🍎', [currentElement], 'isForcedPageBreak'
      );
    }

    if (nextElementTop <= floater) {
      // * CurrentElement does fit in the remaining space on the page.

      _isDebug(this) && console.log(`🍎 current fits: (next top) ${nextElementTop} <= ${floater} (floater)`, [currentElement]);

      // * go to next index
    } else { // *** (nextElementTop > floater) --> currentElement ?
      // * Next element will definitely be on the next page.
      // * And the CurrentElement? It's not clear yet. Let's check its bottom.

      if (this.isSVG(currentElement) || this.isIMG(currentElement)) {
        // TODO needs testing
        _isDebug(this) && console.log('%cIMAGE 💟💟', 'color:red;text-weight:bold')
      }

      const currentElementBottom = this.getBottomWithMargin(currentElement, rootNode) - rootPaddingTop; // ⚠️ See comment above about normalization.

      _isDebug(this) && console.log(`🍎 current does not fit: (next top) ${nextElementTop} > ${floater} (floater)`, [currentElement]);
      _isDebug(this) && console.log(`🍎 ? (curr bottom) ${currentElementBottom} // ${floater} (floater)`, [currentElement]);

      if (currentElementBottom <= floater) {
        // * CurrentElement does fit in the remaining space on the page.

        _isDebug(this) && console.log(`🍎 (curr bottom) ${currentElementBottom} <= ${floater} (floater)`, [currentElement]);

        if (nextElement) {
          // ** the nextElement is found

          // TODO like in pages?
          // if (this.isNoHanging(currentElement)) {
          //   // -- current fits but it can't be the last
          //   _isDebug(this) && console.log('💟💟 currentElement _isNoHanging');
          //   registerPoint(currentElement); // ????????????
          // }

          _isDebug(this) && console.log('🍎 register nextElement as Point:', [nextElement]);
          registerPoint(nextElement);
        } else {
          // ** No nextElement - this is the end of element list.
          _isDebug(this) && console.log('🍎 this is the end of element list ///');

          // TODO: move this case up to `if (nextElementTop <= floater)`
        }

      } else {
        // * CurrentElement does NOT fit in the remaining space on the page.
        _isDebug(this) && console.log(`🍎 current does NOT fit (curr bottom) ${currentElementBottom} > ${floater} (floater)`, [currentElement]);
        _isDebug(this) && console.log(`🍎 try to split it`);

        // * Try to split it.

        let localPoints = [];

        // TODO: The code below requires further refinement.

        const currentElementChildren = this.getSplitChildren(currentElement, firstPartHeight, fullPageHeight, rootNode);

        // * Parse children:
        if (currentElementChildren.length) {

          // * Process children if exist:
          localPoints = getSplitPoints.call(this, {
            rootNode,
            rootComputedStyle: _rootComputedStyle,
            children: currentElementChildren,
            firstPartHeight,
            fullPageHeight,

            points,
          });

          // *** END of 'has children'

          if (localPoints.length === 0) {
            // не разбито - потому выбираем первую часть - если она больше, то есть - бОльшую часть
            const room = Math.max(firstPartHeight, fullPageHeight);

            const currentElementHeight = this._DOM.getElementOffsetHeight(currentElement);
            const isUnbreakableOversized =
              currentElementHeight > room &&
              (
                !localPoints.length ||
                (localPoints.length === 1 && localPoints[0] === null)
              );

            _isDebug(this) && console.log('🍎 room)', room);

            if (isUnbreakableOversized) {
              _isDebug(this) && console.warn(
                '%c⚠️ UNSPLITTABLE OVERSIZED ELEMENT — SCALE IT',
                'color:white; background:red; font-weight:bold;',
                currentElement,
                `height: ${currentElementHeight}`
              );
              if (!points.length && currentElement === children[0]) {
                _isDebug(this) && console.warn('⛔ points.push(null) 1');
                points.push(null);
              }
              _scaleElementToFitHeight.call(this, currentElement, room)
              if (nextElement) { registerPoint(nextElement) }
            } else {

              // FIXME: быстрый фикс, но помог. Проверить тщательно логику.
              registerPoint(currentElement)
            }
          }


        } else {

          // 🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎
          _isDebug(this) && console.log('🍎 currentElementChildren.length == 0');

          // FIXME: брать для масштабирования первую часть (она у таблиц больше!) или "полную страницу"?

          const currentElementHeight = this._DOM.getElementOffsetHeight(currentElement);
          const isUnbreakableOversized =
            currentElementHeight > fullPageHeight &&
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
            _isDebug(this) && console.warn('⛔ points.push(null) 2');
            if (!points.length && currentElement === children[0]) {
                points.push(null);
            }
            _scaleElementToFitHeight.call(this, currentElement, fullPageHeight)
            if (nextElement) { registerPoint(nextElement) }
          } else {


            // * If no children,
            // * move element to the next page.
            registerPoint(currentElement);
            // ** But,

          }

        } // *** END of 'no children'
      } // *** END of 'currentElementBottom > floater'

      // const currentElementHeight = this._DOM.getElementOffsetHeight(currentElement);
      // const innerPoints = getSplitPoints.call(this, {
      //   rootNode: currentElement,
      //   children: currentElementChildren,
      //   firstPartHeight,
      //   fullPageHeight,
      //   points: []
      // });

      // const isUnbreakableOversized =
      //   currentElementHeight > fullPageHeight &&
      //   (
      //     !innerPoints.length ||
      //     (innerPoints.length === 1 && innerPoints[0] === null)
      //   );

      // if (isUnbreakableOversized) {
      //   _isDebug(this) && console.warn(
      //     '%c⚠️ UNSPLITTABLE OVERSIZED ELEMENT — SCALE IT',
      //     'color:white; background:red; font-weight:bold;',
      //     currentElement,
      //     `height: ${currentElementHeight}`
      //   );
      //   _scaleElementToFitHeight.call(this, currentElement, fullPageHeight);
      // }

    }
  }
  _isDebug(this) && console.groupEnd(`walking through ${children.length} children`);

  // *** need to revert back to the original positioning & vertical align of the rootNode:
  _setInitStyle.call(this, false, rootNode, rootComputedStyle);

  _isDebug(this) && console.groupEnd(`getSplitPoints`);

  return points
}

/**
 * Splits `rootNode`'s direct children into parts by `splitPoints`.
 *
 * Each part contains consecutive child nodes between split points.
 *
 * Child nodes are deep-cloned into new wrapper elements.
 *
 * * Important: `splitPoints` must reference direct children of `rootNode`,
 * * not nested inside them.
 *
 * @param {Object} param0
 * @param {number} index - Debug index for logging purposes.
 * @param {Node} rootNode - The container node whose children will be split.
 * @param {Element[]} splitPoints - Elements marking where each split should occur.
 * @returns {Node[]} - An array of wrapper nodes, each containing a portion of the content.
 *
 * @this {Node}
 */
export function sliceNodeContentBySplitPointsFlat({ index, rootNode, splitPoints }) {
  _isDebug(this) && console.group(`🔪 (${index}) sliceNodeContentBySplitPointsFlat`);

  const allChildren = [...rootNode.childNodes];
  const parts = [];

  console.log('allChildren', allChildren);
  console.log('splitPoints', splitPoints);

  const indexes = splitPoints
    .map(point => allChildren.indexOf(point))
    .filter(i => i !== -1)
    .sort((a, b) => a - b);

  _isDebug(this) && console.log('indexes', indexes);

  let startIdx = 0;

  for (let i = 0; i <= indexes.length; i++) {

    const endIdx = indexes[i] ?? allChildren.length;
    _isDebug(this) && console.log('endIdx', endIdx);

    const wrapper = this.createNeutralBlock();

    for (let j = startIdx; j < endIdx; j++) {
      const clonedNode = allChildren[j].cloneNode(true);
      _isDebug(this) && console.log('clonedNode', clonedNode);
      wrapper.appendChild(clonedNode);
    }

    if (wrapper.childNodes.length > 0) {
      parts.push(wrapper);
    }

    startIdx = endIdx;
  }

  _isDebug(this) && console.log(parts);
  _isDebug(this) && console.groupEnd(`🔪 (${index}) sliceNodeContentBySplitPointsFlat`);
  return parts;
}

/**
 * Splits rootNode content into slices by splitPoints (supports nested elements).
 *
 * Each slice is created by cloning rootNode and removing content outside the range
 * between split points (via cloneAndCleanOutsideRange).
 *
 * The cloned rootNode acts as a temporary wrapper. Since we split content, not the wrapper itself,
 * we extract inner content and place it into a neutral block.
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

// 🔒 private

/**
 * @this {Node}
 */
function _scaleElementToFitHeight(element, targetHeight) {
  // `transform: scale` does not affect the element’s box model or its parent’s layout
  //  because scaling is a visual transformation only, not part of normal document flow.
  // `transform: scale` visually changes the size of an element, but its actual size in the layout
  //  stays the same — so the parent doesn’t shrink or grow based on the scaled size.
  const actualHeight = this._DOM.getElementOffsetHeight(element);

  if (actualHeight <= targetHeight) return;

  const scale = targetHeight / actualHeight;

  element.style.transformOrigin = 'top left';
  element.style.transform = `scale(${scale})`;

  // const scaler = this.create('div');
  const scaler = this.createNeutral();
  scaler.style.display = 'inline-block';
  scaler.style.width = '100%';
  scaler.style.height = targetHeight + 'px';

  this._DOM.wrap(element, scaler);

  _isDebug(this) && console.warn(
    `%c Scaled element to fit target height: ${targetHeight}px`,
    'color:orange; font-weight:bold;',
    `scale: ${scale}`,
    element
  );
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

// 🔧 Service:

/**
 * @this {Node}
 */
function _setInitStyle(on, rootNode, rootComputedStyle) {
  const INIT_POS_SELECTOR = '[init-position]';
  const INIT_ALI_SELECTOR = '[init-vertical-align]';
  const UTILITY_POS = 'relative';
  const UTILITY_ALI = 'top';

  const _rootComputedStyle = rootComputedStyle
    ? rootComputedStyle
    : this._DOM.getComputedStyle(rootNode);

  const initPositionValue = _rootComputedStyle.position;
  const initVerticalAlignValue = _rootComputedStyle.verticalAlign;

  if (on) {
    // set
    if (initPositionValue != UTILITY_POS) {
      this._DOM.setStyles(rootNode, { 'position': UTILITY_POS });
      this._DOM.setAttribute(rootNode, INIT_POS_SELECTOR, initPositionValue);
    }
    if (initVerticalAlignValue != UTILITY_ALI) {
      this._DOM.setStyles(rootNode, { 'vertical-align': UTILITY_ALI });
      this._DOM.setAttribute(rootNode, INIT_ALI_SELECTOR, initVerticalAlignValue);
    }
  } else {
    // back
    // * We need to return exactly the value (backPosition & backVerticalAlign),
    // * not just delete the utility value (like { position: '' }),
    // * because we don't store the data, where exactly the init value was taken from,
    // * and maybe it's not in CSS and it's not inherited -
    // * and it's overwritten in the tag attributes.
    const backPosition = this._DOM.getAttribute(rootNode, INIT_POS_SELECTOR);
    const backVerticalAlign = this._DOM.getAttribute(rootNode, INIT_ALI_SELECTOR);
    if (backPosition) {
      this._DOM.setStyles(rootNode, { position: backPosition });
      this._DOM.removeAttribute(rootNode, INIT_POS_SELECTOR);
    }
    if (backVerticalAlign) {
      this._DOM.setStyles(rootNode, { 'vertical-align': backVerticalAlign });
      this._DOM.removeAttribute(rootNode, INIT_ALI_SELECTOR);
    }
  }
}
