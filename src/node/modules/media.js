// 🖼️ media helpers

import { debugFor } from '../utils/debugFor.js';
const _isDebug = debugFor('media');

const REPLACED_TAGS = new Set([
  'IMG',
  'SVG',
  'OBJECT',
  'EMBED',
  'IFRAME',
  'VIDEO',
  'AUDIO',
  'CANVAS'
]);

function _pickChild(node, prefer = 'self') {
  if (prefer === 'last') {
    return this._DOM.getLastElementChild(node);
  }
  // treat 'first' and default as the same fallback
  return this._DOM.getFirstElementChild(node);
}

/**
 * @this {Node}
 */
export function isReplacedElement(element) {
  if (!element) {
    return false;
  }

  const tag = this._DOM.getElementTagName(element);
  if (!tag) {
    return false;
  }

  if (tag === 'INPUT') {
    const type = (this._DOM.getAttribute(element, 'type') || '').toLowerCase();
    return type === 'image';
  }

  return REPLACED_TAGS.has(tag);
}

/**
 * Attempts to unwrap thin wrappers around a replaced element (IMG, SVG, etc.).
 * Returns the underlying replaced element or null if the chain branches or ends
 * without reaching one.
 *
 * @this {Node}
 */
export function resolveReplacedElement(element, { prefer = 'self' } = {}) {
  if (!element) {
    return null;
  }

  const visited = new Set();
  let current = element;

  while (current && !visited.has(current)) {
    visited.add(current);

    if (this.isReplacedElement(current)) {
      return current;
    }

    // Try to rely on resolveFlowBoxElement if available to unwrap display:contents.
    const flowCandidate = this.resolveFlowBoxElement(current, { prefer });
    if (flowCandidate && flowCandidate !== current) {
      if (this.isReplacedElement(flowCandidate)) {
        return flowCandidate;
      }
      current = flowCandidate;
      continue;
    }

    const elementChildren = [...this._DOM.getChildren(current)];
    const flowChildren = elementChildren.filter(child => {
      const display = this._DOM.getComputedStyle(child)?.display;
      return display !== 'none';
    });

    if (flowChildren.length !== 1) {
      _isDebug(this) && console.info('🧭 resolveReplacedElement: branching or empty wrapper', current, flowChildren);
      return null;
    }

    current = _pickChild.call(this, current, prefer) || flowChildren[0];
  }

  return null;
}
