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

  // GET NODE

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
    console.assert(selectors.length > 0, 'getAll(selectors), selectors:', selectors);

    if (selectors.length === 1) {
      return [...this._DOM.getAllElements(selectors[0], target)]
    } else {
      return [...selectors].flatMap(
        selector => [...this._DOM.getAllElements(selector, target)]
      )
    }
  }

  getTableEntries(node) {

    const nodeEntries = [...node.children].reduce(function (acc, curr) {

      const tag = curr.tagName;

      if (tag === 'TBODY') {
        return {
          ...acc,
          rows: [
            ...acc.rows,
            ...curr.children,
          ]
        }
      }

      if (tag === 'CAPTION') {
        return {
          ...acc,
          caption: curr
        }
      }

      if (tag === 'COLGROUP') {
        return {
          ...acc,
          colgroup: curr
        }
      }

      if (tag === 'THEAD') {
        return {
          ...acc,
          thead: curr
        }
      }

      if (tag === 'TFOOT') {
        return {
          ...acc,
          tfoot: curr
        }
      }

      if (tag === 'TR') {
        return {
          ...acc,
          rows: [
            ...acc.rows,
            ...curr,
          ]
        }
      }

      return {
        ...acc,
        unexpected: [
          ...acc.unexpected,
          // BUG: •Uncaught TypeError: t is not iterable at bundle.js:1:19184
          // curr,
          ...curr,
        ]
      }
    }, {
      caption: null,
      thead: null,
      tfoot: null,
      rows: [],
      unexpected: [],
    });

    if (nodeEntries.unexpected.length > 0) {
      this._debugMode && this._debugToggler._DOM
        && console.warn(`something unexpected is found in the table ${node}`);
    }

    return nodeEntries
  }

  // TEMPLATES

  clearTemplates(root) {
    // Remove all <template>s, if there are any in the Root.
    const templates = this.getAll('template', root);
    templates.forEach((el) => el.remove());
  }

  // CHECKERS

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
      return this._DOM.hasClass(element, cl);

    } else if (first === '#') {
      const id = selector.substring(1);
      return this._DOM.hasID(element, id);

    } else if (first === '[') {
      this._debugMode && this._debugToggler._DOM && console.assert(
        selector.at(-1) === ']', `the ${selector} selector is not OK.`
      );
      const attr = selector.substring(1, selector.length - 1);
      return this._DOM.hasAttribute(element, attr);

    } else {
      // Strictly speaking, the tag name is not a selector,
      // but to be on the safe side, let's check that too:
      return this._DOM.getElementTagName(element) === selector.toUpperCase();
    }
  }

  // CHECK NODE TYPE

  isSignificantTextNode(element) {
    if (this._DOM.isTextNode(element)) {
      return (element.nodeValue.trim().length > 0) ? true : false;
    }
    return false;
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

  isLiNode(element) {
    return this._DOM.getElementTagName(element) === 'LI';
  }

  // CHECK SERVICE ELEMENTS

  isNeutral(element) {
    return this.isSelectorMatching(element, this._selector.neutral);
  }

  isWrappedTextNode(element) {
    return this.isSelectorMatching(element, this._selector.textNode)
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

  isForcedPageBreak(element) {
    return this.isSelectorMatching(element, this._selector.printForcedPageBreak)
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

  // ?

  isFullySPlitted(node) {
    const _style = this._DOM.getComputedStyle(node);
    return (
      this.isPRE(node, _style) ||
      this.isTableNode(node, _style) ||
      this.isTableLikeNode(node, _style) ||
      this.isGridAutoFlowRow(_style) // todo
    );
  }

  // *

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

  isLineChanged(current, next) {
    // * (-1): Browser rounding fix (when converting mm to pixels).
    const delta = this._DOM.getElementOffsetTop(next)
                - this._DOM.getElementOffsetBottom(current);
    const vert = delta > (-2);
    // const gor = this.getElementLeft(current) + this.getElementWidth(current) > this.getElementLeft(next);
    return vert;
  }
  // TODO: isLineChanged vs isLineKept: можно сделать else? они противоположны
  isLineKept(current, next) {
    // * (-1): Browser rounding fix (when converting mm to pixels).
    const delta = this._DOM.getElementOffsetTop(next)
                - this._DOM.getElementOffsetBottom(current);
    const vert = delta <= (-2);
    return vert;
  }

  // GET ELEMENTS

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

  // GET SERVICE ELEMENTS

  findAllForcedPageBreakInside(element) {
    return this.getAll(this._selector.printForcedPageBreak, element);
  }

  findPreviousNoHangingsFromPage(element, topFloater, root) {
    let suitableSibling = null;
    let prev = element.previousElementSibling;

    // while the candidates are within the current page
    // (below the element from which the last registered page starts):
    while (this.getTop(prev, root) > topFloater) {
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

  // INSERT SPECIAL NODES

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

  // RELACE / FIT

  replaceNodeContentsWith(element, ...payload) {
    this._DOM.setInnerHTML(element, '');
    this._DOM.insertAtEnd(element, ...payload)
  }

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

  // CREATE

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

  createNeutral() {
    return this.create(this._selector.neutral)
  }

  createWithFlagNoBreak(style) {
    const element = this.create(this._selector.flagNoBreak);
    style && (element.style = style);
    return element;
  }

  createPrintPageBreak() {
    return this.create(this._selector.printPageBreak);
  }

  createComplexTextBlock() {
    const textBlock = this.create(this._selector.complexTextBlock);
    return textBlock;
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

  // SET FLAG

  setFlagNoBreak(element) {
    this._DOM.setAttribute(element, this._selector.flagNoBreak)
  }

  setFlagNoHanging(element) {
    this._DOM.setAttribute(element, this._selector.flagNoHanging)
  }

  markPageStartElement(element, page) {
    this._DOM.setAttribute(element, this._selector.pageStartMarker, page)
  }

  unmarkPageStartElement(element) {
    this._DOM.removeAttribute(
      element,
      this._selector.pageStartMarker.substring(
        1,
        this._selector.pageStartMarker.length - 1
      )
    );
  }

  markPartNodesWithClass(nodes) {
    nodes.forEach( node => {
      // this.setAttribute()
      // TODO remove Attribute
      // TODO ???? check what is the purpose
      // TODO USE Attribute from DOM
      node.classList.add(this._selector.topCutPart.substring(1));
      node.classList.add(this._selector.bottomCutPart.substring(1));
    });
    nodes.at(0).classList.remove(this._selector.topCutPart.substring(1));
    nodes.at(-1).classList.remove(this._selector.bottomCutPart.substring(1));
  }

  // WRAP

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

  wrapTextNode(element) {
    if (!this.isSignificantTextNode(element)) {
      return
    }
    const wrapper = this.create(this._selector.textNode);
    element.before(wrapper);
    wrapper.append(element);
    return wrapper;
  }

  // GET PARAMS

  getTop( element, root = null, topAcc = 0 ) {

    if (!element) {
      this._debugMode && console.warn(
        'element must be provided, but was received:', element,
        '\nThe function returned:', undefined
      );
      return
    }

    // the offset case
    if (root === null) {
      return this._DOM.getElementOffsetTop(element)
    }

    if (!root) {
      this._debugMode && console.warn(
        'root must be provided, but was received:', root,
        '\nThe function returned:', undefined
      );
      return
    }

    // For now, expect this to be done when the function is called:

    // * A positioned ancestor is either:
    // * - an element with a non-static position, or
    // * - td, th, table in case the element itself is static positioned.
    // * So we need to set non-static position for root
    // * for the calculation runtime.

    // *** 1
    // const _rootComputedStyle = rootComputedStyle
    // ? rootComputedStyle
    // : this._DOM.getComputedStyle(root);

    // *** 2
    // *** need to make the getTop work with root = node
    // const initPosition = _rootComputedStyle.position;
    // if (initPosition != 'relative') {
    //   root.style.position = 'relative';
    // }

    // *** 3
    // *** need to revert back to the original positioning of the node
    // root.style.position = initPosition;

    const offsetParent = this._DOM.getElementOffsetParent(element);

    // TODO element == document.body
    if (!offsetParent) {
      this._debugMode && this._debugToggler._DOM && console.warn(
        'Element has no offset parent.',
        '\n element:', [element],
        '\n offsetParent:', offsetParent,
        '\n The function returned:', undefined
      );
      return
    }

    const currTop = this._DOM.getElementOffsetTop(element);

    if (offsetParent === root) {
      return (currTop + topAcc);
    } else {
      return this.getTop(offsetParent, root, topAcc + currTop);
    }

  }

  getBottom(element, root = null) {
    if (!element) {
      this._debugMode && console.warn(
        'element must be provided, but was received:', element,
        '\nThe function returned:', undefined
      );
      return
    }

    // the offset case
    if (root === null) {
      return this._DOM.getElementOffsetBottom(element)
    }

    if (!root) {
      this._debugMode && console.warn(
        'root must be provided, but was received:', root,
        '\nThe function returned:', undefined
      );
      return
    }

    return this.getTop(element, root) + this._DOM.getElementOffsetHeight(element);
  }

  getBottomWithMargin(element, root) {
    // TODO : performance
    // * Because of the possible bottom margin
    // * of the parent element or nested last children,
    // * the exact check will be through the creation of the test element.
    // ? However, the performance compared to getBottom() decreases:
    // ? 0.001 to 0.3 ms per such operation.
    // const test = this.create();
    const test = this.create(); // TODO
    // *** The bottom margin pushes the DIV below the margin,
    // *** so no dummy padding is needed.
    element && this._DOM.insertAfter(element, test);
    const top = element ? this.getTop(test, root) : undefined;
    this._DOM.removeNode(test);
    return top;

    // const bottomMargin = this._DOM.getComputedStyle(element).marginBottom;
    // return this.getBottom(element, root) + bottomMargin;
  }

  getTopWithMargin(element, root) {
    // TODO : performance
    const topMargin = parseInt(this._DOM.getComputedStyle(element).marginTop);
    return this.getTop(element, root) - topMargin;
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

  getTableRowHeight(tr, num = 0) {
    // Create an empty row by cloning the TR, insert it into the table,
    // * add the specified number of lines to it (num),
    // and detect its actual height through the delta
    // of the tops of the TR following it.
    const initialTop = tr.offsetTop;
    const clone = tr.cloneNode(true);
    const text = '!<br />'.repeat(num);
    [...clone.children].forEach(td => td.innerHTML = text);
    tr.before(clone);
    const endTop = tr.offsetTop;
    clone.remove();
    return endTop - initialTop; // TODO?
  }

  // ***

  copyNodeWidth(clone, node) {
    // TODO check the fix:
    // * (-1): Browser rounding fix (when converting mm to pixels).
    clone.style.width = `${this._DOM.getElementOffsetWidth(node) - 1}px`;
  }

  lockTableWidths(table) {
    this.copyNodeWidth(table, table);
    this.getAll('td', table).forEach(
      td => this.copyNodeWidth(td, td)
    )
  }

  // ***
  // ***
  // ***
  // ***
  // ***
  // ***
  // ***
  // ***
  // ***
  // *** split

  // TODO make Obj with offsetTop and use it later
  prepareSplittedNode(node) {
    const splittedNode = node;
    const nodeWords = this.splitByWordsGreedy(node);

    const nodeWordItems = nodeWords.map((item) => {
      const span = this._DOM.createElement('span');
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

  splitByLinesGreedy(string) {
    const arr = string.split(/(?<=\n)/); // JOINER = '';
    return arr
  }

  splitByWordsGreedy(node) { // ? in prepareSplittedNode
    // SEE Pages: const WORD_JOINER
    const arr = node.innerHTML.split(/(?<=\s|-)/); // WORD_JOINER = '';
    // const arr = node.innerHTML.split(/\s+/); // WORD_JOINER = ' ';
    // console.log('🔴', arr)
    return arr
  }

  splitByWordsGreedyWithSpacesFilter(node) {
    // SEE Pages: const WORD_JOINER
    // ** 1 ** add trim() for trailing spaces
    const arr = node.innerHTML.trim().split(/(?<=\s|-)/); // WORD_JOINER = '';
    // ** 2 ** filter arr and remove unnecessary spaces (' ') inside text block.
    // ** A meaningful space character has been added to an array element.
    const filteredArr = arr.filter(item => item != ' ');
    // console.log('🔴 filtered word Arr', filteredArr)
    return filteredArr
  }

  // **********

  notSolved(element) {
    // TODO !!!
    // помещать такой объект просто на отдельную страницу
    // проверить, если объект больше - как печатаются номера и разрывы
    const tag = this._DOM.getElementTagName(element);
    return (tag === 'OBJECT')
  }

}
