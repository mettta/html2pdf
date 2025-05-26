// WRAP

/**
 * @this {Node}
 */
export function wrapNode(node, wrapper) {
  this._DOM.insertBefore(node, wrapper);
  this._DOM.insertAtEnd(wrapper, node);
}

/**
 * @this {Node}
 */
export function wrapTextNode(element) {
  if (!this.isSignificantTextNode(element)) {
    return
  }
  const wrapper = this.create(this._selector.textNode);
  this._DOM.insertBefore(element, wrapper);
  this._DOM.insertAtEnd(wrapper, element);
  return wrapper;
}

// wrapNodeChildren(node) {
//   const children = this.getChildren(node);
//   const wrapper = this.create();
//   this._DOM.insertAtStart(wrapper, ...children);
//   this._DOM.insertAtStart(node, wrapper);
//   return wrapper
// }
