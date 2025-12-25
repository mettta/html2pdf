/**
 * @this {Node}
 */
export function isPageStart(element) {
  return this.hasMark(element, 'pageStart');
}

/**
 * @this {Node}
 */
export function isNoBreak(element) {
  return this.hasMark(element, 'noBreak');
}

/**
 * @this {Node}
 */
export function isNoHanging(element) {
  return this.hasMark(element, 'noHanging');
}

/**
 * @this {Node}
 */
export function isSlice(element) {
  return this.hasMark(element, 'slice');
} // todo: check after migrate to all-split strategy
