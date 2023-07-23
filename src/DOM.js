import SELECTOR from './selector';

const DOM_DEBAG_TOGGLER = true;

const CONSOLE_CSS_LABEL_DOM = 'border:1px solid #FFBB00;'
                            + 'background:#EEEEEE;'
                            + 'color:#FFBB00;'

export default class DocumentObjectModel {

  constructor({DOM, debugMode}) {
    this.debugMode = debugMode;
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

  setAttribute(element, selector) {
    if (!element || !selector) {
      console.warn && console.warn('setAttribute() must have 2 params');
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
      console.assert(
        selector.at(-1) === ']', `the ${selector} selector is not OK.`
      );
      const attr = selector.substring(1, selector.length - 1);
      element.setAttribute(attr, '');
      return
    }
    this.debugMode && console.log(`you're really sure ${selector} is a selector?`)
  }

  isSelectorMatching(element, selector) {
    if (!element || !selector) {
      console.warn && console.warn('setAttribute() must have 2 params');
      return;
    }

    const first = selector.charAt(0);

    if (first === '.') {
      const cl = selector.substring(1);
      return element.classList.contains(cl);

    } else if (first === '#') {
      const id = selector.substring(1);
      return element.id === id;

    } else if (first === '[') {
      console.assert(
        selector.at(-1) === ']', `the ${selector} selector is not OK.`
      );
      const attr = selector.substring(1, selector.length - 1);
      return element.hasAttribute(attr);

    } else {
      // Strictly speaking, the tag name is not a selector,
      // but to be on the safe side, let's check that too:
      return this.getElementTagName(element) === selector.toUpperCase();
    }
  }

  setFlagNoBreak(element) {
    this.setAttribute(element, SELECTOR.flagNoBreak)
  }
  setFlagNoHanging(element) {
    this.setAttribute(element, SELECTOR.flagNoHanging)
  }

  wrapTextNode(element) {
    if (!this.isSignificantTextNode(element)) {
      return
    }
    const wrapper = this.create(SELECTOR.textNode);
    element.before(wrapper);
    wrapper.append(element);
    return wrapper;
  }

  isWrappedTextNode(element) {
    return this.isSelectorMatching(element, SELECTOR.textNode)
  }

  createNeutral() {
    return this.create(SELECTOR.neutral)
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
    // ! 'absolute' added extra height to the element:
    // testNode.style.position = 'absolute';
    // testNode.style.left = '-10000px';
    // testNode.style.width = '100%';
    node.append(testNode);
    const lineHeight = testNode.offsetHeight;
    testNode.remove();
    return lineHeight;
  }

  getEmptyNodeHeight(node) {
    const wrapper = this.create();
    wrapper.style.padding = '0.1px';
    const clone = node.cloneNode(false);
    wrapper.append(clone);
    node.before(wrapper);
    const wrapperHeight = wrapper.offsetHeight;
    wrapper.remove();
    return wrapperHeight;
  }

  createComplexTextBlock() {
    const textBlock = this.create(SELECTOR.complexTextBlock);
    return textBlock;
  }

  isComplexTextBlock(element) {
    return this.isSelectorMatching(element, SELECTOR.complexTextBlock)
  }

  getComputedStyle(element) {
    return window.getComputedStyle(element);
  }

  isInline(element) {
    const display = this.getComputedStyle(element).display;
    const res = display === "inline" ||
                display === "inline-block" ||
                display === "inline-table" ||
                display === "inline-flex" ||
                display === "inline-grid";
    return res;
  }

  isInlineBlock(element) {
    const display = this.getComputedStyle(element).display;
    const res = display === "inline-block" ||
                display === "inline-table" ||
                display === "inline-flex" ||
                display === "inline-grid";
    return res;
  }

  isGrid(element) {
    const display = this.getComputedStyle(element).display;
    const res = display === "grid";
    return res;
  }

  isGridAutoFlowRow(element) {
    const display = this.getComputedStyle(element).display;
    const gridAutoFlow = this.getComputedStyle(element).gridAutoFlow;
    const res1 = display === "grid" ||
                 display === "inline-grid";
    const res2 = gridAutoFlow === "row";
    return res1 && res2;
  }

  isNeutral(element) {
    const match = this.isSelectorMatching(element, SELECTOR.neutral);
    return match
  }

  isForcedPageBreak(element) {
    return this.isSelectorMatching(element, SELECTOR.printForcedPageBreak)
  }

  insertForcedPageBreakBefore(element) {
    const div = this.create(SELECTOR.printForcedPageBreak);
    this.insertBefore(element, div);
    return div;
  }

  findAllSelectorsInside(element, selectors) {
    if (typeof selectors === 'string') {
      selectors = [selectors]
    };
    return [...selectors].flatMap(
      selector => [...element.querySelectorAll(selector)]
    )
  }

  isFirstChildOfFirstChild(element, rootElement) {
    if (!element || !element.parentElement) {
      return false;
    }

    let currentElement = element;

    while (currentElement.parentElement && currentElement !== rootElement) {
      if (currentElement.parentElement.firstElementChild !== currentElement) {
        return false;
      }

      currentElement = currentElement.parentElement;
    }

    // * Making sure we get to the end,
    // * and don't exit with "false" until the end of the check.
    return currentElement === rootElement;
  }

  findLastChildParent(element, rootElement) {
    let parent = element.parentElement;
    let lastSuitableParent = null;

    while (parent && parent !== rootElement) {
      const lastChild = parent.lastElementChild;

      if (element === lastChild) {
        lastSuitableParent = parent;
      }

      element = parent;
      parent = element.parentElement;
    }

    return lastSuitableParent;
  }

  findAllForcedPageBreakInside(element) {
    return [...element.querySelectorAll(SELECTOR.printForcedPageBreak)];
  }

  isNoBreak(element) {
    return this.isSelectorMatching(element, SELECTOR.flagNoBreak)
  }

  isNoHanging(element) {
    return this.isSelectorMatching(element, SELECTOR.flagNoHanging)
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

  createWithFlagNoBreak(style) {
    const element = this.create(SELECTOR.flagNoBreak);
    style && (element.style = style);
    return element;
  }

  wrapNode(node, wrapper) {
    node.before(wrapper);
    wrapper.append(node);
  }

  wrapWithFlagNoBreak(element) {
    const wrapper = this.createWithFlagNoBreak();
    element.before(wrapper);
    wrapper.append(element);
    return wrapper;
  }

  // PAGES

  fitElementWithinBoundaries({ element, height, width, vspace, hspace }) {

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
      this.debugMode && console.warn(
        'element must be provided, but was received:', element,
        '\nThe function returned:', undefined
      );
      return
    }

    if (!root) {
      this.debugMode && console.warn(
        'root must be provided, but was received:', element,
        '\nThe function returned:', undefined
      );
      return
    }

    const offsetParent = element.offsetParent;

    if (!offsetParent) {
      this.debugMode && console.warn(
        'element has no offset parent', element,
        '\nThe function returned:', undefined
      );
      return
    }

    const currTop = element.offsetTop;

    if (offsetParent === root) {
      return (currTop + topAcc);
    } else {
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

  getElementRootedRealBottom(element, root) {
    // TODO : performance
    // * Because of the possible bottom margin
    // * of the parent element or nested last children,
    // * the exact check will be through the creation of the test element.
    // ? However, the performance compared to getElementRootedBottom() decreases:
    // ? 0.001 to 0.3 ms per such operation.
    const test = this.create();
    // *** The bottom margin pushes the DIV below the margin,
    // *** so no dummy padding is needed.
    element && element.after(test);
    const top = element ? this.getElementRootedTop(test, root) : undefined;
    // this.debugMode && DOM_DEBAG_TOGGLER && console.log(
    //   '%c getElementRootedBottom ', CONSOLE_CSS_LABEL_DOM,
    //    {element, top});
    test.remove();
    return top;

    // const bottomMargin = this.getComputedStyle(element).marginBottom;
    // return this.getElementRootedBottom(element, root) + bottomMargin;
  }

  getElementRootedRealTop(element, root) {
    // TODO : performance
    const topMargin = parseInt(this.getComputedStyle(element).marginTop);
    return this.getElementRootedTop(element, root) - topMargin;
  }

  isLineChanged(current, next) {
    const vert = this.getElementRelativeBottom(current) <= this.getElementRelativeTop(next);
    // const gor = this.getElementLeft(current) + this.getElementWidth(current) > this.getElementLeft(next);
    return vert;
  }

  isLineKept(current, next) {
    const vert = this.getElementRelativeBottom(current) > this.getElementRelativeTop(next);
    return vert;
  }

  splitByWordsGreedy(node) {
    return node.innerHTML.split(/\s+/)
  }

  // TODO make Obj with offsetTop and use it later
  prepareSplittedNode(node) {
    const splittedNode = node;
    const nodeWords = this.splitByWordsGreedy(node);

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
