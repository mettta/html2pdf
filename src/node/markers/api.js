// 📦 markers helpers

import { FLAG_DEFS } from './defs.js';

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
// Internal registry helpers (used only via setFlag/clearFlag).
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
export function _registerFlag(element, key, value) {
  if (!element) return;
  const def = FLAG_DEFS[key];
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
export function _unregisterFlag(element, key) {
  if (!element) return;
  const def = FLAG_DEFS[key];
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
export function _getFlagAttributeConfig(key) {
  const def = FLAG_DEFS[key];
  if (!def || !def.selectorKey) return undefined;
  const attributeSelector = this._selector[def.selectorKey];
  if (!attributeSelector) return undefined;
  return {
    attributeSelector,
    attributeValue: def.attributeValue,
  };
}
