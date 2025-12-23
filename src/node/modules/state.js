// 📦 state helpers

/**
 * @this {Node}
 */
export function setFlag(element, key, value, options = {}) {
  const flagConfig = this._getFlagAttributeConfig?.(key);
  const mergedOptions = {
    ...flagConfig,
    ...options,
  };
  this._flags.set(element, key, value, mergedOptions);
}

/**
 * @this {Node}
 */
export function getFlag(element, key) {
  return this._flags.get(element, key);
}

/**
 * @this {Node}
 */
export function hasFlag(element, key) {
  return this._flags.has(element, key);
}

/**
 * @this {Node}
 */
export function clearFlag(element, key, options) {
  this._flags.clear(element, key, options);
}

/**
 * @this {Node}
 */
export function getBCRCached(element, key, getter) {
  return this._state.measure.getBCR(element, key, getter);
}

/**
 * @this {Node}
 */
export function getComputedStyleCached(element, key, getter) {
  const fallback = getter || (() => this._DOM.getComputedStyle(element));
  return this._state.measure.getStyle(element, key, fallback);
}

/**
 * @this {Node}
 */
export function resetMeasureCache() {
  this._state.resetMeasureCache();
}

/**
 * @this {Node}
 */
export function _getFlagAttributeConfig(key) {
  switch (key) {
    case 'processed':
      return {
        attributeSelector: this._selector.processed,
        attributeValue: (value) => '🏷️ ' + value,
      };
    case 'noBreak':
      return { attributeSelector: this._selector.flagNoBreak };
    case 'noHanging':
      return { attributeSelector: this._selector.flagNoHanging };
    case 'slice':
      return { attributeSelector: this._selector.flagSlice };
    case 'pageStart':
      return { attributeSelector: this._selector.pageStartMarker };
    case 'pageEnd':
      return { attributeSelector: this._selector.pageEndMarker };
    case 'pageNumber':
      return { attributeSelector: this._selector.pageMarker };
    case 'cleanTopCut':
      return { attributeSelector: this._selector.cleanTopCut };
    case 'cleanBottomCut':
      return { attributeSelector: this._selector.cleanBottomCut };
    case 'topCut':
      return { attributeSelector: this._selector.topCutPart };
    case 'bottomCut':
      return { attributeSelector: this._selector.bottomCutPart };
    default:
      return undefined;
  }
}
