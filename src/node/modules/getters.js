// 📥 getters

import { debugFor } from '../utils/debugFor.js';
const _isDebug = debugFor('getters');

/**
 * Returns element's top position measured in page-candidate context.
 * Used when evaluating elements as potential page starts.
 *
 * Previously, we used getTopWithMargin().
 * Top margin is excluded since it's reset on new pages now.
 *
 * @this {Node}
 */
export function getTopForPageStartCandidate(element, root) {
  const top = this.getTop(element, root);
  return top
}

/**
 * Returns offsetTop of element relative to root, normalized by root's padding-top.
 *
 * In layouts like TD, the available height is usually precomputed excluding padding-top.
 * But element.offsetTop starts after padding-top — leading to double-counting it.
 *
 * This function compensates by subtracting padding-top, so positioning aligns
 * with the precomputed height budget.
 *
 * @this {Node}
 */
export function getNormalizedTop(element, root, rootComputedStyle) {
  const _rootComputedStyle = rootComputedStyle ? rootComputedStyle : this._DOM.getComputedStyle(root);
  const rootPaddingTop = parseFloat(_rootComputedStyle.paddingTop) || 0;
  return this.getTop(element, root) - rootPaddingTop;
}

/**
 * Returns offsetBottom (with margins) of element relative to root, normalized by root's padding-top.
 *
 * In layouts like TD, the available height is usually precomputed excluding padding-top.
 * But element.offsetTop starts after padding-top — leading to double-counting it.
 *
 * This function compensates by subtracting padding-top, so positioning aligns
 * with the precomputed height budget.
 * @this {Node}
 */
export function getNormalizedBottomWithMargin(element, root, rootComputedStyle) {
  const _rootComputedStyle = rootComputedStyle ? rootComputedStyle : this._DOM.getComputedStyle(root);
  const rootPaddingTop = parseFloat(_rootComputedStyle.paddingTop) || 0;
  return this.getBottomWithMargin(element, root) - rootPaddingTop;
}

/**
 * @this {Node}
 */
export function getTop(element, root = null, topAcc = 0) {
  if (!element) {
    _isDebug(this) && console.warn(
      'element must be provided, but was received:', element,
      '\nThe function returned:', undefined
    );
    return
  }

  // the offset case
  if (root === null) {
    return this._DOM.getElementOffsetTop(element)
  }

  if (!root) {
    _isDebug(this) && console.warn(
      'root must be provided, but was received:', root,
      '\nThe function returned:', undefined
    );
    return
  }

  const offsetParent = this._DOM.getElementOffsetParent(element);

  // TODO element == document.body
  if (!offsetParent) {
    _isDebug(this) && console.warn(
      'Element has no offset parent.',
      '\n element:', [element],
      '\n offsetParent:', offsetParent,
      '\n The function returned:', undefined
    );
    return
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
    _isDebug(this) && console.warn(
      'element must be provided, but was received:', element,
      '\nThe function returned:', undefined
    );
    return
  }

  // the offset case
  if (root === null) {
    return this._DOM.getElementOffsetBottom(element)
  }

  if (!root) {
    _isDebug(this) && console.warn(
      'root must be provided, but was received:', root,
      '\nThe function returned:', undefined
    );
    return
  }

  return this.getTop(element, root) + this._DOM.getElementOffsetHeight(element);
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
    return
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
    const bottomMargin = parseInt(this._DOM.getComputedStyle(element).marginBottom);
    result = _elementBottom + bottomMargin;
  }
  return result;
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
export function getTopWithMargin(element, root) {
  // TODO : performance
  const topMargin = parseInt(this._DOM.getComputedStyle(element).marginTop);
  return this.getTop(element, root) - topMargin;
}

/**
 * @this {Node}
 */
