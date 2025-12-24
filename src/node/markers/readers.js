/**
 * @this {Node}
 */
export function isPageStartElement(element) {
  return this.hasFlag(element, 'pageStart');
}

/**
 * @this {Node}
 */
export function isNoBreak(element) {
  return this.hasFlag(element, 'noBreak');
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
