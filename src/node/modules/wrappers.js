// 🫔 wrappers

/**
 * Check if debug mode is enabled for this module.
 * Usage: Call `_isDebug(this)` inside any function of this file.
 *
 * @param {Node} node - The Node instance, passed as `this`.
 * @returns {boolean} True if debug mode is enabled for this module.
 */
function _isDebug(node) {
    return node._config.debugMode && node._debug.wrappers;
}

/**
* @this {Node}
*/
// wrapNodeChildren(node) {
//   const children = this.getChildren(node);
//   const wrapper = this.create();
//   this._DOM.insertAtStart(wrapper, ...children);
//   this._DOM.insertAtStart(node, wrapper);
//   return wrapper
// }
