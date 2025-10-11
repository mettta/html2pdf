// ✅ selectors

import { debugFor } from '../utils/debugFor.js';
const _isDebug = debugFor('selectors');

/**
 * @this {Node}
 */
export function isSelectorMatching(element, selector) {
  if (!element || !selector) {
    _isDebug(this) && console.warn('isSelectorMatching() must have 2 params',
      '\n element: ', element,
      '\n selector: ', selector);
    return;
  }

  const first = selector.charAt(0);

  if (first === '.') {
    const cl = selector.substring(1);
    return this._DOM.hasClass(element, cl);

  } else if (first === '#') {
    const id = selector.substring(1);
    return this._DOM.hasID(element, id);

  } else if (first === '[') {
    this.strictAssert(
      selector.at(-1) === ']', `the ${selector} selector is not OK.`
    );
    const attr = selector.substring(1, selector.length - 1);
    return this._DOM.hasAttribute(element, attr);

  } else {
    // Strictly speaking, the tag name is not a selector,
    // but to be on the safe side, let's check that too:
    return this._DOM.getElementTagName(element) === selector.toUpperCase();
  }
}

// CHECK NODE TYPE

/**
 * @this {Node}
 */
export function isSignificantTextNode(element) {
  if (this._DOM.isTextNode(element)) {
    return (this._DOM.getNodeValue(element).trim().length > 0) ? true : false;
  }
  return false;
}

/**
 * @this {Node}
 */
export function isSTYLE(element) {
  return this._DOM.getElementTagName(element) === 'STYLE'
}

/**
 * @this {Node}
 */
export function isIMG(element) {
  return this._DOM.getElementTagName(element) === 'IMG'
}

/**
 * @this {Node}
 */
export function isSVG(element) {
  return this._DOM.getElementTagName(element) === 'svg'
}

/**
 * @this {Node}
 */
export function isOBJECT(element) {
  return this._DOM.getElementTagName(element) === 'OBJECT'
}

/**
 * @this {Node}
 */
export function isLiNode(element) {
  return this._DOM.getElementTagName(element) === 'LI';
}

// CHECK SERVICE ELEMENTS

/**
 * @this {Node}
 */
export function isNeutral(element) {
  return this.isSelectorMatching(element, this._selector.neutral);
}

/**
 * @this {Node}
 */
export function isWrappedTextNode(element) {
  return this.isSelectorMatching(element, this._selector.textNode)
}

/**
 * @this {Node}
 */
export function isWrappedTextLine(element) {
  return this.isSelectorMatching(element, this._selector.textLine)
}

/**
 * @this {Node}
 */
export function isWrappedTextGroup(element) {
  return this.isSelectorMatching(element, this._selector.textGroup)
}

/**
 * @this {Node}
 */
export function isPageStartElement(element) {
  return this.isSelectorMatching(element, this._selector.pageStartMarker)
}

/**
 * @this {Node}
 */
export function isContentFlowStart(element) {
  return this.isSelectorMatching(element, this._selector.contentFlowStart)
}

/**
 * @this {Node}
 */
export function isAfterContentFlowStart(element) {
  const elementBeforeInspected = this._DOM.getLeftNeighbor(element);
  return this.isSelectorMatching(elementBeforeInspected, this._selector.contentFlowStart)
}

/**
 * @this {Node}
 */
export function isContentFlowEnd(element) {
  return this.isSelectorMatching(element, this._selector.contentFlowEnd)
}

/**
 * @this {Node}
 */
export function isComplexTextBlock(element) {
  return this.isSelectorMatching(element, this._selector.complexTextBlock)
}

/**
 * @this {Node}
 */
export function isSyntheticTextWrapper(element) {
  return this.isComplexTextBlock(element)
         || this.isWrappedTextNode(element)
         || this.isWrappedTextLine(element)
         || this.isWrappedTextGroup(element);
}

/**
 * @this {Node}
 */
export function isNoBreak(element, _style) {
  return this.isSelectorMatching(element, this._selector.flagNoBreak)
    || this.isWrappedTextLine(element)
    || this.isWrappedTextGroup(element)
    || this.isInlineBlock(element, _style)
    || this.notSolved(element);
  // TODO
}

/**
 * @this {Node}
 */
