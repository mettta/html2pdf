
/**
 * @this {Node}
 */
export function isFirstChildOfFirstChild(element, rootElement) {
  if (!element || !this._DOM.getParentNode(element)) {
    return false;
  }

  let currentElement = element;

  while (this._DOM.getParentNode(currentElement) && currentElement !== rootElement) {
    if (this._DOM.getFirstElementChild(this._DOM.getParentNode(currentElement)) !== currentElement) {
      return false;
    }

    currentElement = this._DOM.getParentNode(currentElement);
  }

  // * Making sure we get to the end,
  // * and don't exit with "false" until the end of the check.
  return currentElement === rootElement;
}

/**
 * @this {Node}
 */
export function isLastChildOfLastChild(element, rootElement) {
  if (!element || !this._DOM.getParentNode(element)) {
    return false;
  }

  let currentElement = element;

  // *** moving up
  while (this._DOM.getParentNode(currentElement) && currentElement !== rootElement) {

    // *** if we're at the root, we move to the right
    if (this._DOM.getParentNode(currentElement) === rootElement) {

      // ! in Pages we inserted an element 'html2pdf-content-flow-end'
      // ! at the end of the content flow.
      // ! Therefore, in the last step of the check, we should not check the last child,
      // ! but the matchings of the nextSibling.
      // ? ...and some plugins like to insert themselves at the end of the body.
      // ? So let's check that stupidity too..
      let _next = this._DOM.getRightNeighbor(currentElement);

      while (!this._DOM.getElementOffsetHeight(_next) && !this._DOM.getElementOffsetWidth(_next)) {
        // *** move to the right
        _next = this._DOM.getRightNeighbor(_next);
        // *** and see if we've reached the end
        if (this.isContentFlowEnd(_next)) {
          return true;
        }
      }
      // *** see if we've reached the end
      return this.isContentFlowEnd(_next);
    }

    // *** and while we're still not at the root, we're moving up
    if (this._DOM.getLastElementChild(this._DOM.getParentNode(currentElement)) !== currentElement) {
      return false;
    }

    currentElement = this._DOM.getParentNode(currentElement);
  }

  // * Making sure we get to the end,
  // * and don't exit with "false" until the end of the check.
  return currentElement === rootElement;
}

/**
 * @this {Node}
 */
export function isLineChanged(current, next) {
  // * (-1): Browser rounding fix (when converting mm to pixels).
  const delta = this._DOM.getElementOffsetTop(next)
              - this._DOM.getElementOffsetBottom(current);
  const vert = delta > (-2);
  // const gor = this.getElementLeft(current) + this.getElementWidth(current) > this.getElementLeft(next);
  return vert;
}

// TODO: isLineChanged vs isLineKept: можно сделать else? они противоположны
/**
 * @this {Node}
 */
export function isLineKept(current, next, debug) {
  // * (-1): Browser rounding fix (when converting mm to pixels).
  const currentBottom = this._DOM.getElementOffsetBottom(current);
  const nextTop = this._DOM.getElementOffsetTop(next);
  const delta = currentBottom - nextTop;
  const vert = delta >= 2;
  debug && console.group('isLineKept?')
  debug && console.log(
    '\n',
    vert,
    '\n',
    '\n currentBottom', currentBottom, [current],
    '\n nextTop', nextTop, [next],
'\n delta', delta,
    );
    debug && console.groupEnd('isLineKept?')
  return vert;
}
