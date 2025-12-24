/**
 * @this {Node}
 */
export function isPageStartElement(element) {
  return this.hasFlag(element, 'pageStart');
}

/**
 * @this {Node}
 */
export function isNoBreak(element, _style) {
  return this.hasFlag(element, 'noBreak')
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
  return this.hasFlag(element, 'noHanging');
}

/**
 * @this {Node}
 */
export function isSlice(element) {
  return this.hasFlag(element, 'slice');
}
