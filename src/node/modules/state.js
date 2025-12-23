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
  this._registerFlag?.(element, key, value);
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
  this._unregisterFlag?.(element, key);
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
export function registerPageStart(element, pageNum) {
  if (!element) return;
  this._state.registry.pageStart.set(Number(pageNum), element);
}

/**
 * @this {Node}
 */
export function unregisterPageStart(element) {
  if (!element) return;
  for (const [page, el] of this._state.registry.pageStart.entries()) {
    if (el === element) {
      this._state.registry.pageStart.delete(page);
      return;
    }
  }
}

/**
 * @this {Node}
 */
export function registerPageEnd(element, pageNum) {
  if (!element) return;
  this._state.registry.pageEnd.set(Number(pageNum), element);
}

/**
 * @this {Node}
 */
export function registerPageNumber(element, pageNum) {
  if (!element) return;
  const page = Number(pageNum);
  let bucket = this._state.registry.pageNumberByPage.get(page);
  if (!bucket) {
    bucket = new Set();
    this._state.registry.pageNumberByPage.set(page, bucket);
  }
  bucket.add(element);
  this._state.registry.pageNumberByElement.set(element, page);
}

/**
 * @this {Node}
 */
export function getRegisteredPageNumbers() {
  return this._state.registry.pageNumberByPage;
}

/**
 * @this {Node}
 */
export function getRegisteredPageNumberForElement(element) {
  if (!element) return undefined;
  return this._state.registry.pageNumberByElement.get(element);
}

/**
 * @this {Node}
 */
export function _registerFlag(element, key, value) {
  if (!element) return;
  switch (key) {
    case 'pageStart':
      this.registerPageStart(element, value);
      break;
    case 'pageEnd':
      this.registerPageEnd(element, value);
      break;
    case 'pageNumber':
      this.registerPageNumber(element, value);
      break;
    default:
      break;
  }
}

/**
 * @this {Node}
 */
export function _unregisterFlag(element, key) {
  if (!element) return;
  switch (key) {
    case 'pageStart':
      this.unregisterPageStart(element);
      break;
    case 'pageEnd':
      // Use explicit removal by identity.
      for (const [page, el] of this._state.registry.pageEnd.entries()) {
        if (el === element) {
          this._state.registry.pageEnd.delete(page);
          break;
        }
      }
      break;
    case 'pageNumber':
      {
        const page = this._state.registry.pageNumberByElement.get(element);
        if (page !== undefined) {
          const bucket = this._state.registry.pageNumberByPage.get(page);
          if (bucket) {
            bucket.delete(element);
            if (bucket.size === 0) this._state.registry.pageNumberByPage.delete(page);
          }
          this._state.registry.pageNumberByElement.delete(element);
        }
      }
      break;
    default:
      break;
  }
}

/**
 * @this {Node}
 */
export function getRegisteredPageEnds() {
  return this._state.registry.pageEnd;
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
