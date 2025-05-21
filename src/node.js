export default class Node {
  constructor({
    config,
    DOM,
    selector
  }) {
    this._config = config;
    this._DOM = DOM;
    this._selector = selector;
    // * From config:
    this._debug = config.debugMode ? { ...config.debugConfig.node } : {};
    this._markupDebugMode = this._config.markupDebugMode;
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

    const nodeEntries = [...node.children].reduce((acc, curr) => {

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
        this.setFlagNoBreak(curr);
        return {
          ...acc,
          caption: curr
        }
      }

      if (tag === 'COLGROUP') {
        this.setFlagNoBreak(curr);
        return {
          ...acc,
          colgroup: curr
        }
      }

      if (tag === 'THEAD') {
        this.setFlagNoBreak(curr);
        return {
          ...acc,
          thead: curr
        }
      }

      if (tag === 'TFOOT') {
        this.setFlagNoBreak(curr);
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
      this._debug._
        && console.warn(`something unexpected is found in the table ${node}`);
    }

    return nodeEntries
  }

  getPreparedChildren(element) {
    // Check children:
    // TODO variants
    // TODO last child
    // TODO first Li

    // fon display:none / contents
    // this._DOM.getElementOffsetParent(currentElement)

    // TODO: to do this check more elegant
    // SEE the context here:
    // this._paragraph.split(node)
    // ...
    // const nodeChildren = this.getPreparedChildren(node);
    // * _processInlineChildren (makes ComplexTextBlock) is running extra on complex nodes
    if (this.isComplexTextBlock(element)) {
      return [...this._DOM.getChildren(element)]

    } else {

      let childrenArr = [...this._DOM.getChildNodes(element)]
        .reduce(
          (acc, item) => {

            // * filter STYLE, use element.tagName
            if (this.isSTYLE(item)) {
              return acc;
            }

            // * wrap text node, use element.nodeType
            if (this.isSignificantTextNode(item)) {
              acc.push(this.wrapTextNode(item));
              return acc;
            }

            // * no offset parent (contains)
            if (!this._DOM.getElementOffsetParent(item)) {
              const ch = this.getPreparedChildren(item);
              ch.length > 0 && acc.push(...ch);
              return acc;
            }

            // * normal
            if (this._DOM.isElementNode(item)) {
              acc.push(item);
              return acc;
            };

          }, [])

          if (this.isVerticalFlowDisrupted(childrenArr)) {
            // * If the vertical flow is disturbed and the elements are side by side:
            childrenArr = this._processInlineChildren(childrenArr);
          }

      return childrenArr;
    }
  }

  _processInlineChildren(children) {

    let complexTextBlock = null;
    const newChildren = [];

    children.forEach(child => {
      if (this.isInline(this._DOM.getComputedStyle(child))) {
        if (!complexTextBlock) {
          // the first inline child
          complexTextBlock = this.createComplexTextBlock();
          this.wrapNode(child, complexTextBlock);
          newChildren.push(complexTextBlock);
        }
        // not the first inline child
        this._DOM.insertAtEnd(complexTextBlock, child)
      } else {
        // A block child is encountered,
        // so interrupt the collection of elements in the complexTextBlock:
        complexTextBlock = null;
        newChildren.push(child);
      }
    })

    return newChildren
  }

  // TEMPLATES

  clearTemplates(root) {
    // Remove all <template>s, if there are any in the Root.
    const templates = this.getAll('template', root);
    templates.forEach((el) => this._DOM.removeNode(el));
  }

  // CHECKERS

  isSelectorMatching(element, selector) {
    if (!element || !selector) {
      this._debug._ && console.warn('isSelectorMatching() must have 2 params',
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
      this._debug._ && console.assert(
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
      return (this._DOM.getNodeValue(element).trim().length > 0) ? true : false;
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

  isOBJECT(element) {
    return this._DOM.getElementTagName(element) === 'OBJECT'
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

  isWrappedTextLine(element) {
    return this.isSelectorMatching(element, this._selector.textLine)
  }

  isWrappedTextGroup(element) {
    return this.isSelectorMatching(element, this._selector.textGroup)
  }

  isPageStartElement(element) {
    return this.isSelectorMatching(element, this._selector.pageStartMarker)
  }

  isContentFlowStart(element) {
    return this.isSelectorMatching(element, this._selector.contentFlowStart)
  }

  isAfterContentFlowStart(element) {
    const elementBeforeInspected = this._DOM.getLeftNeighbor(element);
    return this.isSelectorMatching(elementBeforeInspected, this._selector.contentFlowStart)
  }

  isContentFlowEnd(element) {
    return this.isSelectorMatching(element, this._selector.contentFlowEnd)
  }

  isComplexTextBlock(element) {
    return this.isSelectorMatching(element, this._selector.complexTextBlock)
  }

  isNoBreak(element, _style = this._DOM.getComputedStyle(element)) {
    return this.isSelectorMatching(element, this._selector.flagNoBreak)
        || this.isWrappedTextLine(element)
        || this.isWrappedTextGroup(element)
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

  isSlough(element) {
    return this._DOM.hasAttribute(element, 'slough-node');
  }

  // *

  isFirstChildOfFirstChild(element, rootElement) {
    if (!element || !this._DOM.getParentNode(element)) {
      return false;
    }

    let currentElement = element;

    while (this._DOM.getParentNode(currentElement) && currentElement !== rootElement) {
      if (this._DOM.getFirstElementChild(this._DOM.getParentNode(currentElement)) !== currentElement) {
        return false;
      }

      currentElement = this._DOM.getParentNode(currentElement);
    }

    // * Making sure we get to the end,
    // * and don't exit with "false" until the end of the check.
    return currentElement === rootElement;
  }

  isLastChildOfLastChild(element, rootElement) {
    if (!element || !this._DOM.getParentNode(element)) {
      return false;
    }

    let currentElement = element;

    // *** moving up
    while (this._DOM.getParentNode(currentElement) && currentElement !== rootElement) {

      // *** if we're at the root, we move to the right
      if (this._DOM.getParentNode(currentElement) === rootElement) {

        // ! in Pages we inserted an element 'html2pdf-content-flow-end'
        // ! at the end of the content flow.
        // ! Therefore, in the last step of the check, we should not check the last child,
        // ! but the matchings of the nextSibling.
        // ? ...and some plugins like to insert themselves at the end of the body.
        // ? So let's check that stupidity too..
        let _next = this._DOM.getRightNeighbor(currentElement);

        while (!this._DOM.getElementOffsetHeight(_next) && !this._DOM.getElementOffsetWidth(_next)) {
          // *** move to the right
          _next = this._DOM.getRightNeighbor(_next);
          // *** and see if we've reached the end
          if (this.isContentFlowEnd(_next)) {
            return true;
          }
        }
        // *** see if we've reached the end
        return this.isContentFlowEnd(_next);
      }

      // *** and while we're still not at the root, we're moving up
      if (this._DOM.getLastElementChild(this._DOM.getParentNode(currentElement)) !== currentElement) {
        return false;
      }

      currentElement = this._DOM.getParentNode(currentElement);
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
  isLineKept(current, next, debug) {
    // * (-1): Browser rounding fix (when converting mm to pixels).
    const currentBottom = this._DOM.getElementOffsetBottom(current);
    const nextTop = this._DOM.getElementOffsetTop(next);
    const delta = currentBottom - nextTop;
    const vert = delta >= 2;
    debug && console.group('isLineKept?')
    debug && console.log(
      '\n',
      vert,
      '\n',
      '\n currentBottom', currentBottom, [current],
      '\n nextTop', nextTop, [next],
'\n delta', delta,
      );
      debug && console.groupEnd('isLineKept?')
    return vert;
  }

  // GET ELEMENTS

  findFirstChildParent(element, rootElement) {
    let parent = this._DOM.getParentNode(element);
    let firstSuitableParent = null;

    while (parent && parent !== rootElement) {
      const firstChild = this._DOM.getFirstElementChild(parent);

      if (element === firstChild) {
        firstSuitableParent = parent;
        element = parent;
        parent = this._DOM.getParentNode(element);
      } else {
        return firstSuitableParent;
      }
    }

    return firstSuitableParent;
  }

  findLastChildParent(element, rootElement) {
    let parent = this._DOM.getParentNode(element);
    let lastSuitableParent = null;

    while (parent && parent !== rootElement) {
      const lastChild = this._DOM.getLastElementChild(parent);

      if (element === lastChild) {
        lastSuitableParent = parent;
        element = parent;
        parent = this._DOM.getParentNode(element);
      } else {
        return lastSuitableParent;
      }
    }

    return lastSuitableParent;
  }

  isVerticalFlowDisrupted(arrayOfElements) {
    return arrayOfElements.some(

      (current, currentIndex, array) => {
        const currentElement = current;
        const nextElement = array[currentIndex + 1];

        if (!nextElement) {
          return false
        };
        const isTrue = this._DOM.getElementOffsetBottom(currentElement) > this._DOM.getElementOffsetTop(nextElement);
        return isTrue;
      }
    )
  }

  findBetterForcedPageStarter(element, root) {
    let current = element;

    while (true) {
      const firstChildParent = this.findFirstChildParent(current, root);
      if (firstChildParent && firstChildParent !== current) {
        current = firstChildParent;
        continue;
      }

      const left = this._DOM.getLeftNeighbor(current);
      if (left && this.isNoHanging(left)) {
        current = left;
        continue;
      }

      break;
    }

    return current;
  }

  findBetterPageStart(pageStart, lastPageStart, root) {
    this._debug._ && console.groupCollapsed('➗ findBetterPageStart');

    let interruptedWithUndefined = false;
    let interruptedWithLimit = false;

    // * limited to the element from which the last registered page starts:
    const topLimit = this.getTop(lastPageStart, root);

    this._debug._ && console.log(
      "Start calculations:",
      {pageStart, lastPageStart, topLimit},
    );

    // * Let's keep a stable intermediate improvement here, based on findFirstChildParent.
    let betterCandidate = this.findFirstChildParentFromPage(
        pageStart,
        topLimit,
        root
      ) || pageStart;

    this._debug._ && console.log("betterCandidate:", betterCandidate,);

    let currentCandidate = betterCandidate;

    while (true) {
      // * ⬅ * Going left/up on “no hanging” until we reach the limit.
      const previousCandidate = this.findPreviousNonHangingsFromPage(
        currentCandidate,
        topLimit,
        root
      ); // *** returns new element, undefined or null
      if (previousCandidate === undefined) {
        this._debug._ && console.warn('🫥 previousCandidate', previousCandidate);
        interruptedWithUndefined = true;
        break;
      }
      this._debug._ && console.log('• previousCandidate', {previousCandidate});
      if (previousCandidate) {
        currentCandidate = previousCandidate;
        continue;
      }
      this._debug._ && console.log('• update currentCandidate', {previousCandidate});

      // * ⬆ * Going up, through the first children.
      const firstChildParent = this.findFirstChildParentFromPage(
        currentCandidate,
        topLimit,
        root
      ); // *** returns new element, undefined or null
      if (firstChildParent === undefined) {
        this._debug._ && console.warn('🫥 firstChildParent', firstChildParent);
        interruptedWithUndefined = true;
        break;
      }
      this._debug._ && console.log('• firstChildParent', {firstChildParent});
      if (firstChildParent) {
        currentCandidate = firstChildParent;
        continue;
      }
      this._debug._ && console.log('• update currentCandidate', {firstChildParent});

      break;
    }

    // ! Now in the case of a long enough sequence of “previous candidates”,
    // ! we abolish the rule at all, and split the node inside the shell
    // ! with a single child (like headers).

    // We should be able to check “start of last page” here:
    // - as the previous element (left)
    // - as the parent element (up)

    if (currentCandidate == lastPageStart || this.getTop(currentCandidate, root) <= topLimit) {
      interruptedWithLimit = true;
      this._debug._ && console.log('☝️ Top page limit has been reached', betterCandidate);
    }

    // TODO: needs more tests
    const prev = this._DOM.getLeftNeighbor(currentCandidate);
    if (prev == lastPageStart) {
      interruptedWithLimit = true;
      this._debug._ && console.log('👈 Left limit has been reached (left neighbor is the last page start)', prev, betterCandidate);
    }

    //// return currentCandidate; // remove after rebase
    // If `undefined` is returned, it means that we have reached the limit
    // in one of the directions (past page start). Therefore we cancel attempts
    // to improve the page break semantically and leave only geometric improvement.
    let result = (interruptedWithUndefined || interruptedWithLimit) ? betterCandidate : currentCandidate;

    if (this.isAfterContentFlowStart(result)) {
      result = pageStart;
    }

    this._debug._ && console.log({
      interruptedWithUndefined,
      interruptedWithLimit,
      pageStart,
      betterCandidate,
      currentCandidate,
      result,
    });

    this._debug._ && console.log('➗ end, return:', result);
    this._debug._ && console.groupEnd();

    return result
  }

  // GET SERVICE ELEMENTS

  findAllForcedPageBreakInside(element) {
    return this.getAll(this._selector.printForcedPageBreak, element);
  }

  findFirstChildParentFromPage(element, topLimit, root) {
    // Returns:
    // ** Nothing found, loop terminated normally  |  null
    // ** Found matching parent                    |  DOM element
    // ** Interrupted by isPageStartElement()      |  undefined
    //
    // If we reached PageStart while moving UP the tree -
    // we don't need intermediate results,
    // (we'll want to ignore the rule for semantic break improvement).

    this._debug._ && console.groupCollapsed('⬆ findFirstChildParentFromPage');

    let firstSuitableParent = null;
    let current = element;
    let interruptedByPageStart = false;

    while (true) {
      const parent = this._DOM.getParentNode(current);
      if (!parent) break;

      const isFirstChild = this._DOM.getFirstElementChild(parent) === current;
      if (!isFirstChild) {
        // First interrupt with end of nesting, with result passed to return.
        this._debug._ && console.warn({'!isFirstChild': parent});
        break;
      }

      if (this.isPageStartElement(parent) || this.getTop(parent, root) < topLimit) {
        // Interrupt with limit reached, with resetting the result, using interruptedByPageStart.
        this._debug._ && console.warn('🫥 findFirstChildParentFromPage // interruptedByPageStart');
        interruptedByPageStart = true;
        break;
      }

      this._debug._ && console.log({parent});
      firstSuitableParent = parent;
      current = parent;
    }

    this._debug._ && console.groupEnd('⬆ findFirstChildParentFromPage');
    return interruptedByPageStart ? undefined : firstSuitableParent;
  }

  findPreviousNonHangingsFromPage(element, topLimit, root) {
    // Returns:
    // ** Nothing found, loop terminated normally  |  null
    // ** Found matching parent                    |  DOM element
    // ** Interrupted by isPageStartElement()      |  undefined
    //
    // If we reached PageStart while moving LEFT the tree -
    // we don't need intermediate results,
    // (we'll want to ignore the rule for semantic break improvement).

    this._debug._ && console.groupCollapsed('⬅ findPreviousNonHangingsFromPage');

    let suitableSibling = null;
    let current = element;
    let interruptedByPageStart = false;

    while (true) {
      const prev = this._DOM.getLeftNeighbor(current);

      this._debug._ && console.log({ interruptedByPageStart, topLimit, prev, current });

      if (!prev || !this.isNoHanging(prev) || prev === current) break; // * return last computed

      if (this.isPageStartElement(prev) || this.getTop(prev, root) < topLimit) {
        interruptedByPageStart = true;
        break;
      }

      // * isNoHanging(prev) && !isPageStartElement(prev)
      // I'm looking at the previous element:
      suitableSibling = prev;
      current = prev;
    }

    this._debug._ && console.groupEnd('⬅ findPreviousNonHangingsFromPage');
    return interruptedByPageStart ? undefined : suitableSibling;
  }

  // findSuitableNonHangingPageStart: Added January 1, 25,
  // Commit: 407bd8166a9b9265b21ea3bfbdb80d0cb15e173f [407bd81]
  // "Node: add findSuitableNoHangingPageStart function to determine the best element for page breaks"
  // TODO: And it's not being used.
  findSuitableNonHangingPageStart(element, topFloater) {
    // * This function finds the best element to start a new page when certain elements
    // * (e.g., headings or similar items) cannot remain as the last item on the current page.
    // * It descends to find the deepest restricted child, then ascends to identify
    // * the highest valid parent that can start a new page. Finally, it checks if the
    // * candidate is positioned above the page break threshold (topFloater).
    // * Returns:
    // * - The most suitable element to start a new page if a valid candidate is found
    // *   (either the initial element or a refined child/parent candidate).
    // * - Null if no valid candidate satisfies the position constraint.

    let current = element; // * Current element being checked
    let candidate = null; // * Candidate to be returned

    // this._debug._ && console.log('💠 Initial element:', current);

    // * === 1. Descend to find the candidate ===
    while (true) {
      const lastChild = this._DOM.getLastElementChild(current);

      // * If there are no children, stop descending
      if (!lastChild) {
        // this._debug._ && console.log('💠 No further children, stopping descent at:', current);
        break;
      }

      // * If the last child has the isNoHanging flag, it becomes the candidate
      if (this.isNoHanging(lastChild)) {
        // this._debug._ && console.log('💠 Found isNoHanging child:', lastChild);
        candidate = lastChild; // * Update the candidate
        break; // * Stop descending because the flag was found
      }

      // * Continue descending to the last child
      current = lastChild;
    }

    // * If no candidate was found, set the initial element as the candidate
    // * and skip the wrapper search
    if (!candidate) {
      candidate = element;
      // this._debug._ && console.log('💠 No isNoHanging element found, using initial element as candidate:', candidate);
    } else {
      // * === 2. Ascend to find the best wrapper ===
      current = candidate; // * Start moving up from the current candidate

      while (current && current !== element) {
        const parent = current.parentElement;

        // * If there is no parent or we reached the initial element, stop
        if (!parent || parent === element) {
          // this._debug._ && console.log('💠 Reached top or initial element, stopping ascent.');
          break;
        }

        // * Check if the current element is the first child of its parent
        if (this._DOM.getFirstElementChild(parent) === current) {
          // this._debug._ && console.log('💠 Parent satisfies the condition, updating candidate to:', parent);
          candidate = parent; // * Update the candidate to its parent
          current = parent; // * Move up to the parent
        } else {
          // this._debug._ && console.log('💠 Parent does NOT satisfy the condition, stopping ascent.');
          break; // * Stop ascending if the condition is not met
        }
      }
    }

    // this._debug._ && console.log('💠 Final candidate after ascent:', candidate);

    // * === 3. Position check ===
    if (this.getTop(candidate) > topFloater) {
      // this._debug._ && console.log('💠 Candidate satisfies position check, returning:', candidate);
      return candidate;
    }

    // this._debug._ && console.log('💠 Candidate does not satisfy position check, returning null');
    return null;

  }

  // INSERT SPECIAL NODES

  insertForcedPageBreakBefore(element) {
    const div = this.create(this._selector.printForcedPageBreak);
    this._DOM.insertBefore(element, div);
    return div;
  }

  insertForcedPageBreakAfter(element) {
    const div = this.create(this._selector.printForcedPageBreak);
    this._DOM.insertAfter(element, div);
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

    this._DOM.setStyles(element, {
      height: newHeight + 'px',
      width:  newWidth  + 'px',

      // todo
      // margin: '0 auto',
    });

    // In SVG width and height of <rect> elements are attributes and not CSS properties
    this._DOM.setAttribute(element, "height", `${newHeight}px`);
    this._DOM.setAttribute(element, "width", `${newWidth}px`);
  }

  // CREATE

  create(selector, textContent) {
    let element;

    if (!selector) {
      element = this._DOM.createElement('div');
    } else {
      const first = selector.charAt(0);

      if (first.match(/[#\[\.]/)) {
        element = this._DOM.createElement('div');
        this._DOM.setAttribute(element, selector);
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

  createNeutralBlock() {
    // It is important that this element does not unexpectedly inherit parameters
    // that affect its height and has a block model.
    const element = this.createNeutral();
    element.style.display = 'block';
    return element
  }

  createTextLine() {
    return this.create(this._selector.textLine)
  }

  createTextGroup() {
    return this.create(this._selector.textGroup)
  }

  createWithFlagNoBreak(style) {
    const element = this.create(this._selector.flagNoBreak);
    style && this._DOM.setStyles(element, style);
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
    const testNode = this._DOM.cloneNodeWrapper(node);
    this._DOM.setAttribute(testNode, '.test-node');
    this._DOM.setStyles(testNode, {
      position: 'absolute',
      background: 'rgb(255 239 177)',
      width: this.getMaxWidth(node) + 'px',
      // left: '-10000px',
    })
    return testNode;
  }

  createWord(text, index) {
    const word = this.create(this._selector.word);
    this._DOM.setInnerHTML(word, text);
    word.dataset.index = index;
    return word;
  }

  // todo: move styles to params as optional
  createSignpost(text, height = 24) {
    const prefix = this.create();
    this._DOM.setStyles(prefix, {
      display: 'flex',
      flexWrap: 'nowrap',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      fontSize: '8px',
      fontFamily: 'sans-serif',
      letterSpacing: '1px',
      textTransform: 'uppercase',
      height: height + 'px',
    });
    text && this._DOM.setInnerHTML(prefix, text);
    return prefix
  }

  createTable({
    wrapper,
    caption,
    colgroup,
    thead,
    tfoot,
    tbody,
  }) {
    const table = wrapper ? wrapper : this.create('table');
    const tableBody = this.create('TBODY');
    caption && this._DOM.insertAtEnd(table, caption);
    colgroup && this._DOM.insertAtEnd(table, colgroup);
    thead && this._DOM.insertAtEnd(table, thead);
    tbody && this._DOM.insertAtEnd(tableBody, ...tbody);
    this._DOM.insertAtEnd(table, tableBody);
    tfoot && this._DOM.insertAtEnd(table, tfoot);
    return table;
  }

  // SET FLAG

  markProcessed(element, value) {
    this._markupDebugMode && this._DOM.setAttribute(element, this._selector.processed, '🏷️ ' + value)
  }

  setFlagNoBreak(element) {
    this._DOM.setAttribute(element, this._selector.flagNoBreak)
  }

  setFlagNoHanging(element, value) {
    this._DOM.setAttribute(element, this._selector.flagNoHanging, value)
  }

  markPageStartElement(element, page) {
    this._DOM.setAttribute(element, this._selector.pageStartMarker, page)
  }

  unmarkPageStartElement(element) {
    this._DOM.removeAttribute(element, this._selector.pageStartMarker);
  }

  markPartNodesWithClass(nodes) {
    nodes.forEach( node => {
      this._DOM.setAttribute(node, this._selector.topCutPart);
      this._DOM.setAttribute(node, this._selector.bottomCutPart);
    });
    this._DOM.removeAttribute(nodes.at(0), this._selector.topCutPart);
    this._DOM.removeAttribute(nodes.at(-1), this._selector.bottomCutPart);
  }

  // WRAP

  wrapNode(node, wrapper) {
    this._DOM.insertBefore(node, wrapper);
    this._DOM.insertAtEnd(wrapper, node);
  }

  // wrapNodeChildren(node) {
  //   const children = this.getChildren(node);
  //   const wrapper = this.create();
  //   this._DOM.insertAtStart(wrapper, ...children);
  //   this._DOM.insertAtStart(node, wrapper);
  //   return wrapper
  // }

  wrapTextNode(element) {
    if (!this.isSignificantTextNode(element)) {
      return
    }
    const wrapper = this.create(this._selector.textNode);
    this._DOM.insertBefore(element, wrapper);
    this._DOM.insertAtEnd(wrapper, element);
    return wrapper;
  }

  // GET PARAMS

  getTop( element, root = null, topAcc = 0 ) {

    if (!element) {
      this._debug._ && console.warn(
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
      this._debug._ && console.warn(
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
    //   this._DOM.setStyles(root, {position: 'relative'});
    // }

    // *** 3
    // *** need to revert back to the original positioning of the node
    // this._DOM.setStyles(root, {position: initPosition});

    const offsetParent = this._DOM.getElementOffsetParent(element);

    // TODO element == document.body
    if (!offsetParent) {
      this._debug._ && console.warn(
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
      this._debug._ && console.warn(
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
      this._debug._ && console.warn(
        'root must be provided, but was received:', root,
        '\nThe function returned:', undefined
      );
      return
    }

    return this.getTop(element, root) + this._DOM.getElementOffsetHeight(element);
  }

  getHeightWithMargin(element) {
    const topMargin = parseInt(this._DOM.getComputedStyle(element).marginTop);
    const bottomMargin = parseInt(this._DOM.getComputedStyle(element).marginBottom);
    const height = this._DOM.getElementOffsetHeight(element);
    return height + topMargin + bottomMargin;
  }

  getBottomWithMargin(element, root) {
    // TODO : performance
    // ? However, the performance compared to getBottom() decreases:
    // ? 0.001 to 0.3 ms per such operation.

    // * Because of the possible bottom margin
    // * of the parent element or nested last children,
    // * the exact check will be through the creation of the test element.
    // * (The bottom margin pushes the test DIV below the margin).

    // * However, not all structures give the correct result. For example,
    // * flex or others with vertical rhythm abnormalities.
    // * Therefore, we implement an additional check.

    if (!element) {
      return
    }

    const _elementBottom = this.getBottom(element, root);
    let result;

    const test = this.createNeutralBlock();
    this._DOM.insertAfter(element, test);
    const testTop = this.getTop(test, root);
    this._DOM.removeNode(test);

    // * In case of normal vertical rhythm, the position of the test element
    // * inserted after the current one can only be greater than or equal
    // * to _elementBottom:

    const isTestResultValid = testTop >= _elementBottom;

    if (isTestResultValid) {
      result = testTop;
    } else {
      // * Otherwise, we'll have to use a less accurate but stable method.
      const bottomMargin = this._DOM.getComputedStyle(element).marginBottom;
      result = _elementBottom + bottomMargin;
    }

    return result;
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
    this._DOM.insertAtEnd(node, tempDiv);
    const width = this._DOM.getElementOffsetWidth(tempDiv);
    this._DOM.removeNode(tempDiv);
    return width;
  }

  getEmptyNodeHeight(node, margins = true) {
    const wrapper = this.create();
    margins && this._DOM.setStyles(wrapper, {padding: '0.1px'});
    const clone = this._DOM.cloneNodeWrapper(node);
    if (this._DOM.getElementTagName(node) === 'TABLE') {
      this._DOM.setInnerHTML(clone, '<tr><td></td></tr>');
    };
    this._DOM.insertAtEnd(wrapper, clone);
    this._DOM.insertBefore(node, wrapper);
    const wrapperHeight = this._DOM.getElementOffsetHeight(wrapper);
    this._DOM.removeNode(wrapper);
    return wrapperHeight;
  }

  getLineHeight(node) {
    const testNode = this.createNeutral();
    // if node has padding, this affects so cant be taken bode clone as wrapper // todo comment
    // const testNode = this._DOM.cloneNodeWrapper(node);
    this._DOM.setInnerHTML(testNode, '!');
    this._DOM.setStyles(testNode, {
      display: 'block',
      // ! 'absolute' added extra height to the element:
      // position: 'absolute',
      // left: '-10000px',
      // width: '100%',
    });

    this._DOM.insertAtEnd(node, testNode);
    const lineHeight = this._DOM.getElementOffsetHeight(testNode);
    this._DOM.removeNode(testNode);
    return lineHeight;
  }

  getTableRowHeight(tr, num = 0) {
    // Create an empty row by cloning the TR, insert it into the table,
    // * add the specified number of lines to it (num),
    // and detect its actual height through the delta
    // of the tops of the TR following it.
    const initialTop = this._DOM.getElementOffsetTop(tr);
    const clone = this._DOM.cloneNode(tr);
    const text = '!<br />'.repeat(num);
    [...clone.children].forEach(td => this._DOM.setInnerHTML(td, text));
    this._DOM.insertBefore(tr, clone);
    const endTop = this._DOM.getElementOffsetTop(tr);
    this._DOM.removeNode(clone);
    return endTop - initialTop; // TODO?
  }

  // ***

  copyNodeWidth(clone, node) {
    this._DOM.setStyles(clone, {
      'width': `${this._DOM.getElementOffsetWidth(node)}px`,
      // * if in COLGROUP/COL were set 'width',
      // * it defines a minimum width for the columns within the column group,
      // * as if min-width were set.
      // * And this COLGROUP/COL rule has precedence in CSS rules,
      // * so just 'width' in TD won't be able to override the one set in COL.
      'min-width': `${this._DOM.getElementOffsetWidth(node)}px`,
    });
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
      this._DOM.setInnerHTML(span, item + ' ');
      return span;
    })

    const testNode = this.createTestNodeFrom(node);
    this._DOM.insertAtEnd(testNode, ...nodeWordItems);
    this._DOM.insertAtEnd(node, testNode);

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
    const text = this._DOM.getNodeValue(node) || this._DOM.getInnerHTML(node);
    // SEE Pages: const WORD_JOINER
    const arr = text.split(/(?<=\s|-)/); // WORD_JOINER = '';
    // const arr = node.innerHTML.split(/(?<=\s|-)/); // WORD_JOINER = '';
    // const arr = node.innerHTML.split(/\s+/); // WORD_JOINER = ' ';
    // console.log('🔴', arr)
    return arr
  }

  splitByWordsGreedyWithSpacesFilter(node) {
    const text = this._DOM.getNodeValue(node) || this._DOM.getInnerHTML(node);
    // SEE Pages: const WORD_JOINER
    // ** 1 ** add trim() for trailing spaces
    const arr = text.trim().split(/(?<=\s|-)/); // WORD_JOINER = '';
    // const arr = node.innerHTML.trim().split(/(?<=\s|-)/); // WORD_JOINER = '';
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
    // return (tag === 'OBJECT')
    return false
  }

}
