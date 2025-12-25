// 📦 markers helpers

import { MARK_DEFS } from './defs.js';

/**
 * @this {Node}
 */
export function setMark(element, key, value, options = {}) {
  const markConfig = this._getMarkAttributeConfig?.(key);
  const forceAttribute = this._isStyleMark?.(key);
  const mergedOptions = {
    ...markConfig,
    ...(forceAttribute ? { forceAttribute: true } : {}),
    ...options,
  };
  this._marks.set(element, key, value, mergedOptions);
  this._registerMark?.(element, key, value);
}

/**
 * @this {Node}
 */
export function getMark(element, key) {
  return this._marks.get(element, key);
}

/**
 * @this {Node}
 */
export function hasMark(element, key) {
  return this._marks.has(element, key);
}

/**
 * @this {Node}
 */
export function clearMark(element, key, options) {
  const forceAttribute = this._isStyleMark?.(key);
  const mergedOptions = forceAttribute ? { ...options, forceAttribute: true } : options;
  this._marks.clear(element, key, mergedOptions);
  this._unregisterMark?.(element, key);
}

/**
 * @this {Node}
 */
// Internal registry helpers (used only via setMark/clearMark).
function registerPageStart(element, pageNum) {
  if (!element) return;
  this._markers.registry.pageStart.set(Number(pageNum), element);
}

/**
 * @this {Node}
 */
function unregisterPageStart(element) {
  if (!element) return;
  for (const [page, el] of this._markers.registry.pageStart.entries()) {
    if (el === element) {
      this._markers.registry.pageStart.delete(page);
      return;
    }
  }
}

/**
 * @this {Node}
 */
function registerPageEnd(element, pageNum) {
  if (!element) return;
  this._markers.registry.pageEnd.set(Number(pageNum), element);
}

/**
 * @this {Node}
 */
export function registerPageDivider(element, pageNum) {
  if (!element) return;
  this._markers.registry.pageDividerByPage.set(Number(pageNum), element);
}

/**
 * @this {Node}
 */
export function getRegisteredPageDividers() {
  return this._markers.registry.pageDividerByPage;
}

/**
 * @this {Node}
 */
function registerPageNumber(element, pageNum) {
  if (!element) return;
  const page = Number(pageNum);
  let bucket = this._markers.registry.pageNumberByPage.get(page);
  if (!bucket) {
    bucket = new Set();
    this._markers.registry.pageNumberByPage.set(page, bucket);
  }
  bucket.add(element);
  this._markers.registry.pageNumberByElement.set(element, page);
}

/**
 * @this {Node}
 */
export function getRegisteredPageNumbers() {
  return this._markers.registry.pageNumberByPage;
}

/**
 * @this {Node}
 */
export function getRegisteredPageNumberForElement(element) {
  if (!element) return undefined;
  return this._markers.registry.pageNumberByElement.get(element);
}

/**
 * @this {Node}
 */
export function _registerMark(element, key, value) {
  if (!element) return;
  const def = MARK_DEFS[key];
  if (!def || !def.registry) return;
  switch (def.registry) {
    case 'pageStart':
      registerPageStart.call(this, element, value);
      break;
    case 'pageEnd':
      registerPageEnd.call(this, element, value);
      break;
    case 'pageNumber':
      registerPageNumber.call(this, element, value);
      break;
    default:
      break;
  }
}

/**
 * @this {Node}
 */
export function _unregisterMark(element, key) {
  if (!element) return;
  const def = MARK_DEFS[key];
  if (!def || !def.registry) return;
  switch (def.registry) {
    case 'pageStart':
      unregisterPageStart.call(this, element);
      break;
    case 'pageEnd':
      // Use explicit removal by identity.
      for (const [page, el] of this._markers.registry.pageEnd.entries()) {
        if (el === element) {
          this._markers.registry.pageEnd.delete(page);
          break;
        }
      }
      break;
    case 'pageNumber':
      {
        const page = this._markers.registry.pageNumberByElement.get(element);
        if (page !== undefined) {
          const bucket = this._markers.registry.pageNumberByPage.get(page);
          if (bucket) {
            bucket.delete(element);
            if (bucket.size === 0) this._markers.registry.pageNumberByPage.delete(page);
          }
          this._markers.registry.pageNumberByElement.delete(element);
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
  return this._markers.registry.pageEnd;
}
/**
 * @this {Node}
 */
export function _getMarkAttributeConfig(key) {
  const def = MARK_DEFS[key];
  if (!def || !def.selectorKey) return undefined;
  const attributeSelector = this._selector[def.selectorKey];
  if (!attributeSelector) return undefined;
  return {
    attributeSelector,
    attributeValue: def.attributeValue,
  };
}

/**
 * @this {Node}
 */
export function _isStyleMark(key) {
  return MARK_DEFS[key]?.kind === 'style';
}
