// Flag storage with WeakMap base and optional Symbol/attribute mirrors.
// Attributes are written only when markupDebugMode is enabled or forceAttribute is true.

const DEFAULT_VALUE = true;

export default class FlagStore {
  constructor({
    debugMode = false,
    markupDebugMode = false,
    setAttribute,
    removeAttribute,
  } = {}) {
    this._debugMode = Boolean(debugMode);
    this._markupDebugMode = Boolean(markupDebugMode);
    this._setAttribute = setAttribute;
    this._removeAttribute = removeAttribute;
    this._flags = new WeakMap();
    this._symbols = new Map();
  }

  set(element, key, value = DEFAULT_VALUE, options = {}) {
    if (!element || !key) return;
    const entry = this._getEntry(element);
    entry.set(key, value);

    if (this._debugMode) {
      element[this._getSymbol(key)] = value;
    }

    this._applyAttribute(element, value, options);
  }

  get(element, key) {
    const entry = this._flags.get(element);
    return entry ? entry.get(key) : undefined;
  }

  has(element, key) {
    const entry = this._flags.get(element);
    return Boolean(entry && entry.has(key));
  }

  clear(element, key, options = {}) {
    if (!element || !key) return;
    const entry = this._flags.get(element);
    if (entry) {
      entry.delete(key);
      if (entry.size === 0) this._flags.delete(element);
    }

    if (this._debugMode) {
      const symbol = this._symbols.get(key);
      if (symbol) delete element[symbol];
    }

    this._removeAttributeMarker(element, options);
  }

  _getEntry(element) {
    let entry = this._flags.get(element);
    if (!entry) {
      entry = new Map();
      this._flags.set(element, entry);
    }
    return entry;
  }

  _getSymbol(key) {
    if (!this._symbols.has(key)) {
      this._symbols.set(key, Symbol(String(key)));
    }
    return this._symbols.get(key);
  }

  _applyAttribute(element, value, options = {}) {
    const {
      attributeSelector,
      attributeValue,
      forceAttribute = false,
    } = options;
    const shouldSet = forceAttribute || this._markupDebugMode;
    if (!shouldSet || !this._setAttribute || !attributeSelector) return;
    const nextValue = typeof attributeValue === 'function'
      ? attributeValue(value)
      : (attributeValue !== undefined ? attributeValue : value);
    this._setAttribute(element, attributeSelector, nextValue);
  }

  _removeAttributeMarker(element, options = {}) {
    const { attributeSelector, forceAttribute = false } = options;
    const shouldRemove = forceAttribute || this._markupDebugMode;
    if (!shouldRemove || !this._removeAttribute || !attributeSelector) return;
    this._removeAttribute(element, attributeSelector);
  }
}
