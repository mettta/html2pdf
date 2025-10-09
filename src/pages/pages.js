import arrayFromString from './arrayFromString.js';

const CONSOLE_CSS_COLOR_PAGES = '#66CC00';
const CONSOLE_CSS_PRIMARY_PAGES = `color: ${CONSOLE_CSS_COLOR_PAGES};font-weight:bold`;
const CONSOLE_CSS_LABEL_PAGES = `border:1px solid ${CONSOLE_CSS_COLOR_PAGES};`
                              + `background:#EEEEEE;`
                              + `color:${CONSOLE_CSS_COLOR_PAGES};`

const CONSOLE_CSS_END_LABEL = `background:#999;color:#FFF;padding: 0 4px;`;

export default class Pages {

  constructor({
    config,
    DOM,
    node,
    selector,
    layout,
    referenceWidth,
    referenceHeight
  }) {

    // * From config:
    this._debug = config.debugMode ? { ...config.debugConfig.pages } : {};
    this._assert = config.consoleAssert ? true : false;

    // * Private
    this._selector = selector; // todo one occurrence
    this._node = node;

    // TODO remove from fields:
    // no hanging params:
    this._noHangingSelectors = arrayFromString(config.noHangingSelectors);
    // forced Page Break params:
    this._pageBreakBeforeSelectors = arrayFromString(config.pageBreakBeforeSelectors);
    this._pageBreakAfterSelectors = arrayFromString(config.pageBreakAfterSelectors);
    this._forcedPageBreakSelectors = arrayFromString(config.forcedPageBreakSelectors);
    // do not break params:
    this._noBreakSelectors = arrayFromString(config.noBreakSelectors);
    // to be deleted from the DOM params:
    this._garbageSelectors = arrayFromString(config.garbageSelectors);

    // ***:
    this._DOM = DOM;

    this._root = layout.root;
    this._contentFlow = layout.contentFlow;

    this._referenceWidth = referenceWidth;
    this._referenceHeight = referenceHeight;

    // todo
    // 1) move to config
    // Paragraph:
    this._minLeftLines = 2;
    this._minDanglingLines = 2;
    this._minBreakableLines = this._minLeftLines + this._minDanglingLines;
    // Table:
    // # can be a single row with long content
    this._minLeftRows = 1; // ! min 1!
    this._minDanglingRows = 1;  // ! min 1!
    this._minBreakableRows = 1; // this._minLeftRows + this._minDanglingRows;
    // Code:
    this._minPreFirstBlockLines = 3;
    this._minPreLastBlockLines = 3;
    this._minPreBreakableLines = this._minPreFirstBlockLines + this._minPreLastBlockLines;
    // Grid:
    this._minBreakableGridRows = 4;

    this._imageReductionRatio = 0.8;

    // TODO make function
    // * From config:
    // - if null is set - the element is not created in createSignpost().
    this._signpostHeight = parseFloat(config.splitLabelHeight) || 0;

    // TODO: # _minimumBreakableHeight
    this._commonLineHeight = this._node.getLineHeight(this._root);
    this._minimumBreakableHeight = this._commonLineHeight * this._minBreakableLines;

    // * Public

    this.pages = [];
  }

  calculate() {
    this._removeGarbageElements();
    this._prepareNoHangingElements();
    this._prepareForcedPageBreakElements();
    this._prepareNoBreakElements();
    this._calculate();
    this._debug._ && console.log('%c ✔ Pages.calculate()', CONSOLE_CSS_LABEL_PAGES, this.pages);

    return this.pages;
  }

  _removeGarbageElements() {
    if (this._garbageSelectors.length) {
      const elements = this._DOM.getAll(this._garbageSelectors, this._contentFlow);
      elements.forEach(element => {
        this._DOM.removeNode(element)
      });
    }
  }

  _prepareNoHangingElements() {
    if (this._noHangingSelectors.length) {
      const elements = this._DOM.getAll(this._noHangingSelectors, this._contentFlow);
      elements.forEach(element => {
        this._node.setFlagNoHanging(element);
        const lastChildParent = this._node.findLastChildParent(element, this._contentFlow)
        if (lastChildParent) {
          this._node.setFlagNoHanging(lastChildParent, 'parent');
        }
      });
    }
  }

  _prepareNoBreakElements() {
    if (this._noBreakSelectors.length) {
      const elements = this._DOM.getAll(this._noBreakSelectors, this._contentFlow);
      elements.forEach(element => this._node.setFlagNoBreak(element));
    }
  }

