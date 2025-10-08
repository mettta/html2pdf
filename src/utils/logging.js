const CONSOLE_CSS_END_LABEL = `background:#eee;color:#888;padding: 0 1px 0 0;`; //  font-size:smaller

/**
 * @this {Node}
 */
export function logGroup(string, style = "", collapsed = false) {
  if (typeof style === 'boolean') {
    collapsed = style;
    style = "";
  }

  if (collapsed === true) {
    this._debug._ && console.groupCollapsed(`%c${string}`, style,);
  } else {
    this._debug._ && console.group(`%c${string}`, style,);
  }
}

/**
 * @this {Node}
 */
export function logGroupEnd(string) {
  this._debug._ && console.log(`%c ▲ ${string} `, CONSOLE_CSS_END_LABEL);
  this._debug._ && console.groupEnd();
}

/**
 * @this {Node}
 * 🚨 🛑 ⛔ 🚫 ⚠️
 */
export function strictAssert(cond, ...param) {
  this._assert && console.assert(cond, '⛔', ...param);
}
