import * as Logging from './utils/logging.js';

export default class DocumentObjectModel {

  constructor({ DOM, config }) {

    // * public
    this.document = DOM;
    this.body = DOM.body;

    // * private
    this._debug = config.debugMode ? { ...config.debugConfig.DOM } : {};
    this._assert = config.consoleAssert ? true : false;
    Object.assign(this, Logging);
  }

  // CREATE ELEMENTS

  createElement(selector) {
    return this.document.createElement(selector);
  }

  createDocumentFragment() {
    return this.document.createDocumentFragment()
  }

  cloneNode(node) {
    return node?.cloneNode(true);
  }

  cloneNodeWrapper(node) {
    return node?.cloneNode(false);
  }

  // INSERT

  insertBefore(element, ...payload) {
    const cleanPayload = payload.filter(el => el != null);
    element.before(...cleanPayload);
  }

  insertAfter(element, ...payload) {
    const cleanPayload = payload.filter(el => el != null);
    element.after(...cleanPayload);
  }

  insertAtEnd(element, ...payload) {
    const cleanPayload = payload.filter(el => el != null);
    element.append(...cleanPayload);
  }

  insertAtStart(element, ...payload) {
    const cleanPayload = payload.filter(el => el != null);
    element.prepend(...cleanPayload);
  }

  insertInsteadOf(element, ...payload) {
    this.insertBefore(element, ...payload);
    element.remove();
  }

  wrap(element, wrapper) {
    element.before(wrapper);
    wrapper.append(element);
    return wrapper;
  }

  moveContent(source, target) {
    while (source.firstChild) {
      target.append(source.firstChild);
    }
    this.strictAssert(this.getInnerHTML(source) === "");
  }

  // Move content from one table row (TR) to another TR, TD-to-TD.
  // Assumes equal number of cells, but safely handles mismatches.
  moveRowContent(sourceTR, targetTR) {
    if (!sourceTR || !targetTR) {
      this._debug._ && console.warn('moveRowContent(): sourceTR or targetTR is missing');
      return;
    }

    // Validate tag names where possible
    const srcTag = this.getElementTagName(sourceTR);
    const tgtTag = this.getElementTagName(targetTR);
    this.strictAssert(srcTag === 'TR', `moveRowContent(): source is not TR, got ${srcTag}`);
    this.strictAssert(tgtTag === 'TR', `moveRowContent(): target is not TR, got ${tgtTag}`);

    const srcCells = [...this.getChildren(sourceTR)];
    const tgtCells = [...this.getChildren(targetTR)];

    if (srcCells.length !== tgtCells.length) {
      this._debug._ && console.warn(
        `moveRowContent(): cells count mismatch: ${srcCells.length} (source) vs ${tgtCells.length} (target)`
      );
    }

    const n = Math.min(srcCells.length, tgtCells.length);
    for (let i = 0; i < n; i++) {
      this.moveContent(srcCells[i], tgtCells[i]);
    }
  }

  replaceNodeContentsWith(element, ...payload) {
    this.setInnerHTML(element, '');
    this.insertAtEnd(element, ...payload)
  }

  // REMOVE

  removeNode(element) {
    element.remove();
  }

  // GET ELEMENT

  getAll(selectors, target = this.document) {
    this.strictAssert(selectors);
    if (typeof selectors === 'string') {
      selectors = selectors.split(',').filter(Boolean);
    }
    this.strictAssert(Array.isArray(selectors), 'Selectors must be provided as an array or string (one selector or multiple selectors, separated by commas). Now the selectors are:', selectors);
    this.strictAssert(selectors.length > 0, 'getAll(selectors), selectors:', selectors);

    if (selectors.length === 1) {
      return [...this.getAllElements(selectors[0], target)]
    } else {
      return [...selectors].flatMap(
        selector => [...this.getAllElements(selector, target)]
      )
    }
  }


  getElement(selector, target = this.document) {
    this.strictAssert(selector);
    return target.querySelector(selector);
  }

  getAllElements(selector, target = this.document) {
    this.strictAssert(selector);
    return target.querySelectorAll(selector);
  }

  getElementById(id, target = this.document) {
    return target.getElementById(id);
  }

  getNodeType(element) {
    return element.nodeType;
  }

  getRightNeighbor(item) {
    return item.nextElementSibling
  }

  getLeftNeighbor(item) {
    return item.previousElementSibling
  }

  getParentNode(element) {
    return element.parentElement;
  }

  getNodeValue(textNode) {
    // * nodeValue is null for elementNode
    return textNode.nodeValue;
  }

  getNodeWholeText(textNode) {
    // * wholeText includes this text node plus adjacent text siblings (nodeValue is just this node).
    return textNode.wholeText;
  }

  getLastElementChild(element) {
    return element.lastElementChild;
  }

  getFirstElementChild(element) {
    return element.firstElementChild;
  }

  getChildNodes(element) {
    // childNodes returns child nodes
    // (element nodes, text nodes, and comment nodes)
    return element.childNodes;
  }

  getChildren(element) {
    // children returns child elements
    // (not text and comment nodes)
    return element.children;
  }

  getElementOffsetParent(element) {
    return element.offsetParent
  }

  // GET ELEMENT PROPS

  getComputedStyle(element) {
    return window.getComputedStyle(element);
  }

  getElementBCR(element) {
    return element.getBoundingClientRect();
  }

