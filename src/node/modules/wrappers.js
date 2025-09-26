// 🫔 wrappers

import { debugFor } from '../utils/debugFor.js';
const _isDebug = debugFor('wrappers');

/**
* @this {Node}
*/
export function wrapNodeChildrenWithNeutralBlock(node) {
  const children = this._DOM.getChildren(node);
  const wrapper = this.createNeutralBlock();
  this._DOM.insertAtStart(wrapper, ...children);
  this._DOM.insertAtStart(node, wrapper);
  return wrapper
}
