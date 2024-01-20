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






  get(selector, target = this._DOM) {
    console.assert(selector);
    return this._DOM.getElement(selector, target)
  }

  getAll(selectors, target = this._DOM) {
    console.assert(selectors);
    if (typeof selectors === 'string') {
      selectors = selectors.split(',').filter(Boolean);
    }
    console.assert(Array.isArray(selectors), 'Selectors must be provided as an array or string (one selector or multiple selectors, separated by commas). Now the selectors are:', selectors);
    console.assert(selectors.length > 0);

    if (selectors.length === 1) {
      return [...this._DOM.getAllElements(selectors[0], target)]
    } else {
      return [...selectors].flatMap(
        selector => [...this._DOM.getAllElements(selector, target)]
      )
    }
  }





  isSelectorMatching(element, selector) {
    if (!element || !selector) {
      this._debugMode && this._debugToggler._DOM && console.warn('isSelectorMatching() must have 2 params',
      '\n element: ', element,
      '\n selector: ', selector);
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
      this._debugMode && this._debugToggler._DOM && console.assert(
        selector.at(-1) === ']', `the ${selector} selector is not OK.`
      );
      const attr = selector.substring(1, selector.length - 1);
      return element.hasAttribute(attr);

    } else {
      // Strictly speaking, the tag name is not a selector,
      // but to be on the safe side, let's check that too:
      return this._DOM.getElementTagName(element) === selector.toUpperCase();
    }
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
    return this.isSelectorMatching(element, this._selector.pageStartMarker)
  }

  isComplexTextBlock(element) {
    return this.isSelectorMatching(element, this._selector.complexTextBlock)
  }

  isNoBreak(element, _style = this._DOM.getComputedStyle(element)) {
    return this.isSelectorMatching(element, this._selector.flagNoBreak)
        || this.isInlineBlock(_style)
        || this.notSolved(element);
    // TODO
  }

  isNoHanging(element) {
    return this.isSelectorMatching(element, this._selector.flagNoHanging)
  }

  isInline(computedStyle) {
    const display = computedStyle.display;
    const res = display === "inline" ||
                display === "inline-block" ||
                display === "inline-table" ||
                display === "inline-flex" ||
                display === "inline-grid";
    return res;
  }

  isInlineBlock(computedStyle) {
    const display = computedStyle.display;
    const res = display === "inline-block" ||
                display === "inline-table" ||
                display === "inline-flex" ||
                display === "inline-grid";
    return res;
  }

  isGrid(computedStyle) {
    const display = computedStyle.display;
    const res = display === "grid";
    return res;
  }

  isNeutral(element) {
    const match = this.isSelectorMatching(element, this._selector.neutral);
    return match
  }

  isForcedPageBreak(element) {
    return this.isSelectorMatching(element, this._selector.printForcedPageBreak)
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
    return this.isSelectorMatching(element, this._selector.textNode)
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

  isLastChildOfLastChild(element, rootElement) {
    if (!element || !element.parentElement) {
      return false;
    }

    let currentElement = element;

    // *** moving up
    while (currentElement.parentElement && currentElement !== rootElement) {

      // *** if we're at the root, we move to the right
      if (currentElement.parentElement === rootElement) {

        // ! in layout we inserted an element '[data-content-flow-end]'
        // ! at the end of the content flow.
        // ! Therefore, in the last step of the check, we should not check the last child,
        // ! but the matchings of the nextSibling.
        // ? ...and some plugins like to insert themselves at the end of the body.
        // ? So let's check that stupidity too..
        let _next = currentElement.nextElementSibling;

        while (!_next.offsetHeight && !_next.offsetWidth) {
          // *** move to the right
          _next = _next.nextElementSibling;
          // *** and see if we've reached the end
          if (this.isSelectorMatching(_next, '[data-content-flow-end]')) {
            return true;
          }
        }
        // *** see if we've reached the end
        return this.isSelectorMatching(_next, '[data-content-flow-end]');
      }

      // *** and while we're still not at the root, we're moving up
      if (currentElement.parentElement.lastElementChild !== currentElement) {
        return false;
      }

      currentElement = currentElement.parentElement;
    }

    // * Making sure we get to the end,
    // * and don't exit with "false" until the end of the check.
    return currentElement === rootElement;
  }

  findFirstChildParent(element, rootElement) {
    let parent = element.parentElement;
    let firstSuitableParent = null;

    while (parent && parent !== rootElement) {
      const firstChild = parent.firstElementChild;

      if (element === firstChild) {
        firstSuitableParent = parent;
        element = parent;
        parent = element.parentElement;
      } else {
        return firstSuitableParent;
      }
    }

    return firstSuitableParent;
  }

  findLastChildParent(element, rootElement) {
    let parent = element.parentElement;
    let lastSuitableParent = null;

    while (parent && parent !== rootElement) {
      const lastChild = parent.lastElementChild;

      if (element === lastChild) {
        lastSuitableParent = parent;
        element = parent;
        parent = element.parentElement;
      } else {
        return lastSuitableParent;
      }
    }

    return lastSuitableParent;
  }

}
