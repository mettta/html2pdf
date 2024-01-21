import SELECTOR from './selector';

export default class DocumentObjectModel {

  constructor({DOM, debugMode}) {

    // * public
    this.body = DOM.body;
    this.document = DOM;

    // * private
    this._debugMode = debugMode;
    this._DOM = DOM;
    this._debugToggler = {
      _DOM: false,
    }
  }

  createDocumentFragment() {
    return this._DOM.createDocumentFragment()
  }

  getElement(selector, target = this._DOM) {
    return target.querySelector(selector);
  }

  getAllElements(selector, target = this._DOM) {
    return target.querySelectorAll(selector);
  }

  getElementById(id, target = this._DOM) {
    return target.getElementById(id);
  }

  removeNode(element) {
    element.remove();
  }

  cloneNode(node) {
    return node?.cloneNode(true);
  }

  cloneNodeWrapper(node) {
    return node?.cloneNode(false);
  }



  insertBefore(element, ...payload) {
    element.before(...payload)
  }

  insertAfter(element, ...payload) {
    element.after(...payload)
  }

  insertAtEnd(element, ...payload) {
    element.append(...payload);
  }

  insertAtStart(element, ...payload) {
    element.prepend(...payload);
  }

  insertInsteadOf(element, ...payload) {
    element.before(...payload);
    element.remove();
  }

  getRightNeighbor(item) {
    return item.nextElementSibling
  }
  getLeftNeighbor(item) {
    return item.previousElementSibling
  }

  getElementOffsetParent(element) {
    return element.offsetParent
  }

  getDataId(item) { // (pages)
    return item.dataset.id;
  }

  getAttribute(element, selector) {
    if (!element || !selector) {
      this._debugMode && this._debugToggler._DOM && console.warn('setAttribute() must have 2 params');
      return;
    }

    const first = selector.charAt(0);

    if (first === '.' || first === '#') {
      this._debugMode && this._debugToggler._DOM && console.log(`you're really sure ${selector} is attribute selector?`)
    }

    if (first === '[') {
      this._debugMode && this._debugToggler._DOM && console.assert(
        selector.at(-1) === ']', `the ${selector} selector is not OK.`
      );
      const attr = selector.substring(1, selector.length - 1);
      return element.getAttribute(attr);
    }

    element.getAttribute(selector);
  }

  setAttribute(element, selector, value) {
    if (!element || !selector) {
      this._debugMode && this._debugToggler._DOM && console.warn('setAttribute() must have 2 params');
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
      this._debugMode && this._debugToggler._DOM && console.assert(
        selector.at(-1) === ']', `the ${selector} selector is not OK.`
      );
      const attr = selector.substring(1, selector.length - 1);
      element.setAttribute(attr, (value ? value : ''));
      return
    }
    this._debugMode && this._debugToggler._DOM && console.log(`you're really sure ${selector} is a selector?`)
  }

  removeAttribute(element, selector) {
    element.removeAttribute(selector);
  }

  removeAllAttributes(element) {
    while (element.attributes.length > 0) {
      element.removeAttribute(element.attributes[0].name);
    }
  }

  removeAllClasses(element) {
    element.classList = '';
  }

  removeAllStyles(element) {
    element.style = '';
  }

  getComputedStyle(element) {
    return window.getComputedStyle(element);
  }

  // CHECK

  getElementTagName(element) {
    return element.tagName;
  }

  isDocumentBody(element) {
    return element.tagName === 'BODY';
  }

  isTextNode(element) {
    return element.nodeType === Node.TEXT_NODE;
  }
  isElementNode(element) {
    return element.nodeType === Node.ELEMENT_NODE;
  }





  // helpers

  getParentNode(element) {
    return element.parentNode;
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

  getInnerHTML(selector) {

    if (typeof selector === 'string') {
      const source = this._DOM.querySelector(selector);
      if (source) {
        return source.innerHTML;
      }
      return;
    }
    return selector.innerHTML;
  }

  setInnerHTML(selector, html) {

    if (typeof selector === 'string') {
      const source = this._DOM.querySelector(selector);
      if (source) {
        source.innerHTML = html;
      }
      // return;
    }
    selector.innerHTML = html;
  }

  setStyles(element, styles) {
    // styles is object
    Object.entries(styles)
      .forEach(([key, value]) =>
        element.style[key] = value);
  }

  // CREATE ELEMENTS

  createElement(selector) {
    return this._DOM.createElement(selector);
  }









  // PAGES



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
    // BUG ?
    return element?.offsetTop + element?.offsetHeight || undefined;
  }

}
