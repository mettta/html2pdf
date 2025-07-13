// 🔪

/**
 * High-level wrapper to slice content into parts based on height.
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

  console.log('🍇', {contentSlices})
  return contentSlices;
}

/**
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
  this._debug._ && console.group('✂️ getSplitPoints'); // Collapsed
  this._debug._ && console.log('points.length', points.length);

  const _rootComputedStyle = rootComputedStyle
    ? rootComputedStyle
    : this._DOM.getComputedStyle(rootNode);
  const _firstStartPoint = children[0]; // FIXME

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

  // console.log('_rootComputedStyle', _rootComputedStyle);
  console.log('children[0]', children[0]);

  const registerPoint = (element) => {
    // !points.length && points.push(children[0])
    const point = this.findBetterPageStart(
      element,
      points.at(-1),
      rootNode,
      rootNode
    );

    // if point === children[0]
    // it is a something big that does not fit in first part
    if (!points.length && point === _firstStartPoint) {
      this._debug._ && console.log('%c point === children[0]', 'color:red');
      points.push(null)
    }

    // if (!points.length) {
    //   points.push(_firstStartPoint)
    // }

    points.push(point)
  }

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

  for (let i = 0; i < children.length; i++) {

    const previousElement = children[i - 1];
    const currentElement = children[i];
    const nextElement = children[i + 1];
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
      this._debug._ && console.warn(
        currentElement, '💟 is isForcedPageBreak'
      );
    }



    // TODO:
    // nextElementTop?
    // nextElement?

    if (nextElementTop <= floater) { // -- current fits


      // ????????????????????????????
      // if (this.isNoHanging(currentElement)) { // TODO like in pages
      //   // -- current fits but it can't be the last
      //   this._debug._ && console.log('💟💟 currentElement _isNoHanging');
      //   registerPoint(currentElement); // ????????????
      // }

      console.log('🍎 current fits (by next top)', nextElementTop, '<=', floater);



      // go to next index
    } else { // (nextElementTop > floater) --> currentElement ?

      console.log('🍎 current does not fit (by next top)', nextElementTop, '>', floater);

      if (this.isSVG(currentElement) || this.isIMG(currentElement)) {
        // TODO needs testing
        this._debug._ && console.log('%cIMAGE 💟💟', 'color:red;text-weight:bold')
      }


      const currentElementBottom = this.getBottomWithMargin(currentElement, rootNode) - rootPaddingTop; // ⚠️ See comment above about normalization.

      this._debug._ && console.log(
        '💟 nextElementTop > floater 💟',
        '\n currentElement', currentElement,
        '\n currentElementBottom', currentElementBottom,
        '\n floater', floater
      );

      // IF currentElement does fit
      // in the remaining space on the page,
      if (currentElementBottom <= floater) {

        this._debug._ && console.log('💟💟 currentElementBottom <= floater 💟');

        // ** add nextElement check (undefined as end)
        if (nextElement) {
          this._debug._ && console.log('💟💟💟 register nextElement 💟');
          registerPoint(currentElement);
        } // else - this is the end of element list

      } else {

        console.log('🍎 current does not fit (by own bottom)');

        // currentElementBottom > floater
        // try to split 🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎
        this._debug._ && console.log(
          '💟💟💟 currentElementBottom > floater,\ntry to split 💟',
          currentElement
        );



        // // TODO TEST ME: #fewLines & PAGES
        // if (this._DOM.getElementOffsetHeight(currentElement) < this._minimumBreakableHeight) {
        //   this._registerPageStart(currentElement, true);
        //   this.markProcessed(currentElement, `starts new page, #fewLines`);
        //   this._debugMode && this._debugToggler._parseNode && console.log('%c END _parseNode #fewLines', CONSOLE_CSS_END_LABEL);
        //   this._debugMode && this._debugToggler._parseNode && console.groupEnd();
        //   return
        // }

        console.log('🍎 try to split)');

        let localPoints = [];

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

            console.log('🍎 room)', room);

            if (isUnbreakableOversized) {
              this._debug._ && console.warn(
                '%c⚠️ UNSPLITTABLE OVERSIZED ELEMENT — SCALE IT',
                'color:white; background:red; font-weight:bold;',
                currentElement,
                `height: ${currentElementHeight}`
              );
              if (!points.length && currentElement === children[0]) {
                console.warn('points.push(null) 1');
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
          console.log('🍎 ???)');

          // FIXME: брать для масштабирования первую часть (она у таблиц больше!) или "полную страницу"?

          const currentElementHeight = this._DOM.getElementOffsetHeight(currentElement);
          const isUnbreakableOversized =
            currentElementHeight > fullPageHeight &&
            (
              !localPoints.length ||
              (localPoints.length === 1 && localPoints[0] === null)
            );
          if (isUnbreakableOversized) {
            this._debug._ && console.warn(
              '%c⚠️ UNSPLITTABLE OVERSIZED ELEMENT — SCALE IT',
              'color:white; background:red; font-weight:bold;',
              currentElement,
              `height: ${currentElementHeight}`
            );
            console.warn('points.push(null) 2');
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
      //   this._debug._ && console.warn(
      //     '%c⚠️ UNSPLITTABLE OVERSIZED ELEMENT — SCALE IT',
      //     'color:white; background:red; font-weight:bold;',
      //     currentElement,
      //     `height: ${currentElementHeight}`
      //   );
      //   _scaleElementToFitHeight.call(this, currentElement, fullPageHeight);
      // }

    }
  }

  // *** need to revert back to the original positioning & vertical align of the rootNode:
  _setInitStyle.call(this, false, rootNode, rootComputedStyle);

  this.logGroupEnd(`getSplitPoints`);

  return points
}

/**
 * Split rootNode content based on calculated split points.
 * @this {Node}
 */
export function sliceNodeContentBySplitPoints({ rootNode, splitPoints }) {
  const allChildren = [...rootNode.childNodes];
  const parts = [];

  const indexes = splitPoints
    .map(point => allChildren.indexOf(point))
    .filter(i => i !== -1)
    .sort((a, b) => a - b);

  let startIdx = 0;

  for (let i = 0; i <= indexes.length; i++) {

    const endIdx = indexes[i] ?? allChildren.length;
    const wrapper = this.createNeutralBlock();

    for (let j = startIdx; j < endIdx; j++) {
      const clonedNode = allChildren[j].cloneNode(true);
      wrapper.appendChild(clonedNode);
    }

    if (wrapper.childNodes.length > 0) {
      parts.push(wrapper);
    }

    startIdx = endIdx;
  }

  return parts;
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

  this._debug._ && console.warn(
    `%c Scaled element to fit target height: ${targetHeight}px`,
    'color:orange; font-weight:bold;',
    `scale: ${scale}`,
    element
  );
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

// ??? BACKUP

/**
 * @this {Node}
 */
function cloneAndCleanOutsideRange(root, startElement, endElement) {
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
