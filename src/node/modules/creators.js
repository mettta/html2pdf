// 🪄 creators

import { debugFor } from '../utils/debugFor.js';
const _isDebug = debugFor('creators');

/**
 * @this {Node}
 */
export function create(selector, textContent) {
  let element;

  if (!selector) {
    element = this._DOM.createElement('div');
  } else {
    const first = selector.charAt(0);

    if (first.match(/[#\[\.]/)) {
      element = this._DOM.createElement('div');
      this._DOM.setAttribute(element, selector);
    } else if (first.match(/[a-zA-Z]/)) {
      element = this._DOM.createElement(selector);
    } else {
      this._assert && console.assert(false, `Expected valid html selector ot tag name, but received:`, selector)
      return
    }
  }

  if (textContent) {
    this._DOM.setInnerHTML(element, textContent);
  }

  return element;
}

/**
 * @this {Node}
 */
export function createNeutral() {
  return this.create(this._selector.neutral)
}

/**
 * @this {Node}
 */
export function createNeutralBlock() {
  // It is important that this element does not unexpectedly inherit parameters
  // that affect its height and has a block model.
  const element = this.createNeutral();
  element.style.display = 'block';
  return element
}

/**
 * @this {Node}
 */
export function createTextNodeWrapper() {
  return this.create(this._selector.textNode)
}

/**
 * @this {Node}
 */
export function createTextLine() {
  return this.create(this._selector.textLine)
}

/**
 * @this {Node}
 */
export function createTextGroup() {
  return this.create(this._selector.textGroup)
}

/**
 * @this {Node}
 */
export function createWithFlagNoBreak(style) {
  const element = this.create(this._selector.flagNoBreak);
  style && this._DOM.setStyles(element, style);
  return element;
}

/**
 * @this {Node}
 */
export function createPrintPageBreak() {
  return this.create(this._selector.printPageBreak);
}

/**
 * @this {Node}
 */
export function createComplexTextBlock() {
  const textBlock = this.create(this._selector.complexTextBlock);
  return textBlock;
}

/**
 * @this {Node}
 */
export function createTestNodeFrom(node) {
  const testNode = this._DOM.cloneNodeWrapper(node);
  this._DOM.setAttribute(testNode, '.test-node');
  this._DOM.setStyles(testNode, {
    position: 'absolute',
    background: 'rgb(255 239 177)',
    width: this.getMaxWidth(node) + 'px',
    // left: '-10000px',
  });
  return testNode;
}

/**
 * @this {Node}
 */
export function createWord(text, index) {
  const word = this.create(this._selector.word);
  this._DOM.setInnerHTML(word, text);
  word.dataset.index = index;
  return word;
}

/**
 * @this {Node}
 */
export function createForcedPageBreak() {
  return this.create(this._selector.printForcedPageBreak);
}

/**
 * @this {Node}
 */
export function createSignpost(text, height) {
  // TODO: rename to createSplitLabel
  // TODO: move styles to params as optional
  if (!height) return null;
  const prefix = this.create();
  this._DOM.setStyles(prefix, {
    display: 'flex',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: '8px',
    fontFamily: 'sans-serif',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    height: height + 'px',
  });
  text && this._DOM.setInnerHTML(prefix, text);
  return prefix
}

/**
 * @this {Node}
 */
export function createTable({
  wrapper,
  caption,
  colgroup,
  thead,
  tfoot,
  tbody,
}) {
  const table = wrapper ? wrapper : this.create('table');
  const tableBody = this.create('TBODY');
  caption && this._DOM.insertAtEnd(table, caption);
  colgroup && this._DOM.insertAtEnd(table, colgroup);
  thead && this._DOM.insertAtEnd(table, thead);
  tbody && this._DOM.insertAtEnd(tableBody, ...tbody);
  this._DOM.insertAtEnd(table, tableBody);
  tfoot && this._DOM.insertAtEnd(table, tfoot);
  return table;
}