export function getMaxWidth(node) {
  // * width adjustment for createTestNodeFrom() from Node
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
export function getEmptyNodeHeightByProbe(node, inner = '', margins = true) {
  // An inner is expected for elements with a specific structure,
  // e.g. “<tr><td></td></td></tr>” for a table.
  const wrapper = this.create();
  margins && this._DOM.setStyles(wrapper, { overflow: 'auto' });
  const clone = this._DOM.cloneNodeWrapper(node);
  this._DOM.setInnerHTML(clone, inner);
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
  // if node has padding, this affects so cant be taken bode clone as wrapper // todo comment
  // const testNode = this._DOM.cloneNodeWrapper(node);
  this._DOM.setInnerHTML(testNode, '!');
  this._DOM.setStyles(testNode, {
    display: 'block',
    // ! 'absolute' added extra height to the element:
    // position: 'absolute',
    // left: '-10000px',
    // width: '100%',
  });

  this._DOM.insertAtEnd(node, testNode);
  const lineHeight = this._DOM.getElementOffsetHeight(testNode);
  this._DOM.removeNode(testNode);
  return lineHeight;
}

/**
 * @this {Node}
 *
 * Create an empty row by cloning the TR, insert it into the table,
 * add the specified number of lines to it (lines),
 * and detect its actual height through the delta
 * of the tops of the TR following it.
 */
export function getTableRowHeight(tr, lines = 0) {
  const initialTop = this._DOM.getElementOffsetTop(tr);
  const clone = this._DOM.cloneNode(tr);
  const text = '!<br />'.repeat(lines);
  [...clone.children].forEach(td => this._DOM.setInnerHTML(td, text));
  this._DOM.insertBefore(tr, clone);
  const endTop = this._DOM.getElementOffsetTop(tr);
  this._DOM.removeNode(clone);
  return endTop - initialTop;
}

/**
 * @this {Node}
 *
 * Create an empty row by cloning the TR, insert it into the table,
 * and detect its actual height through the delta
 * of the tops of the TR following it.
 */
// TODO: not used?
export function getTableEmptyRowHeight(tr) {
  const initialTop = this._DOM.getElementOffsetTop(tr);
  const clone = this._DOM.cloneNodeWrapper(tr);
  this._DOM.insertBefore(tr, clone);
  const endTop = this._DOM.getElementOffsetTop(tr);
  this._DOM.removeNode(clone);
  return endTop - initialTop;
}

/**
 * @this {Node}
 *
 * Measures the visual height of a cloned <tr>
 * when one original <td> (without content) is inserted at a time,
 * while all other <td> elements are replaced with minimal placeholders
 * that aim to minimize their impact on row height.
 *
 * This is used to estimate the structural contribution of each TD
 * (its padding, borders, alignment, etc.)
 * to the overall height of the table row, independent of its content.
 *
 * Returns: number[] — an array of heights, where each value represents
 * the height of the <tr> when the corresponding TD is present
 * (in its original DOM position), and the others are minimized.
 */
export function getTableRowShellHeightByTD(tr) {
  const initialTop = this._DOM.getElementOffsetTop(tr);
  const trClone = this._DOM.cloneNodeWrapper(tr);
  const tdCount = tr.children.length;
  const originalTDs = [...tr.children];

  this._DOM.insertBefore(tr, trClone);

  const trByTdHeights = [];

  for (let i = 0; i < tdCount; i++) {
    const tdPlaceholders = [];

    for (let j = 0; j < tdCount; j++) {
      let td;
      if (j === i) {
        td = this._DOM.cloneNodeWrapper(originalTDs[j]);
        this._DOM.setInnerHTML(td, '');
      } else {
        td = document.createElement('td');
        this._DOM.setInnerHTML(td, '');
        this._DOM.setStyles(td, {
          padding: '0',
          border: 'none',
          verticalAlign: 'top',
          lineHeight: '0',
          minHeight: '0',
          fontSize: '0',
        });
      }
      tdPlaceholders.push(td);
    }

    this._DOM.insertAtEnd(trClone, ...tdPlaceholders);

    const topAfterInsert = this._DOM.getElementOffsetTop(tr);
    const height = topAfterInsert - initialTop;
    trByTdHeights.push(height);

    tdPlaceholders.forEach(td => this._DOM.removeNode(td));
  }

  this._DOM.removeNode(trClone);
  return trByTdHeights;
}

/**
 * @this {Node}
 */
export function getTableEntries(node) {
  if (!(node instanceof HTMLElement) || node.tagName !== 'TABLE') {
    throw new Error('Expected a <table> element.');
  }

  const nodeEntries = [...node.children].reduce((acc, curr) => {
    const tag = curr.tagName;

    if (tag === 'TBODY') {
      return { ...acc, rows: [...acc.rows, ...curr.children] };
    }

    if (tag === 'CAPTION') {
      this.setFlagNoBreak(curr);
      return { ...acc, caption: curr };
    }

    if (tag === 'COLGROUP') {
      this.setFlagNoBreak(curr);
      return { ...acc, colgroup: curr };
    }

    if (tag === 'THEAD') {
      this.setFlagNoBreak(curr);
      return { ...acc, thead: curr };
    }

    if (tag === 'TFOOT') {
      this.setFlagNoBreak(curr);
      return { ...acc, tfoot: curr };
    }

    if (tag === 'TR') {
      return { ...acc, rows: [...acc.rows, ...curr] };
    }

    _isDebug(this) && curr && console.warn('unexpected:', curr);

    return {
      ...acc,
      unexpected: [
        ...acc.unexpected,
        // FIXME: `curr` is a DOM element (non-iterable); spreading will throw.
        // Replace with `[curr]` in a dedicated fix commit.
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
    _isDebug(this) && console.warn(`something unexpected is found in the table ${node}`);
  }

  return nodeEntries;
}

/**
 * @this {Node}
 *
 * Measure effective Node content height via a temporary neutral probe appended to the Node.
 * The probe's normalized top (relative to Node padding issues) equals the content height because
 * it's placed after all flow content. The probe is removed immediately.
 */
export function getContentHeightByProbe(container, containerComputedStyle) {
  const containerStyle = containerComputedStyle ? containerComputedStyle : this._DOM.getComputedStyle(container);
  const probe = this.createNeutralBlock();
  this._DOM.setStyles(probe, {
    display: 'block',
    padding: '0',
    margin: '0',
    border: '0',
    height: '0',
    clear: 'both',
    visibility: 'hidden',
    contain: 'layout',
  });
  this._DOM.insertAtEnd(container, probe);
  const h = this.getNormalizedTop(probe, container, containerStyle);
  this._DOM.removeNode(probe);
  return h;
}