  _prepareForcedPageBreakElements() {
    // ** Must be called after _prepareNoHangingElements()

    const pageStarters = this._pageBreakBeforeSelectors.length
                       ? this._DOM.getAll(this._pageBreakBeforeSelectors, this._contentFlow)
                       : [];
    const pageEnders = this._pageBreakAfterSelectors.length
                     ? this._DOM.getAll(this._pageBreakAfterSelectors, this._contentFlow)
                     : [];
    // there's at least one element:
    const forcedPageStarters = this._DOM.getAll(this._forcedPageBreakSelectors, this._contentFlow);

    // ** If the element is the FIRST child of nested FIRST children of a content flow,
    // ** we do not process it further for page breaks.
    // ** This ensures that page breaks are only made where they have not already been made for other reasons.
    // *** And consider that the first element is actually a service element ContentFlowStart.
    if (pageStarters.length) {
      const inspectedElement = pageStarters[0];
      const inspectedElementMaxFChParent = this._node.findFirstChildParent(inspectedElement,this._contentFlow) || inspectedElement;
      const isInspectedElementStartsContent = this._node.isAfterContentFlowStart(inspectedElementMaxFChParent);
      if (isInspectedElementStartsContent) {
        pageStarters.shift();
      };
    }
    // ** If the element is the LAST child of nested LAST children of a content flow,
    // ** we do not process it further for page breaks.
    // ** This ensures that page breaks are only made where they have not already been made for other reasons.
    // *** And consider that the last element is actually a service element ContentFlowEnd.
    if (pageEnders.length) {
      const inspectedElement = pageEnders.at(-1);
      const inspectedElementMaxLastChParent = this._node.findLastChildParent(inspectedElement,this._contentFlow) || inspectedElement;
      const elementAfterInspected = this._DOM.getRightNeighbor(inspectedElementMaxLastChParent);
      const isInspectedElementEndsContent = this._node.isContentFlowEnd(elementAfterInspected);
      if (isInspectedElementEndsContent) {
        pageEnders.pop()
      };
    }

    // * find all relevant elements and insert forced page break markers before them.
    pageStarters.length && pageStarters.forEach(element => {
      const candidate = this._node.findBetterForcedPageStarter(element, this._contentFlow);
      candidate && this._DOM.insertBefore(candidate, this._node.createForcedPageBreak());

    });

    // * find all relevant elements and insert forced page break markers before them.
    forcedPageStarters && forcedPageStarters.forEach(element => {
      // ** If it is not a forced page break element inserted by hand into the code:
      if(!this._node.isForcedPageBreak(element)) {
        const candidate = this._node.findBetterForcedPageStarter(element, this._contentFlow);
        candidate && this._DOM.insertBefore(candidate, this._node.createForcedPageBreak());

      }
      // ** In other case we leave it as it is.
    });

    // * find all relevant elements and insert forced page break markers after them.
    pageEnders.length && pageEnders.forEach(element => {
      const lastChildParent = this._node.findLastChildParent(element, this._contentFlow)
      if (lastChildParent) {
        element = lastChildParent;
      }
      // If there are AFTER and BEFORE breaks - insert only one.
      if (!this._node.isForcedPageBreak(element.nextElementSibling)) {
        this._DOM.insertAfter(element, this._node.createForcedPageBreak())
      } // else pass
    });

  }

  _calculate() {

    this._debug._ && console.groupCollapsed('•• init data ••');
    this._debug._ && console.log(
      'this._referenceHeight', this._referenceHeight,
      '\n',
      'this._noHangingSelectors', this._noHangingSelectors,
      '\n',
      'this._pageBreakBeforeSelectors', this._pageBreakBeforeSelectors,
      '\n',
      'this._pageBreakAfterSelectors', this._pageBreakAfterSelectors,
      '\n',
      'this._forcedPageBreakSelectors', this._forcedPageBreakSelectors,
      '\n',
      'this._noBreakSelectors', this._noBreakSelectors,
    );
    this._debug._ && console.groupEnd('•• init data ••');

    // register a FIRST page
    // TODO: make a service function
    this._registerPageStart(this._DOM.getElement(this._selector.contentFlowStart, this._contentFlow));

    // IF contentFlow is less than one page,

    const contentFlowBottom = this._node.getBottomWithMargin(this._contentFlow, this._root);
    if (contentFlowBottom < this._referenceHeight) {
      // In the case of a single page,
      // we don't examine the contentFlow children.

      this._debug._ && console.log(`contentFlow (${contentFlowBottom}) fits on the page (${this._referenceHeight})`);

      // Check for forced page breaks, and if they are, we register these pages.
      // If not - we'll have a single page.
      this._node.findAllForcedPageBreakInside(this._contentFlow).forEach(
        element => this._registerPageStart(element)
      );

      return;
    }

    // ELSE:

    const content = this._node.getPreparedChildren(this._contentFlow);
    this._debug._ && console.groupCollapsed('%c🚸 children(contentFlow)', CONSOLE_CSS_LABEL_PAGES);
    this._debug._ && console.log(content);
    this._debug._ && console.groupEnd('%c🚸 children(contentFlow)', CONSOLE_CSS_LABEL_PAGES);

    this._parseNodes({
      // don't register the parent here,
      // only on inner nodes that do not split
      array: content
    });

  }

