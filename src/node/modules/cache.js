// 📦 cache helpers

/**
 * @this {Node}
 */
export function getBCRCached(element, key, getter) {
  return this._cache.measure.getBCR(element, key, getter);
}

/**
 * @this {Node}
 */
export function getComputedStyleCached(element, key, getter) {
  const fallback = getter || (() => this._DOM.getComputedStyle(element));
  return this._cache.measure.getStyle(element, key, fallback);
}

/**
 * @this {Node}
 */
export function resetMeasureCache() {
  this._cache.resetMeasureCache();
}
