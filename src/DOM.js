import SELECTOR from './selector';

export default class DocumentObjectModel {

  constructor({DOM, debugMode}) {

    // * public
    this.body = DOM.body;

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

  // -

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

  replaceNodeContentsWith(element, ...payload) {
    this.setInnerHTML(element, '');
    element.append(...payload);
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













  markPageStartElement(element, page) {
    this.setAttribute(element, SELECTOR.pageStartMarker, page)
  }

  unmarkPageStartElement(element) {
    this.removeAttribute(
      element,
      SELECTOR.pageStartMarker.substring(
        1,
        SELECTOR.pageStartMarker.length - 1
      )
    );
  }



  markPartNodesWithClass(nodes) {
    nodes.forEach( node => {
      // this.setAttribute()
      // TODO remove Attribute
      node.classList.add(SELECTOR.topCutPart.substring(1));
      node.classList.add(SELECTOR.bottomCutPart.substring(1));
    });
    nodes.at(0).classList.remove(SELECTOR.topCutPart.substring(1));
    nodes.at(-1).classList.remove(SELECTOR.bottomCutPart.substring(1));
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
    return endTop - initialTop;
  }





  getComputedStyle(element) {
    return window.getComputedStyle(element);
  }







  findAllSelectorsInside(element, selectors) {
    if (typeof selectors === 'string') {
      selectors = [selectors]
    };
    return [...selectors].flatMap(
      selector => [...element.querySelectorAll(selector)]
    )
  }

  findAllForcedPageBreakInside(element) {
    return [...element.querySelectorAll(SELECTOR.printForcedPageBreak)];
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
    // *** need to make the getElementRootedTop work with root = node
    // const initPosition = _rootComputedStyle.position;
    // if (initPosition != 'relative') {
    //   root.style.position = 'relative';
    // }

    // *** 3
    // *** need to revert back to the original positioning of the node
    // root.style.position = initPosition;

    if (!element) {
      this._debugMode && this._debugToggler._DOM && console.warn(
        'element must be provided, but was received:', element,
        '\nThe function returned:', undefined
      );
      return
    }

    if (!root) {
      this._debugMode && console.warn(
        'root must be provided, but was received:', root,
        '\nThe function returned:', undefined
      );
      return
    }

    const offsetParent = element.offsetParent;

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
    // const test = this.create();
    const test = document.createElement('div'); // TODO
    // *** The bottom margin pushes the DIV below the margin,
    // *** so no dummy padding is needed.
    element && element.after(test);
    const top = element ? this.getElementRootedTop(test, root) : undefined;
    // this._debugMode && this._debugToggler._DOM && console.log(
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
     // * (-1): Browser rounding fix (when converting mm to pixels).
    const delta = this.getElementRelativeTop(next)
                - this.getElementRelativeBottom(current);
    const vert = delta > (-2);
    // const gor = this.getElementLeft(current) + this.getElementWidth(current) > this.getElementLeft(next);
    return vert;
  }
  // TODO: isLineChanged vs isLineKept: можно сделать else? они противоположны
  isLineKept(current, next) {
    // * (-1): Browser rounding fix (when converting mm to pixels).
    const delta = this.getElementRelativeTop(next)
                - this.getElementRelativeBottom(current);
    const vert = delta <= (-2);
    return vert;
  }

  splitByLinesGreedy(string) {
    const arr = string.split(/(?<=\n)/); // JOINER = '';
    return arr
  }

  splitByWordsGreedy(node) {
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

  lockTableWidths(table) {
    this.copyNodeWidth(table, table);
    table.querySelectorAll('td').forEach(
      td => this.copyNodeWidth(td, td)
    )
  }

  copyNodeWidth(clone, node) {
    // TODO check the fix:
    // * (-1): Browser rounding fix (when converting mm to pixels).
    clone.style.width = `${this.getElementWidth(node) - 1}px`;
  }

  findDeepestChild(element) {
    let currentElement = element;
    while (currentElement.firstElementChild) {
        currentElement = currentElement.firstElementChild;
    }
    return currentElement;
  }

}