  _registerPageStart(pageStart, improveResult = false) {
    this._debug._registerPageStart && console.log(
      `%c📍`, "background:yellow;font-weight:bold",
      '\n  improveResult:', improveResult,
      '\n  passed pageStart:', pageStart,
    );

    // Improving the result should also be skipped, as we would have to look for
    // a variant before the already registered page.
    if (this._node.isPageStartElement(pageStart)) return;

    if (improveResult) {
      pageStart = this._node.findBetterPageStart(
        pageStart,
        this.pages.at(-1)?.pageStart,
        this._root
      )
    }

    if (!this._DOM.getElementOffsetParent(pageStart)) {
      this._debug._registerPageStart && console.warn(
        '🚨 pageStart has no offsetParent. Check the caller.',
        pageStart,
      );
    }

    const pageTop = this._node.getTopForPageStartCandidate(pageStart, this._root);
    const pageBottom = pageTop + this._referenceHeight;
    this.pages.push({
      pageStart: pageStart,
      pageBottom: pageBottom,
    });
    this._node.markPageStartElement(pageStart, this.pages.length);
    this._debug._registerPageStart && console.log(
      `%c📍register page ${this.pages.length}`, "background:yellow;font-weight:bold",
      '\n  improved result:', improveResult,
      '\n  pageTop:', pageTop,
      '\n  pageBottom:', pageBottom,
      '\n  pageStart:',pageStart,
    );
  }

  _parseNodes({
    array,
    previous,
    next,
    parent,
    parentBottom,
  }) {
    this._debug._parseNodes && console.log(
      '🔵 _parseNodes',
      '\narray:', [...array],
      '\nparent:', parent
    );

    for (let i = 0; i < array.length; i++) {
      const currentElement = array[i];
      const isFirstChild = i === 0;
      const isLastChild = i === array.length - 1;
      const lastChildParentBottom = isLastChild ? parentBottom : undefined;
      const usesParentContext = Boolean(parent) && (isFirstChild || Boolean(lastChildParentBottom));
      // * First and last children inherit the parent as the page anchor when possible
      const tracedParent = usesParentContext ? parent : currentElement;
      const parentForNode = usesParentContext ? parent : undefined;
      // * tracedParent is what the next recursion level will treat as its parent.
      this._parseNode({
        previousElement: array[i - 1] || previous,
        currentElement,
        nextElement: array[i + 1] || next,
        isFirstChild,
        isLastChild,
        parent: parentForNode, // provided only for boundary children where the wrapper matters
        tracedParent,
        // *** If the parent item has a bottom margin, we must consider it
        // *** when deciding on the last child.
        // *** Otherwise, this margin may be lost
        // *** and not counted in the calculation of the next page height,
        // *** causing blank unaccounted pages.
        // *** So, for the last child:
        parentBottom: lastChildParentBottom,
      });
    }
  }

