// GET NODE

/**
 * @this {Node}
 */
export function get(selector, target = this._DOM) {
  this._debug._ && console.assert(selector);
  return this._DOM.getElement(selector, target);
}

/**
 * @this {Node}
 */
export function getAll(selectors, target = this._DOM) {
  this._debug._ && console.assert(selectors);
  if (typeof selectors === 'string') {
    selectors = selectors.split(',').filter(Boolean);
  }
  this._assert && console.assert(Array.isArray(selectors), 'Selectors must be provided as an array or string (one selector or multiple selectors, separated by commas). Now the selectors are:', selectors);
  this._debug._ && console.assert(selectors.length > 0, 'getAll(selectors), selectors:', selectors);

  if (selectors.length === 1) {
    return [...this._DOM.getAllElements(selectors[0], target)]
  } else {
    return [...selectors].flatMap(
      selector => [...this._DOM.getAllElements(selector, target)]
    )
  }
}

// GET PARAMS

/**
 * @this {Node}
 */
export function getTop(element, root = null, topAcc = 0) {
  if (!element) {
    this._debug._ && console.warn(
      'element must be provided, but was received:', element,
      '\nThe function returned:', undefined
    );
    return;
  }

  // the offset case
  if (root === null) {
    return this._DOM.getElementOffsetTop(element)
  }

  if (!root) {
    this._debug._ && console.warn(
      'root must be provided, but was received:', root,
      '\nThe function returned:', undefined
    );
    return;
  }

  const offsetParent = this._DOM.getElementOffsetParent(element);

  // TODO element == document.body
  if (!offsetParent) {
    this._debug._ && console.warn(
      'Element has no offset parent.',
      '\n element:', [element],
      '\n offsetParent:', offsetParent,
      '\n The function returned:', undefined
    );
    return;
  }

  const currTop = this._DOM.getElementOffsetTop(element);

  if (offsetParent === root) {
    return (currTop + topAcc);
  } else {
    return this.getTop(offsetParent, root, topAcc + currTop);
  }
}

/**
 * @this {Node}
 */
export function getBottom(element, root = null) {
  if (!element) {
    this._debug._ && console.warn(
      'element must be provided, but was received:', element,
      '\nThe function returned:', undefined
    );
    return;
  }

  // the offset case
  if (root === null) {
    return this._DOM.getElementOffsetBottom(element);
  }

  if (!root) {
    this._debug._ && console.warn(
      'root must be provided, but was received:', root,
      '\nThe function returned:', undefined
    );
    return;
  }

  return this.getTop(element, root) + this._DOM.getElementOffsetHeight(element);
}

/**
 * @this {Node}
 */
export function getHeightWithMargin(element) {
  const topMargin = parseInt(this._DOM.getComputedStyle(element).marginTop);
  const bottomMargin = parseInt(this._DOM.getComputedStyle(element).marginBottom);
  const height = this._DOM.getElementOffsetHeight(element);
  return height + topMargin + bottomMargin;
}

/**
 * @this {Node}
 */
export function getBottomWithMargin(element, root) {
  // TODO : performance
  // ? However, the performance compared to getBottom() decreases:
  // ? 0.001 to 0.3 ms per such operation.

  // * Because of the possible bottom margin
  // * of the parent element or nested last children,
  // * the exact check will be through the creation of the test element.
  // * (The bottom margin pushes the test DIV below the margin).

  // * However, not all structures give the correct result. For example,
  // * flex or others with vertical rhythm abnormalities.
  // * Therefore, we implement an additional check.

  if (!element) {
    return;
  }

  const _elementBottom = this.getBottom(element, root);
  let result;

  const test = this.createNeutralBlock();
  this._DOM.insertAfter(element, test);
  const testTop = this.getTop(test, root);
  this._DOM.removeNode(test);

  // * In case of normal vertical rhythm, the position of the test element
  // * inserted after the current one can only be greater than or equal
  // * to _elementBottom:

  const isTestResultValid = testTop >= _elementBottom;

  if (isTestResultValid) {
    result = testTop;
  } else {
    // * Otherwise, we'll have to use a less accurate but stable method.
    const bottomMargin = this._DOM.getComputedStyle(element).marginBottom;
    result = _elementBottom + bottomMargin;
  }

  return result;
}

