// 🚩 markers

import { debugFor } from '../utils/debugFor.js';
const _isDebug = debugFor('markers');

/**
 * @this {Node}
 */
export function markProcessed(element, value) {
  this._markupDebugMode && this._DOM.setAttribute(element, this._selector.processed, '🏷️ ' + value)
}

/**
 * @this {Node}
 */
export function setFlagNoBreak(element) {
  this._DOM.setAttribute(element, this._selector.flagNoBreak)
}

/**
 * @this {Node}
 */
export function setFlagNoHanging(element, value) {
  this._DOM.setAttribute(element, this._selector.flagNoHanging, value)
}

/**
 * @this {Node}
 */
export function markPageStartElement(element, page) {
  this._DOM.setAttribute(element, this._selector.pageStartMarker, page)
}

/**
 * @this {Node}
 */
export function unmarkPageStartElement(element) {
  this._DOM.removeAttribute(element, this._selector.pageStartMarker);
}

/**
 * @this {Node}
 */
export function markPartNodesWithClass(nodes) {
  nodes.forEach(node => {
    this._DOM.setAttribute(node, this._selector.topCutPart);
    this._DOM.setAttribute(node, this._selector.bottomCutPart);
  });
  this._DOM.removeAttribute(nodes.at(0), this._selector.topCutPart);
  this._DOM.removeAttribute(nodes.at(-1), this._selector.bottomCutPart);
}
