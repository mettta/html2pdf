export default class Node {
  constructor({
    config,
    DOM,
    selector
  }) {
    this._config = config;
    this._DOM = DOM;
    this._selector = selector;
  }

  init() {
    this._config.debugMode && console.log('🍄 i am Node!')
  }

  isSTYLE(element) {
    return this._DOM.getElementTagName(element) === 'STYLE'
  }

  isIMG(element) {
    return this._DOM.getElementTagName(element) === 'IMG'
  }

  isSVG(element) {
    return this._DOM.getElementTagName(element) === 'svg'
  }

  isTextNode(element) {
    return this.isWrappedTextNode(element);
  }

  isPageStartElement(element) {
    return this._DOM.isSelectorMatching(element, this._selector.pageStartMarker)
  }

  isNoBreak(element, _style = this._DOM.getComputedStyle(element)) {
    return this._DOM.isNoBreak(element)
        || this._DOM.isInlineBlock(_style)
        || this.notSolved(element);
  }

  isNoHanging(element) {
    return this._DOM.isSelectorMatching(element, this._selector.flagNoHanging)
  }

  findPreviousNoHangingsFromPage(element, topFloater, root) {
    let suitableSibling = null;
    let prev = element.previousElementSibling;

    // while the candidates are within the current page
    // (below the element from which the last registered page starts):
    while (this._DOM.getElementRootedTop(prev, root) > topFloater) {
      // if it can't be left
      if (this.isNoHanging(prev)) {
        // and it's the Start of the page
        if (this.isPageStartElement(prev)) {
          // if I'm still on the current page and have a "start" -
          // then I simply drop the case and move the original element
          return element
        } else {
          // * isNoHanging(prev) && !isPageStartElement(prev)
          // I'm looking at the previous element:
          suitableSibling = prev;
          element = prev;
          prev = element.previousElementSibling;
        }
      } else {
        // * !isNoHanging(prev) - return last computed
        return suitableSibling;
      }
    }
    return suitableSibling;
  }

  isLiNode(element) {
    return this._DOM.getElementTagName(element) === 'LI';
  }

  isTableLikeNode(element, _style = this._DOM.getComputedStyle(element)) {
    return this._DOM.getElementTagName(element) !== 'TABLE'
    && [
      'table'
    ].includes(_style.display);
  }

  isTableNode(element, _style = this._DOM.getComputedStyle(element)) {
    //*** STRICTDOC specific
    //*** add scroll for wide tables */
    //* issue#1370 https://css-tricks.com/preventing-a-grid-blowout/ */
    // so table can has 'block' and 'nowrap'.
    return this._DOM.getElementTagName(element) === 'TABLE'
    || // ! &&
    ['table'].includes(_style.display);
  }

  isPRE(element, _style = this._DOM.getComputedStyle(element)) {
    // this._DOM.getElementTagName(element) === 'PRE'
    return [
      'block'
    ].includes(_style.display)
    && [
      'pre',
      'pre-wrap',
      'pre-line',
      'break-spaces',
      'nowrap'
    ].includes(_style.whiteSpace);
  }

  isGridAutoFlowRow(computedStyle) {
    const display = computedStyle.display;
    const gridAutoFlow = computedStyle.gridAutoFlow;
    const res1 = display === "grid" ||
                 display === "inline-grid";
    const res2 = gridAutoFlow === "row";
    return res1 && res2;
  }

  // isSignificantChild(child) {
  //   const tag = this._DOM.getElementTagName(child);

  //   // TODO isSignificantChild
  //   // If my nodeName is #text, my height is always undefined
  //   return (tag !== 'A' && tag !== 'TT' && this._DOM.getElementHeight(child) > 0);
  // }

  // **********

  notSolved(element) {
    // TODO !!!
    // помещать такой объект просто на отдельную страницу
    // проверить, если объект больше - как печатаются номера и разрывы
    const tag = this._DOM.getElementTagName(element);
    return (tag === 'OBJECT')
  }


  // _isUnbreakable(element) {
  //   // IF currentElement is specific,
  //   // process as a whole:
  //   const tag = this._DOM.getElementTagName(element);

  //   // BUG WITH OBJECT: in FF is ignored, in Chrome get wrong height
  //   // if (tag === 'OBJECT') {
  //   //   this._debugMode && console.log('i am object');
  //   //   resizeObserver.observe(currentElement)
  //   // }

  //   // this._DOM.isNeutral(element) || 

  //   const takeAsWhole = (tag === 'IMG' || tag === 'svg' || tag === 'TABLE' || this._DOM.isNoBreak(element) || tag === 'OBJECT')
  //   return takeAsWhole;
  // }




  setFlagNoBreak(element) {
    this._DOM.setAttribute(element, this._selector.flagNoBreak)
  }

  setFlagNoHanging(element) {
    this._DOM.setAttribute(element, this._selector.flagNoHanging)
  }

  wrapTextNode(element) {
    if (!this._DOM.isSignificantTextNode(element)) {
      return
    }
    const wrapper = this.create(this._selector.textNode);
    element.before(wrapper);
    wrapper.append(element);
    return wrapper;
  }

  isWrappedTextNode(element) {
    return this._DOM.isSelectorMatching(element, this._selector.textNode)
  }

  createPrintPageBreak() {
    return this.create(this._selector.printPageBreak);
  }

  createNeutral() {
    return this.create(this._selector.neutral)
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

  create(selector, textContent) {
    let element;

    if (!selector) {
      element = this._DOM.createElement('div');
    } else {
      const first = selector.charAt(0);

      if (first === '.') {
        const cl = selector.substring(1);
        element = this._DOM.createElement('div');
        element.classList.add(cl);
      } else if (first === '#') {
        const id = selector.substring(1);
        element = this._DOM.createElement('div');
        element.id = id;
      } else if (first === '[') {
        const attr = selector.substring(1, selector.length - 1);
        element = this._DOM.createElement('div');
        element.setAttribute(attr, '');
      } else if (first.match(/[a-zA-Z]/)) {
        element = this._DOM.createElement(selector);
      } else {
        console.assert(false, `Expected valid html selector ot tag name, but received:`, selector)
        return
      }
    }

    if (textContent) {
      this._DOM.setInnerHTML(element, textContent);
    }

    return element;
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

  getEmptyNodeHeight(node, margins = true) {
    const wrapper = this.create();
    margins && (wrapper.style.padding = '0.1px');
    const clone = node.cloneNode(false);
    wrapper.append(clone);
    node.before(wrapper);
    const wrapperHeight = wrapper.offsetHeight;
    wrapper.remove();
    return wrapperHeight;
  }

  createComplexTextBlock() {
    const textBlock = this.create(this._selector.complexTextBlock);
    return textBlock;
  }

  insertForcedPageBreakBefore(element) {
    const div = this.create(this._selector.printForcedPageBreak);
    this._DOM.insertBefore(element, div);
    return div;
  }

  insertForcedPageBreakAfter(element) {
    const div = this.create(this._selector.printForcedPageBreak);
    this.insertAfter(element, div);
    return div;
  }

  createWithFlagNoBreak(style) {
    const element = this.create(this._selector.flagNoBreak);
    style && (element.style = style);
    return element;
  }

  wrapNode(node, wrapper) {
    node.before(wrapper);
    wrapper.append(node);
  }

  wrapNodeChildren(node) {
    const children = this.getChildren(node);
    const wrapper = this.create();
    this.insertAtStart(wrapper, ...children);
    this.insertAtStart(node, wrapper);
    return wrapper
  }

  // TODO replace with setFlag... and remove wrapper function
  wrapWithFlagNoBreak(element) {
    const wrapper = this.createWithFlagNoBreak();
    element.before(wrapper);
    wrapper.append(element);
    return wrapper;
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

  getLineHeight(node) {
    const testNode = this.createNeutral();
    // if node has padding, this affects so cant be taken bode clone as wrapper // todo comment
    // const testNode = node.cloneNode(false);
    testNode.innerHTML = '!';
    // ! 'absolute' added extra height to the element:
    // testNode.style.position = 'absolute';
    // testNode.style.left = '-10000px';
    // testNode.style.width = '100%';
    testNode.style.display = 'block';
    node.append(testNode);
    const lineHeight = testNode.offsetHeight;
    testNode.remove();
    return lineHeight;
  }
}
