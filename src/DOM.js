export default class DocumentObjectModel {

  constructor({DOM, config}) {

    // * public
    this.document = DOM;
    this.body = DOM.body;

    // * private
    this._debugMode = config.debugMode;
    this._debug = config.debugMode ? { ...config.debugConfig.DOM } : {};
    this._assert = config.consoleAssert ? true : false;
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

  moveContent(source, target) {
    while (source.firstChild) {
      target.append(source.firstChild);
    }
    this._assert && console.assert(this.getInnerHTML(source) === "");
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
    this._assert && console.assert(selectors);
    if (typeof selectors === 'string') {
      selectors = selectors.split(',').filter(Boolean);
    }
    this._assert && console.assert(Array.isArray(selectors), 'Selectors must be provided as an array or string (one selector or multiple selectors, separated by commas). Now the selectors are:', selectors);
    this._assert && console.assert(selectors.length > 0, 'getAll(selectors), selectors:', selectors);

    if (selectors.length === 1) {
      return [...this.getAllElements(selectors[0], target)]
    } else {
      return [...selectors].flatMap(
        selector => [...this.getAllElements(selector, target)]
      )
    }
  }


  getElement(selector, target = this.document) {
    this._assert && console.assert(selector);
    return target.querySelector(selector);
  }

  getAllElements(selector, target = this.document) {
    this._assert && console.assert(selector);
    return target.querySelectorAll(selector);
  }

  getElementById(id, target = this.document) {
    return target.getElementById(id);
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

  getNodeValue(element) {
    return element.nodeValue;
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
      this._debug._ && console.log(`you're really sure ${selector} is attribute selector?`)
    }

    if (first === '[') {
      this._assert && console.assert(
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
      this._assert && console.assert(
        selector.at(-1) === ']', `the ${selector} selector is not OK.`
      );
      const attr = selector.substring(1, selector.length - 1);
      element.setAttribute(attr, (value ? value : ''));
      return
    }
    this._debug._ && console.log(`you're really sure ${selector} is a selector?`)
  }

  setStyles(element, styles) {
    // styles is object
    Object.entries(styles)
      .forEach(([key, value]) =>
        element.style[key] = value);
  }

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
    this._assert && console.assert(first.match(/[a-zA-Z#\[\.]/), `removeAttribute() expects a valid selector, but received ${selector}`)

    if (first === '.') {
      const cl = selector.substring(1);
      element.classList.remove(cl);
      return
    } else if (first === '#') {
      const id = selector.substring(1);
      element.removeAttribute(id);
      return
    } else if (first === '[') {
      this._assert && console.assert(
        selector.at(-1) === ']', `the ${selector} selector is not OK.`
      );
      const attr = selector.substring(1, selector.length - 1);
      element.removeAttribute(attr);
      return
    } else { // a-zA-Z
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
