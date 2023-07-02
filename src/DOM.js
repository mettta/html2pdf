import SELECTOR from './selector';

export default class DocumentObjectModel {

  constructor(DOM) {
    this.DOM = DOM;
    this.body = DOM.body;
  }

  // STYLES

  insertStyle(printStyles) {
    const head = this.DOM.querySelector('head');
    const style = this.DOM.createElement('style');
    style.append(this.DOM.createTextNode(printStyles));
    style.setAttribute("data-printthis-inserted", '');
    head.append(style);
  }

  createDocumentFragment() {
    return this.DOM.createDocumentFragment()
  }

  // -

  getElement(selector, target = this.DOM) {
    return target.querySelector(selector);
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

  // ATTRIBUTES / dataset

  setAttribute(element, selector) {
    if (!element || !selector) {
      console.warn('setAttribute() must have 2 params');
      return;
    }

    const first = selector.charAt(0);

    if (first === '.') {
      const cl = selector.substring(1);
      element.classList.add(cl);

    }
    if (first === '#') {
      const id = selector.substring(1);
      element.id = id;

    }
    if (first === '[') {
      const attr = selector.substring(1, selector.length - 1);
      element.setAttribute(attr, '');

    }

  }

  setPrintNoBreak(element) {
    // element.dataset.printIgnore = '';
    this.setAttribute(element, SELECTOR.printNoBreak)
  }

  wrapTextNode(element) {
    if (!this.isSignificantTextNode(element)) {
      return
    }
    const wrapper = this.createNeutral();
    element.before(wrapper);
    wrapper.append(element);
    return wrapper;
  }

  createNeutral() {
    const neutral = this.DOM.createElement('span');
    this.setAttribute(neutral, SELECTOR.neutral);
    return neutral;
  }

  createTestNodeFrom(node) {
    const testNode = node.cloneNode(false);
    testNode.classList = 'test-node'
    testNode.style.position = 'absolute';
    testNode.style.background = 'rgb(255 239 177)';
    // testNode.style.left = '-10000px';
    testNode.style.width = this.getMaxWidth(node) + 'px';
    return testNode;
  }

  getMaxWidth(node) {
    // * width adjustment for createTestNodeFrom()
    // ? problem: if the node is inline,
    // it may not show its maximum width in the parent context.
    // So we make a block element that shows
    // the maximum width of the node in the current context:
    const tempDiv = this.create();
    node.append(tempDiv);
    const width = this.getElementWidth(tempDiv);
    tempDiv.remove();
    return width;
  }

  getLineHeight(node) {
    const testNode = this.createNeutral();
    // if node has padding, this affects so cant be taken bode clone as wrapper // todo comment
    // const testNode = node.cloneNode(false);
    testNode.innerHTML = '!';
    testNode.style = "position:absolute; left:-10000px; width:100%;";
    node.append(testNode);
    const lineHeight = testNode.offsetHeight;
    testNode.remove();
    return lineHeight;
  }

  getEmptyNodeHeight(node) {
    const wrapper = node.cloneNode(false);
    node.before(wrapper);
    const wrapperHeight = wrapper.offsetHeight;
    wrapper.remove();
    return wrapperHeight;
  }

  createComplexTextBlock() {
    const textBlock = this.create();
    textBlock.className = "complex-text-block";
    textBlock.setAttribute(SELECTOR.complexTextBlock, '');
    return textBlock;
  }

  isComplexTextBlock(element) {
    return element.hasAttribute(SELECTOR.complexTextBlock)
  }

  isInline(element) {
    return window.getComputedStyle(element).display == 'inline';
  }

  // todo {class, id, dataset, value} ?
  isNeutral(element) {
    // SELECTOR.neutral
    return element.dataset?.hasOwnProperty('neutral')
  }

  isForcedPageBreak(element) {
    // SELECTOR.printForcedPageBreak
    // todo: add one more attribute like [print-forced-page-break]
    // element.hasAttribute('data-print-forced-page-break') && console.log(element, element.hasAttribute('data-print-forced-page-break'));
    return element.dataset?.hasOwnProperty('printForcedPageBreak')
  }

  findAllForcedPageBreakInside(element) {
    return [...element.querySelectorAll('[data-print-forced-page-break]')];
  }

  isNoBreak(element) {
    // SELECTOR.printNoBreak
    return element.dataset?.hasOwnProperty('printNoBreak')
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

  isSignificantTextNode(element) {
    if (this.isTextNode(element)) {
      return (element.nodeValue.trim().length > 0) ? true : false;
    }
    return false;
  }

  // GET TEMPLATES

  clearTemplates(root) {
    // Remove all <template>s, if there are any in the Root.
    const templates = root.querySelectorAll('template');
    templates.forEach((el) => el.remove());
  }

  // helpers

  getParentNode(element) {
    return element.parentNode;
  }

  getChildNodes(element) {
    return element.childNodes;
  }

  getChildren(element) {
    return element.children;
  }

  getInnerHTML(selector) {

    if (typeof selector === 'string') {
      const source = this.DOM.querySelector(selector);
      if (source) {
        return source.innerHTML;
      }
      return;
    }
    return selector.innerHTML;
  }

  setInnerHTML(selector, html) {

    if (typeof selector === 'string') {
      const source = this.DOM.querySelector(selector);
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

  create(element) {
    if (!element) {
      const el = this.DOM.createElement('div');
      return el;
    }

    const first = element.charAt(0);

    if (first === '.') {
      const cl = element.substring(1);
      const el = this.DOM.createElement('div');
      el.classList.add(cl);
      return el;
    }
    if (first === '#') {
      const id = element.substring(1);
      const el = this.DOM.createElement('div');
      el.id = id;
      return el;
    }
    if (first === '[') {
      const attr = element.substring(1, element.length - 1);
      const el = this.DOM.createElement('div');
      el.setAttribute(attr, '');
      return el;
    }

    const el = this.DOM.createElement(element);
    return el;
  }

  createPrintPageBreak() {
    return this.create(SELECTOR.printPageBreak);
  }

  createPrintNoBreak(style) {
    const element = this.create(SELECTOR.printNoBreak);
    style && (element.style = style);
    return element;
  }

  wrapNode(node, wrapper) {
    node.before(wrapper);
    wrapper.append(node);
  }

  wrapWithPrintNoBreak(element) {
    const wrapper = this.createPrintNoBreak();
    element.before(wrapper);
    wrapper.append(element);
    return wrapper;
  }

  // PAGES

  fitElementWithinBoundaries({ element, height, width, vspace, hspace }) {
    console.log(element);

    const hRatio = vspace / height;
    const wRatio = hspace / width;

    const ratio = hRatio < wRatio ? hRatio : wRatio;

    const newHeight = Math.trunc(height * ratio);
    const newWidth = Math.trunc(width * ratio);

    element.style.height = newHeight + 'px';
    element.style.width = newWidth + 'px';
    // In SVG width and height of <rect> elements are attributes and not CSS properties
    element.setAttribute("height", `${newHeight}px`);
    element.setAttribute("width", `${newWidth}px`);
    // todo
    // element.style.margin = '0 auto';
  }

  getElementBCR(element) {
    return element.getBoundingClientRect();
  }

  getElementTop(element) {
    return element?.offsetTop;
  }

  getElementLeft(element) {
    return element?.offsetLeft;
  }

  getElementHeight(element) {
    return element?.offsetHeight;
  }

  getElementWidth(element) {
    return element?.offsetWidth;
  }

  getElementRelativeTop(element) {
    return element?.offsetTop;
  }

  getElementRootedTop(element, root, topAcc = 0) {

    if (!element) {
      console.warn('element must be provided', element);
      return
    }

    if (!root) {
      console.warn('root must be provided', element);
      return
    }

    const offsetParent = element.offsetParent;

    if (!offsetParent) {
      console.warn('element has no offset parent', element);
      return
    }

    const currTop = element.offsetTop;

    if (offsetParent === root) {
      return (currTop + topAcc);
    } else {
      // console.log('%c offsetParent', 'background:yellow', offsetParent);
      return this.getElementRootedTop(offsetParent, root, topAcc + currTop);
    }
  }

  getElementRelativeBottom(element) {
    // BUG ? 
    return element?.offsetTop + element?.offsetHeight || undefined;
  }

  getElementRootedBottom(element, root) {
    return this.getElementRootedTop(element, root) + this.getElementHeight(element);
  }

  // TODO make Obj with offsetTop and use it later
  prepareSplittedNode(node) {
    const splittedNode = node;
    const nodeWords = node.innerHTML.split(' ');

    const nodeWordItems = nodeWords.map((item) => {
      const span = this.DOM.createElement('span');
      span.innerHTML = item + ' ';
      return span;
    })

    const testNode = this.createTestNodeFrom(node);
    testNode.append(...nodeWordItems)
    node.append(testNode);

    return {
      splittedNode,
      nodeWords,
      nodeWordItems,
    }
  }

  // todo: move styles to params as optional
  createSignpost(text, height = 24) {
    const prefix = this.create();
    prefix.style.display = 'flex';
    prefix.style.flexWrap = 'nowrap';
    prefix.style.alignItems = 'center';
    prefix.style.justifyContent = 'center';
    prefix.style.textAlign = 'center';
    prefix.style.fontSize = '8px';
    prefix.style.fontFamily = 'sans-serif';
    prefix.style.letterSpacing = '1px';
    prefix.style.textTransform = 'uppercase';
    prefix.style.height = height + 'px';
    text && (prefix.innerHTML = text);
    return prefix
  }

  createTable({
    wrapper,
    caption,
    thead,
    tfoot,
    tbody,
  }) {
    const table = wrapper ? wrapper : this.create('table');
    const tableBody = this.create('TBODY');
    caption && table.append(caption);
    thead && table.append(thead);
    tbody && tableBody.append(...tbody);
    table.append(tableBody);
    tfoot && table.append(tfoot);
    return table;
  }

}