  // 📍
  _parseNode({
    isFirstChild,
    isLastChild,
    previousElement,
    currentElement,
    nextElement,
    parent,
    // parent is provided only for first/last children so boundary logic can inspect the wrapper
    // tracedParent may override it when propagating the context to descendants
    tracedParent,
    // *** for the last child:
    parentBottom,
  }) {
    const consoleMark = ['%c[_parseNode]\n', 'color:white;',]

    this._debug._parseNode && console.group(
      `%c_parseNode`, CONSOLE_CSS_PRIMARY_PAGES,
      `${isFirstChild ? '★ [[[first ★' : isLastChild ? '★ last]]] ★' : '<- regular ->'}`,
      '📄', this.pages.length,
        { currentElement },
      );

    this._debug._parseNode && console.log(
      {
        previousElement,
        currentElement,
        nextElement,
        isFirstChild,
        isLastChild,
        parent,
        tracedParent,
        parentBottom,
      }
      );

    // THE END of content flow:
    // if there is no next element, then we are in a case
    // where the 'html2pdf-content-flow-end' element is current.
    if (!nextElement) {
      this._node.markProcessed(currentElement, 'content-flow-end');
      this._debug._parseNode && console.log('%c END _parseNode (!nextElement)', CONSOLE_CSS_END_LABEL);
      this._debug._parseNode && console.groupEnd()
      return
    }

    let newPageBottom = this.pages.at(-1).pageBottom;
    const refreshPageBottom = () => {
      // * registerPageStart may refine the anchor and append a new page while we
      // * remain inside this _parseNode call. Refresh the cached bottom so later
      // * checks use the coordinates of the newly started page.
      if (newPageBottom !== this.pages.at(-1).pageBottom) {
        this._debug._parseNode && console.log(`🔄 refreshPageBottom to ${this.pages.at(-1).pageBottom}`);
      }
      newPageBottom = this.pages.at(-1).pageBottom;
    };
    const registerPageStart = (element, improveResult = false) => {
      this._registerPageStart(element, improveResult);
      refreshPageBottom();
    };
    const currentElementBottom = this._node.getBottomWithMargin(currentElement, this._root);

    // * We want to keep the passed 'parentBottom' value so that we can pass it
    // * on to the next step in the loop if necessary, even if we have to change
    // * this in the current step to handle edge cases.
    const baseBlockBottom = parentBottom || currentElementBottom;
    let currentParentBottom = parentBottom;

    // * If there is a parentBottom - we are dealing with the last child of the last child
    // * (have after the current element the lower edges of one or more of its parents).
    // * Consider the case of extreme design:
    // * if the custom design shifts parentBottom down a lot because of padding or margins or similar.
    // * Then let's check where the bottom edge of the current element is.
    // * If currentElementBottom is lower than “start of new page” (currentElementBottom > newPageBottom) -
    // * this case is handled further, with an attempt to split the current element.
    // * But if it is higher (currentElementBottom <= newPageBottom) - we won't try to split it lower in the algorithm.
    // * And the space is occupied by something between the current element and the lower bounds of its parents.
    // * And this “something” we don't know - we only know the lower bounds of some nested elements.
    // ** Let's try to insert a page break between the bottom borders of the parents.
    // ** Also check - if the distance between the bottom border of the current and its parent is
    // ** 1) greater than 1 page,
    // ** 2) has no break point (something solid)
    // ** - we'll describe it as an unsolved issue for now.

    const currentElementTop = this._node.getTop(currentElement, this._root);

    // Tail exists only if the space between the current element’s bottom and its parent’s bottom
    // exceeds a full page (i.e., the tail of wrappers below the current element is longer than a page).
    // Using `top` here misclassifies long elements as a tail; rely on `currentElementBottom` instead.
    const _isTailLongerThanPage = parentBottom && ((parentBottom - currentElementBottom) >= this._referenceHeight);
    if (parentBottom && _isTailLongerThanPage) {
      // ** if parentBottom ---> current is LAST
      // ** if parentBottom > (currentElementTop + this._referenceHeight) ---> we have a “tail” of the lower bounds of the parent tags,
      // * and there are obviously set margins or paddings that take up space.
      // * And now the only case where we can insert a page break between these boundaries
      // * (register a break after an element without having the next one).
      // * To do this, we will have to insert a service element after the desired parent element
      // * and assign the service element as the “start of the page”.

      currentParentBottom = undefined;

      this._debug._parseNode && console.log(
        '🪁 Tail: We got a tail from the lower shells of the last child. Giving up our “last child” rule here and will try to insert a page break at the end of some parent. ',
        {parentBottom, currentParentBottom,  currentElementBottom, newPageBottom,},
        {currentElement, parent},
      );

      if (currentElementBottom <= newPageBottom) {
        this._debug._parseNode && console.log('🪁 Tail: currentElementBottom <= newPageBottom', );



        // * try to insert a page break between the bottom borders of the parents.

        const _parents = [];
        let _el = currentElement;

        this._debug._parseNode && console.log('🪁 Tail: currentElement', currentElement);

        while (_el && _el !== parent) {
          _parents.push({
            element: _el,
            bottom: this._node.getBottomWithMargin(_el, this._root)
          });
          _el = _el.parentElement;
        }

        if (_el === parent) {
          _parents.push({
            element: parent,
            bottom: parentBottom
          });
        } else {
          throw new Error("parent not found in the ancestor chain");
        }

        this._debug._parseNode && console.log('🪁 Tail: _parents', _parents);

        // We start checking the current page. But if this “tail” is longer than the page,
        // we may need to break it more than once.
        // In that case, we will increase this parameter within the parent loop:
        let _currentPageBottom = newPageBottom;

        this._debug._parseNode && console.log('🪁 Tail: _currentPageBottom = newPageBottom', _currentPageBottom);

        for (let i = 0; i < _parents.length; i++) {
            this._debug._parseNode && console.log('🪁 Tail: _parents[i].bottom', _parents[i].bottom, _parents[i].element);

          // We go down, that is, we assume that the previous element has been validated and fits in the page.
          // The very first one is the current one, and it fits.
          // If the i-th parent doesn't fit - we insert a page break after its last child (as its last child).
          if (_parents[i].bottom > _currentPageBottom) {
            this._debug._parseNode && console.log('🪁 Tail: _parents[i].bottom > _currentPageBottom', _parents[i].bottom, '>', _currentPageBottom, _parents[i].element);

            const _newPageStarter = this._node.createNeutral();
            _newPageStarter.classList.add('service');
            this._DOM.insertAtEnd(_parents[i].element, _newPageStarter);
            registerPageStart(_newPageStarter); // do not do PageStart improvement
            this._debug._parseNode && console.log('_registerPageStart', _newPageStarter);
            this._node.markProcessed(_newPageStarter, 'node is ForcedPageBreak');

            const justUpdatedPageBottom = this.pages.at(-1).pageBottom;

            // check if here is more then 1 split
            // this._node.getTopForPageStartCandidate(pageStart, this._root) + this._referenceHeight

            this._debug._parseNode && console.log(_currentPageBottom, justUpdatedPageBottom, parentBottom);

            if (parentBottom > justUpdatedPageBottom) {
              this._debug._ && console.log('🧧 • parentBottom > justUpdatedPageBottom');
              _currentPageBottom = justUpdatedPageBottom;
              this._debug._parseNode && console.log('new _currentPageBottom', _currentPageBottom);
              // and go to next index
            } else {
              // stop iterating
              this._debug._parseNode && console.log('%c END _parseNode (bottom Tail of parents)', CONSOLE_CSS_END_LABEL);
              this._debug._parseNode && console.groupEnd();
              return
            }

          }
        }

        this._debug._parseNode && console.log('%c END _parseNode (bottom Tail of parents)', CONSOLE_CSS_END_LABEL);
        this._debug._parseNode && console.groupEnd();
        return

      } else {
        // At this point the parent chain forms a tail, but the current element itself still
        // stretches below the page cut. We cannot resolve the tail until the element fits, so
        // control falls through to the generic overflow logic below.
        this._debug._parseNode && console.log('🪁 Tail: currentElementBottom > newPageBottom', 'DOING NOTHING' );
      }
    }

    // * Case after the next element has been registered
    // * and we are looking at it again
    // * (e.g. it is the height of the entire next page and falls under inspection).
    const currentBlockBottom = currentParentBottom || currentElementBottom;
    if (
      // * already registered:
      this.pages.at(-1).pageStart === currentElement
      &&
      // * fits in the next page:
      (
        this._node.isNoBreak(currentElement)
        || currentBlockBottom <= newPageBottom
      )
    ) {
      this._node.markProcessed(currentElement, 'node is already registered and fits in the page');
      this._debug._parseNode && console.log('%c END _parseNode (node is already registered and fits in the next page)', CONSOLE_CSS_END_LABEL);
      this._debug._parseNode && console.groupEnd();
      return
    }

    // * Edge case, where we jumped through the check of the Previous or Parent (for example, in the tail case,
    // * going upward in search of a better page start), and the Current is already below the page limit.
    // * We need to check to make sure the Current one isn't compromised - or we should go back an element.
    // ** The >= condition works for any elements except ones that have no height (and should not produce new pages).
    // ** So let's add a height condition: (currentElementBottom - currentElementTop)

    if ((currentElementTop >= newPageBottom) && (currentElementBottom - currentElementTop)) {
      const canUseParentTop = isFirstChild && Boolean(parent);
      const parentTop = canUseParentTop ? this._node.getTopForPageStartCandidate(parent, this._root) : undefined;
      const beginningTail = Boolean(parentTop) && (currentElementTop - parentTop >= this._referenceHeight);

      if (beginningTail) {
        // The parent wrapper already spans more than a page above the current element.
        // Keep the element as the page-start anchor without climbing to the parent: the
        // tail will be handled by downstream logic once the element fits on the new page.
        this._debug._parseNode && console.log(
          '🪁 beginning Tail',
          {parentTop, currentParentBottom, currentElementTop, newPageBottom,},
          {currentElement, parent},
        );
      } else {
        // * No beginningTail:
        // most often the element is simply overflowed or wrapped in a thin
        // inline/contents container. Try to register the element (with semantic improvement)
        // so that findBetterPageStart can climb to a stable wrapper if needed.

        // * Thin wrappers (e.g. inline or contents containers)
        // contribute almost no intrinsic height: their children carry the layout box.
        // Once such a wrapper crosses the page boundary, repeating the tail logic on it
        // only triggers the “improve page start” flow again and produces duplicate breaks
        // (StrictDoc "Image in autogen >.document@ case).
        // Block wrappers, on the other hand, still need the tail loop.
        // To differentiate, look at the computed display; inline/contents are treated
        // as thin wrappers, block-level displays continue with the original flow.
        const currentDisplay = this._DOM.getComputedStyle(currentElement)?.display || '';
        const isInlineWrapper = currentDisplay.includes('inline');
        const isContentsWrapper = currentDisplay === 'contents';
        if (isInlineWrapper || isContentsWrapper) {
          this._debug._parseNode && console.log('🧅 current in thin wrapper');
          registerPageStart(currentElement, true);
          this._debug._parseNode && console.log('%c END _parseNode (registered new page start)', CONSOLE_CSS_END_LABEL);
          this._debug._parseNode && console.groupEnd();
          return
        }
      }

      registerPageStart(currentElement, !beginningTail);
    }

    // FORCED BREAK
    if (this._node.isForcedPageBreak(currentElement)) {
      // TODO I've replaced the 'next' with the 'current' - need to test it out
      registerPageStart(currentElement);
      this._node.markProcessed(currentElement, 'node is ForcedPageBreak');
      this._debug._parseNode && console.log('%c END _parseNode (isForcedPageBreak)', CONSOLE_CSS_END_LABEL);
      this._debug._parseNode && console.groupEnd();
      return
    }

    this._debug._
      && console.assert( // is filtered in the function _gerChildren()
      this._DOM.getElementOffsetParent(currentElement),
      'it is expected that the element has an offset parent',
      currentElement);

    const nextElementTop = this._node.getTop(nextElement, this._root);
    this._debug._parseNode && console.log(...consoleMark,
      '• newPageBottom', newPageBottom,
      '\n',
      '• nextElementTop',nextElementTop,
      );

    // TODO if next elem is SVG it has no offset Top!

    if (nextElementTop <= newPageBottom) {
      this._debug._parseNode && console.log(
        'nextElementTop <= newPageBottom', nextElementTop, '<=', newPageBottom
      )
      // * IF: nextElementTop <= newPageBottom,
      // * then currentElement fits.

      this._node.markProcessed(currentElement, 'node fits');

      // ** Check for page break markers inside.
      // ** If there are - register new page starts.
      this._node.findAllForcedPageBreakInside(currentElement).forEach(
        element => {
          this._node.markProcessed(element, 'node is ForcedPageBreak (inside a node that fits)');
          registerPageStart(element);
        }
      );
      // TODO: это может быть внутри таблицы или другого элемента,
      // который мы не хотим / не можем разбить обычным образом!
      // Нужно проверять currentElement

      // * ... then continue.

      this._debug._parseNode && console.log('%c END _parseNode (node pass)', CONSOLE_CSS_END_LABEL);
      this._debug._parseNode && console.groupEnd();
      return

    } else {
      this._debug._parseNode && console.log(
        'nextElementTop > newPageBottom', nextElementTop, '>', newPageBottom
      )
      // * ELSE IF: nextElementTop > newPageBottom,
      // * nextElement does not start on the current page.
      // * Possible cases for the currentElement:
      // *** (1) is fit in one piece on the current page
      // *** (0) in one piece should be moved to the next page
      // *** (2) must be split

      // IF currentElement does fit
      // in the remaining space on the page,
      if (currentBlockBottom <= newPageBottom) {
        this._debug._parseNode && console.log(
          'currentBlockBottom <= newPageBottom', currentBlockBottom, '<=', newPageBottom,
          '\n register nextElement as pageStart'
        );
        // we need <= because split elements often get equal height // todo comment

        // ? The currentElement has a chance to be the last one on the page.
        if (this._node.isNoHanging(currentElement)) {
          this._debug._parseNode && console.log(
            'currentElement fits / last, and _isNoHanging => move it to the next page'
          )
          // ** if currentElement can't be the last element on the page,
          // ** immediately move it to the next page:
          this._node.markProcessed(currentElement, 'it fits & last & _isNoHanging => move it to the next page');
          registerPageStart(currentElement, true);

          this._debug._parseNode && console.log('%c END _parseNode (isNoHanging)', CONSOLE_CSS_END_LABEL);
          this._debug._parseNode && console.groupEnd();
          return
        }

        // * AND it's being fulfilled:
        // *** nextElementTop > newPageBottom
        // * so this element cannot be the first child,
        // * because the previous element surely ends before this one begins,
        // * and so is its previous neighbor, not its parent.
        registerPageStart(nextElement);
        this._node.markProcessed(currentElement, `fits, its bottom falls exactly on the cut`);
        this._node.markProcessed(nextElement, `starts new page, its top is exactly on the cut`);
        this._debug._parseNode && console.log('%c END _parseNode (currentElement fits, register the next element)', CONSOLE_CSS_END_LABEL);
        this._debug._parseNode && console.groupEnd();
        return
      }

      // * Check the possibility of (0)

      // TODO перемещаем ниже отсюда кейс "Проверка на isNoHanging(currentElement)"" - это нужно тестировать!

      // * Check the possibility of (1) or (0): on current or next page in one piece?

      // IMAGE with optional resizing
      // TODO float images

      const mediaElement = this._node.resolveReplacedElement(currentElement, { prefer: 'first' });

      if (mediaElement) {

        // TODO needs testing

        // svg has not offset props
        const isSvgMedia = this._node.isSVG(mediaElement);
        const currentImage = isSvgMedia
        // TODO replace with setFlag... and remove wrapper function
        // TODO process at the beginning, find all SVG and set Flag
          ? this._node.createSignpost(mediaElement)
          : mediaElement;

        const currentImageTop = this._node.getTop(currentImage, this._root);
        const parentTopForImage = (isFirstChild && parent)
          ? this._node.getTop(parent, this._root)
          : undefined;

        // include the wrapper's top margin only for the first child; otherwise
        // measure from the current image top.
        let availableImageNodeSpace = newPageBottom - (parentTopForImage ?? currentImageTop);
        // if parentBottom: the node is last,
        // so let's subtract the probable margins at the bottom of the node,
        // which take away the available space for image-node placement:
        availableImageNodeSpace -= (
           parentBottom
            ? (parentBottom - this._node.getBottom(currentImage, this._root))
            : 0
        );
        // if parent: the node is first,
        // so let's include the parent's top margins:
        let fullPageImageNodeSpace = this._referenceHeight - (
           parentTopForImage !== undefined
            ? (currentImageTop - parentTopForImage)
            : 0
        );
        // TODO: replace this._referenceWidth  with an padding/margin-dependent value

        const currentImageHeight = this._DOM.getElementOffsetHeight(currentImage);
        const currentImageWidth = this._DOM.getElementOffsetWidth(currentImage);

        this._debug._parseNode && console.log(
          '🖼️🖼️🖼️🖼️🖼️🖼️\n',
          `H-space: ${availableImageNodeSpace}, image Height: ${currentImageHeight}, image Width: ${currentImageWidth}`,
          currentElement,
          '\n parent', parent,
          'parentBottom', parentBottom,
          'currentParentBottom', currentParentBottom,
        );

        // TODO !!! page width overflow for SVG
        if (currentImageWidth > this._referenceWidth) {
          // just leave it on the current page
          this._debug._parseNode && console.warn('%c IMAGE is too wide', 'color: red');
        }

        // if it fits
        if (currentImageHeight < availableImageNodeSpace) {
          // just leave it on the current page
          this._node.markProcessed(currentElement, 'IMG that fits, and next starts on next');
          registerPageStart(nextElement);
          this._debug._parseNode && console.log('Register next elements; 🖼️🖼️🖼️ IMG fits:', currentElement);
          this._debug._parseNode && console.log('%c END _parseNode 🖼️ IMG fits', CONSOLE_CSS_END_LABEL);
          this._debug._parseNode && console.groupEnd();
          return
        }

        // if not, try to fit it
        const ratio = availableImageNodeSpace / currentImageHeight;

        if (ratio > this._imageReductionRatio) {
          this._debug._parseNode && console.log('Register next elements; 🖼️🖼️🖼️ IMG RESIZE to availableImageNodeSpace:', availableImageNodeSpace, currentElement);
          this._node.markProcessed(currentElement, `IMG with ratio ${ratio}, and next starts on next`);
          // reduce it a bit
          this._node.fitElementWithinBoundaries({
            element: mediaElement,
            height: currentImageHeight,
            width: currentImageWidth,
            vspace: availableImageNodeSpace,
            hspace: this._referenceWidth
          });
          // and leave it on the current page
          registerPageStart(nextElement);
          this._debug._parseNode && console.log('%c END _parseNode 🖼️ IMG scaled', CONSOLE_CSS_END_LABEL);
          this._debug._parseNode && console.groupEnd();
          return
        }

        // otherwise move it to next page,
        // *** 'true':
        // *** add the possibility of moving it with the wrap tag
        // *** if it's the first child
        this._node.markProcessed(currentElement, `IMG starts on next`);
        const pageStartElement = isSvgMedia ? currentImage : mediaElement;
        registerPageStart(pageStartElement, true);
        this._debug._parseNode && console.log('🖼️ register Page Start', currentElement);
        // and avoid page overflow if the picture is too big to fit on the page as a whole
        if (currentImageHeight > fullPageImageNodeSpace) {
          this._node.fitElementWithinBoundaries({
            element: mediaElement,
            height: currentImageHeight,
            width: currentImageWidth,
            vspace: fullPageImageNodeSpace,
            hspace: this._referenceWidth
          });
          this._node.markProcessed(currentElement, `IMG starts on next and resized`);
          this._debug._parseNode && console.log('🖼️ ..and fit it to full page', currentElement);
        }
        this._debug._parseNode && console.log('%c END', CONSOLE_CSS_END_LABEL);
        this._debug._parseNode && console.groupEnd();
        return
      }

      // ... in case nextElementTop > newPageBottom
      if(currentElement.style.height) {
        // TODO: create test
        this._debug._parseNode && console.log(
          '🥁 currentElement has HEIGHT', currentElement.style.height
        );
        // * If a node has its height set with styles, we handle it as a non-breaking object,
        // * and can just scale it if it doesn't fit on the page.

        const availableSpace = newPageBottom - currentElementTop;
        const currentElementContextualHeight = nextElementTop - currentElementTop;

        const availableSpaceFactor = availableSpace / currentElementContextualHeight;
        const fullPageFactor = this._referenceHeight / currentElementContextualHeight;

        this._debug._parseNode && console.log(
          '\n🥁 currentElementTop', currentElementTop,
          '\n🥁 newPageBottom', newPageBottom,
          '\n🥁 availableSpace', availableSpace,
          '\n🥁 currentElementContextualHeight', currentElementContextualHeight,
          '\n🥁 availableSpaceFactor', availableSpaceFactor,
          '\n🥁 fullPageFactor', fullPageFactor,
        );

        this._debug._parseNode && console.assert(availableSpaceFactor < 1);

        // Try to fit currentElement into the remaining space
        // on the current(last) page (availableSpace).
        if(availableSpaceFactor > 0.8) {
          this._debug._parseNode && console.log(
            '🥁 availableSpaceFactor > 0.8: ', availableSpaceFactor
          );
          // If, in order for it to fit, it needs to be scaled by no more than 20%,
          // we can afford to scale:
          this._DOM.setStyles(currentElement, {
            'transform': `scale(${availableSpaceFactor})`,
            'transform-origin': `top center`,
          });
          // and start a new page with the next element:
          registerPageStart(nextElement);
          this._node.markProcessed(currentElement, `processed as a image, has been scaled down within 20%, the next one starts a new page`);
          this._node.markProcessed(nextElement, `the previous one was scaled down within 20%, and this one starts a new page.`);
          this._debug._parseNode && console.log('%c END _parseNode (has height & scale)', CONSOLE_CSS_END_LABEL);
          this._debug._parseNode && console.groupEnd();
          return
        }

        // Otherwise the element will be placed on the next page.
        // And now we'll scale it anyway if it doesn't fit in its entirety.

        if(fullPageFactor < 1) {
          this._debug._parseNode && console.log(
            '🥁 fullPageFactor < 1: ', fullPageFactor
          );
          this._node.markProcessed(currentElement, `processed as a image, has been scaled down, and starts new page`);
          this._DOM.setStyles(currentElement, {
            'transform': `scale(${fullPageFactor})`,
            'transform-origin': `top center`,
          });
        }

        this._debug._parseNode && console.log(
          '🥁 _registerPageStart', currentElement
        );
        registerPageStart(currentElement, true);
        this._node.markProcessed(currentElement, `processed as a image, starts new page`);
        this._debug._parseNode && console.log('%c END _parseNode (has height & put on next page)', CONSOLE_CSS_END_LABEL);
        this._debug._parseNode && console.groupEnd();
        return
      }

      // * Check the possibility of (1) or (2): split or not?

      this._debug._parseNode && console.log(
        'split or not? \n',
        'currentBlockBottom', currentBlockBottom
      );

      //// MOVE UP:
      //// IF currentElement does fit
      //// in the remaining space on the page,

      this._debug._parseNode && console.log(
        'currentParentBottom || currentElementBottom',
        {currentParentBottom, currentElementBottom},
        'currentBlockBottom > newPageBottom', currentBlockBottom, '>', newPageBottom
      );

      // TODO TEST ME: #fewLines
      if (this._DOM.getElementOffsetHeight(currentElement) < this._minimumBreakableHeight) {
        registerPageStart(currentElement, true);
        this._node.markProcessed(currentElement, `starts new page, #fewLines`);
        this._debug._parseNode && console.log('%c END _parseNode #fewLines', CONSOLE_CSS_END_LABEL);
        this._debug._parseNode && console.groupEnd();
        return
      }

      // otherwise try to break it and loop the children:
      const children = this._node.getSplitChildren(currentElement, newPageBottom, this._referenceHeight, this._root);
      this._debug._parseNode && console.log(
        'try to break it and loop the children:', children
      );

      // **
      // * The children are processed.
      // * Depending on the number of children:

      const childrenNumber = children.length;

      // * Parse children:
      if (childrenNumber) {
        // * In a fully split node, or in a node that has received the 'slough' attribute,
        // * children replace it.
        // * So we don't take into account the last child bottom margins (parentBottom).
        const isFullySPlittedParent = this._node.isFullySPlitted(currentElement) || this._node.isSlough(currentElement);
        // * Process children if exist:

        this._debug._parseNode && console.log({isFullySPlittedParent, parent, tracedParent,})
        this._parseNodes({
          array: children,
          previous: previousElement,
          next: nextElement,
          // * Pass tracedParent downstream so children inherit the updated anchor
          // * unless the current node became fully split (then the context resets).
          parent: isFullySPlittedParent ? undefined : tracedParent,
          // * baseBlockBottom keeps the bottom boundary we must preserve when descending into children:
          // * last-child nodes reuse their parent’s bottom margin, otherwise we fall back
          // * to the element’s own bottom. If the parent gets fully split, the boundary resets
          // * so the children recompute theirs.
          parentBottom: isFullySPlittedParent ? undefined : baseBlockBottom,
        });
        this._node.markProcessed(currentElement, `getSplitChildren and _parseNodes`);
      } else {
        // * If no children,
        // * move element to the next page.
        // ** But,

        this._debug._parseNode && console.log(
          ...consoleMark,
          '_registerPageStart (from _parseNode): \n',
          currentElement
        );
        registerPageStart(currentElement, true);
        this._node.markProcessed(currentElement, `doesn't fit, has no children, register it or parents`);
      }
    }

    this._debug._parseNode && console.log(`%c END _parseNode [•••]`, CONSOLE_CSS_END_LABEL, { currentElement });
    this._debug._parseNode && console.groupEnd();
  }

}