  getElementOffsetLeft(element) {
    return element?.offsetLeft;
  }

  getElementOffsetHeight(element) {
    return element?.offsetHeight;
  }

  getElementOffsetWidth(element) {
    return element?.offsetWidth;
  }

  getElementOffsetTop(element) {
    return element?.offsetTop;
  }

  getElementOffsetBottom(element) {
    return element?.offsetTop + element?.offsetHeight || undefined;
  }

  getElementTagName(element) {
    return element.tagName;
  }

  getDataId(item) { // (pages)
    return item.dataset.id;
  }

  getAttribute(element, selector) {
    if (!element || !selector) {
      this._debug._ && console.warn('getAttribute() must have 2 params');
      return;
    }

    const first = selector.charAt(0);

    if (first === '.' || first === '#') {
      this.log('getAttribute', `you're really sure ${selector} is attribute selector?`)
    }

    if (first === '[') {
      this.strictAssert(
        selector.at(-1) === ']', `the ${selector} selector is not OK.`
      );
      const attr = selector.substring(1, selector.length - 1);
      return element.getAttribute(attr);
    }

    element.getAttribute(selector);
  }

  // SET ATTRIBUTES

  setAttribute(element, selector, value) {
    if (!element || !selector) {
      this._debug._ && console.warn('setAttribute() must have 2 params');
      return;
    }

    const first = selector.charAt(0);

    if (first === '.') {
      const cl = selector.substring(1);
      element.classList.add(cl);
      return
    } else if (first === '#') {
      const id = selector.substring(1);
      element.id = id;
      return
    } else if (first === '[') {
      this.strictAssert(
        selector.at(-1) === ']', `the ${selector} selector is not OK.`
      );
      const attr = selector.substring(1, selector.length - 1);
      element.setAttribute(attr, (value ? value : ''));
      return
    }
    this.log('setAttribute', `you're really sure ${selector} is a selector?`)
  }

  setStyles(element, styles) {
    // possibly styles:
    // {
    // transform: 'scale(0.998003992015968)',
    // transformOrigin: 'top center',
    // width: '500px',
    // 'min-width': '500px',
    // 'margin-bottom': ['0', 'important'],
    // }
    Object.entries(styles).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // ['0', 'important']
        this.setStyle(element, key, value[0], value[1] || '');
      } else {
        this.setStyle(element, key, value);
      }
    });
  }

  setStyle(element, key, value, priority = '') {
    const cssProp = this._toKebab(key);
    if (value == null || value === '') {
      element.style.removeProperty(cssProp);
    } else {
      element.style.setProperty(cssProp, String(value), priority);
    }
  }

  _toKebab = (key) => {
    if (key.includes('-')) return key;
    // webkitLineClamp -> -webkit-line-clamp
    const m = key.match(/^(webkit|moz|ms|o)(?=[A-Z])/);
    if (m) key = '-' + m[1] + '-' + key.slice(m[1].length);
    return key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
  };

  addClasses(element, ...cls) {
    element.classList.add(...cls);
  }

  // REMOVE ATTRIBUTES

  removeAttribute(element, selector) {
    if (!element || !selector) {
      this._debug._ && console.warn('removeAttribute() must have 2 params');
      return;
    }

    const first = selector.charAt(0);
    this.strictAssert(first.match(/[a-zA-Z#\[\.]/), `removeAttribute() expects a valid selector, but received ${selector}`)

    if (first === '.') {
      const cl = selector.substring(1);
      element.classList.remove(cl);
      return
    } else if (first === '#') {
      const id = selector.substring(1);
      element.removeAttribute(id);
      return
    } else if (first === '[') {
      this.strictAssert(
        selector.at(-1) === ']', `the ${selector} selector is not OK.`
      );
      const attr = selector.substring(1, selector.length - 1);
      element.removeAttribute(attr);
      return
    } else { // a-zA-Z
      // FIXME: invalid attribute variable. `attr` is undefined here and will throw.
      // Leave as-is for now; proper fix is to remove this branch or pass a real attribute name.
      element.removeAttribute(attr);
    }
  }

  removeAllAttributes(element) {
    while (element.attributes.length > 0) {
      element.removeAttribute(element.attributes[0].name);
    }
  }

  removeClasses(element, ...cls) {
    element.classList.remove(...cls);
  }

  removeAllClasses(element) {
    element.classList = '';
  }

  removeAllStyles(element) {
    element.style = '';
  }

  // GET/SET ELEMENT CONTENT

  getInnerHTML(selector) {

    if (typeof selector === 'string') {
      const source = this.document.querySelector(selector);
      if (source) {
        return source.innerHTML;
      }
      return;
    }
    return selector.innerHTML;
  }

  setInnerHTML(selector, html) {

    if (typeof selector === 'string') {
      const source = this.document.querySelector(selector);
      if (source) {
        source.innerHTML = html;
      }
      // return;
    }
    selector.innerHTML = html;
  }

  // CHECK

  isDocumentBody(element) {
    return element.tagName === 'BODY';
  }

  isTextNode(element) {
    return element.nodeType === Node.TEXT_NODE;
  }

  isElementNode(element) {
    return element.nodeType === Node.ELEMENT_NODE;
  }

  hasClass(element, cl) {
    return element.classList.contains(cl);
  }

  hasID(element, id) {
    return element.id === id;
  }

  hasAttribute(element, attr) {
    return element.hasAttribute(attr);
  }

}