export function isNoHanging(element) {
  return this.isSelectorMatching(element, this._selector.flagNoHanging)
}

/**
 * @this {Node}
 */
export function isSlice(element) {
  return this.isSelectorMatching(element, this._selector.flagSlice)
}

/**
 * @this {Node}
 */
export function isForcedPageBreak(element) {
  return this.isSelectorMatching(element, this._selector.printForcedPageBreak)
}

/**
 * @this {Node}
 */
export function isInline(element, style) {
  if (!(element instanceof HTMLElement)) {
    return
  }
  const computedStyle = style || this._DOM.getComputedStyle(element);
  const display = computedStyle.display;
  const res = display === "inline"
    || display === "inline-block"
    || display === "inline-table"
    || display === "inline-flex"
    || display === "inline-grid";
  return res;
}

/**
 * @this {Node}
 */
export function isInlineBlock(element, style) {
  if (!(element instanceof HTMLElement)) {
    return
  }
  const computedStyle = style || this._DOM.getComputedStyle(element);
  const display = computedStyle.display;
  const res = display === "inline-block"
    || display === "inline-table"
    || display === "inline-flex"
    || display === "inline-grid";
  return res;
}

/**
 * @this {Node}
 */
export function isGrid(element, style) {
  if (!(element instanceof HTMLElement)) {
    return
  }
  const computedStyle = style || this._DOM.getComputedStyle(element);
  const display = computedStyle.display;
  const res = display === "grid";
  return res;
}

/**
 * @this {Node}
 */
export function isTableLikeNode(element, style) {
  if (!(element instanceof HTMLElement)) {
    return
  }
  const computedStyle = style || this._DOM.getComputedStyle(element);
  return this._DOM.getElementTagName(element) !== 'TABLE'
    && [
      'table'
    ].includes(computedStyle.display);
}

/**
 * @this {Node}
 */
export function isTableNode(element, style) {
  if (!(element instanceof HTMLElement)) {
    return
  }
  const computedStyle = style || this._DOM.getComputedStyle(element);
  //*** STRICTDOC specific
  //*** add scroll for wide tables */
  //* issue#1370 https://css-tricks.com/preventing-a-grid-blowout/ */
  // so table can has 'block' and 'nowrap'.
  return this._DOM.getElementTagName(element) === 'TABLE'
    || // ! &&
    ['table'].includes(computedStyle.display);
}

/**
 * @this {Node}
 */
export function isPRE(element, style) {
  if (!(element instanceof HTMLElement)) {
    return
  }
  const computedStyle = style || this._DOM.getComputedStyle(element);
  // this._DOM.getElementTagName(element) === 'PRE'
  return [
    'block'
  ].includes(computedStyle.display)
    && [
      'pre',
      'pre-wrap',
      'pre-line',
      'break-spaces',
      'nowrap'
    ].includes(computedStyle.whiteSpace);
}

/**
 * @this {Node}
 */
export function isGridAutoFlowRow(element, style) {
  if (!(element instanceof HTMLElement)) {
    return
  }
  const computedStyle = style || this._DOM.getComputedStyle(element);
  const display = computedStyle.display;
  const gridAutoFlow = computedStyle.gridAutoFlow;
  const res1 = (display === "grid") || (display === "inline-grid");
  const res2 = gridAutoFlow === "row";
  return res1 && res2;
}

/**
 * @this {Node}
 */
export function isFlexRow(element, style) {
  if (!(element instanceof HTMLElement)) {
    return
  }
  const computedStyle = style || this._DOM.getComputedStyle(element);
  const display = computedStyle.display;
  if (display !== 'flex' && display !== 'inline-flex') {
    return false;
  }
  const direction = computedStyle.flexDirection || '';
  return direction.startsWith('row');
}

/**
 * @this {Node}
 */
export function isFullySPlitted(element, style) {
  const computedStyle = style || this._DOM.getComputedStyle(element);
  return (
    this.isPRE(element, computedStyle) ||
    this.isTableNode(element, computedStyle) ||
    this.isTableLikeNode(element, computedStyle) ||
    this.isGridAutoFlowRow(element, computedStyle) // todo
  );
}

/**
 * @this {Node}
 */
export function isSlough(element) {
  return this._DOM.hasAttribute(element, 'slough-node');
}