/**
 * @this {Node}
 */
export function getTopWithMargin(element, root) {
  // TODO : performance
  const topMargin = parseInt(this._DOM.getComputedStyle(element).marginTop);
  return this.getTop(element, root) - topMargin;
}

/**
 * @this {Node}
 */
export function getMaxWidth(node) {
  // * width adjustment for createTestNodeFrom()
  // ? problem: if the node is inline,
  // it may not show its maximum width in the parent context.
  // So we make a block element that shows
  // the maximum width of the node in the current context:
  const tempDiv = this.create();
  this._DOM.insertAtEnd(node, tempDiv);
  const width = this._DOM.getElementOffsetWidth(tempDiv);
  this._DOM.removeNode(tempDiv);
  return width;
}

/**
 * @this {Node}
 */
export function getEmptyNodeHeight(node, margins = true) {
  const wrapper = this.create();
  margins && this._DOM.setStyles(wrapper, {padding: '0.1px'});
  const clone = this._DOM.cloneNodeWrapper(node);
  if (this._DOM.getElementTagName(node) === 'TABLE') {
    this._DOM.setInnerHTML(clone, '<tr><td></td></tr>');
  }
  this._DOM.insertAtEnd(wrapper, clone);
  this._DOM.insertBefore(node, wrapper);
  const wrapperHeight = this._DOM.getElementOffsetHeight(wrapper);
  this._DOM.removeNode(wrapper);
  return wrapperHeight;
}

/**
 * @this {Node}
 */
export function getLineHeight(node) {
  const testNode = this.createNeutral();
  this._DOM.setInnerHTML(testNode, '!');
  this._DOM.setStyles(testNode, {
    display: 'block',
  });

  this._DOM.insertAtEnd(node, testNode);
  const lineHeight = this._DOM.getElementOffsetHeight(testNode);
  this._DOM.removeNode(testNode);
  return lineHeight;
}

/**
 * @this {Node}
 */
export function getTableRowHeight(tr, num = 0) {
  const initialTop = this._DOM.getElementOffsetTop(tr);
  const clone = this._DOM.cloneNode(tr);
  const text = '!<br />'.repeat(num);
  [...clone.children].forEach(td => this._DOM.setInnerHTML(td, text));
  this._DOM.insertBefore(tr, clone);
  const endTop = this._DOM.getElementOffsetTop(tr);
  this._DOM.removeNode(clone);
  return endTop - initialTop; // TODO?
}

/**
 * @this {Node}
 */
export function getTableEntries(node) {
  const nodeEntries = [...node.children].reduce((acc, curr) => {
    const tag = curr.tagName;

    if (tag === 'TBODY') {
      return {...acc, rows: [...acc.rows, ...curr.children]};
    }

    if (tag === 'CAPTION') {
      this.setFlagNoBreak(curr);
      return {...acc, caption: curr};
    }

    if (tag === 'COLGROUP') {
      this.setFlagNoBreak(curr);
      return {...acc, colgroup: curr};
    }

    if (tag === 'THEAD') {
      this.setFlagNoBreak(curr);
      return {...acc, thead: curr};
    }

    if (tag === 'TFOOT') {
      this.setFlagNoBreak(curr);
      return {...acc, tfoot: curr};
    }

    if (tag === 'TR') {
      return {...acc, rows: [...acc.rows, ...curr]};
    }

    return {
      ...acc,
      unexpected: [
        ...acc.unexpected,
        ...curr, // BUG: Uncaught TypeError: t is not iterable
      ]
    };
  }, {
    caption: null,
    thead: null,
    tfoot: null,
    rows: [],
    unexpected: [],
  });

  if (nodeEntries.unexpected.length > 0) {
    this._debug._ && console.warn(`something unexpected is found in the table ${node}`);
  }

  return nodeEntries;
}
