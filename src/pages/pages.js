import arrayFromString from './arrayFromString';

const CONSOLE_CSS_COLOR_PAGES = '#66CC00';
const CONSOLE_CSS_PRIMARY_PAGES = `color: ${CONSOLE_CSS_COLOR_PAGES};font-weight:bold`;
const CONSOLE_CSS_LABEL_PAGES = `border:1px solid ${CONSOLE_CSS_COLOR_PAGES};`
                              + `background:#EEEEEE;`
                              + `color:${CONSOLE_CSS_COLOR_PAGES};`

const CONSOLE_CSS_END_LABEL = `background:#999;color:#FFF;padding: 0 4px;`;

// SEE splitByWordsGreedyWithSpacesFilter(node) in DOM
const WORD_JOINER = '';

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
    this._debugMode = config.debugMode;
    this._debugToggler = {
      _parseNode: true,
      _parseNodes: true,
      _registerPageStart: true,
      _getProcessedChildren: true,
      _splitPreNode: true,
      _splitTableNode: true,
      _splitTableRow: true,
      _splitGridNode: true,
      _createSlicesBySplitFlag: true,
      _getInternalSplitters: true,
      _splitComplexTextBlockIntoLines: true,
    }

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
    this._minLeftRows = 2;
    this._minDanglingRows = 2;
    this._minBreakableRows = this._minLeftRows + this._minDanglingRows;
    // Code:
    this._minPreFirstBlockLines = 3;
    this._minPreLastBlockLines = 3;
    this._minPreBreakableLines = this._minPreFirstBlockLines + this._minPreLastBlockLines;
    // Grid:
    this._minBreakableGridRows = 4;

    this._imageReductionRatio = 0.8;

    // TODO move to config
    this._signpostHeight = 24;

    this._commonLineHeight = this._node.getLineHeight(this._root);
    this._minimumBreakableHeight = this._commonLineHeight * this._minBreakableLines;

    // https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browsers
    // Firefox 1.0+
    // https://bugzilla.mozilla.org/show_bug.cgi?id=820891
    // * Reason: caption is considered as an external element
    // * and is not taken into account in calculation
    // * of offset parameters of table rows.
    this._isFirefox = typeof InstallTrigger !== 'undefined';

    // * Public

    this.pages = [];
  }

  calculate() {
    this._node.init();

    this._prepareForcedPageBreakElements();
    this._prepareNoBreakElements();
    this._prepareNoHangingElements();
    this._calculate();
    this._debugMode && console.log('%c ✔ Pages.calculate()', CONSOLE_CSS_LABEL_PAGES, this.pages);

    return this.pages;
  }

  _prepareNoHangingElements() {
    if (this._noHangingSelectors.length) {
      const elements = this._node.getAll(this._noHangingSelectors, this._contentFlow);
      elements.forEach(element => {
        this._node.setFlagNoHanging(element);
        const lastChildParent = this._node.findLastChildParent(element, this._contentFlow)
        if (lastChildParent) {
          this._node.setFlagNoHanging(lastChildParent);
        }
      });
    }
  }

  _prepareNoBreakElements() {
    if (this._noBreakSelectors.length) {
      const elements = this._node.getAll(this._noBreakSelectors, this._contentFlow);
      elements.forEach(element => this._node.setFlagNoBreak(element));
    }
  }

  _prepareForcedPageBreakElements() {
    const pageStarters = this._pageBreakBeforeSelectors.length
                       ? this._node.getAll(this._pageBreakBeforeSelectors, this._contentFlow)
                       : [];
    const pageEnders = this._pageBreakAfterSelectors.length
                     ? this._node.getAll(this._pageBreakAfterSelectors, this._contentFlow)
                     : [];
    // there's at least one element:
    const forcedPageStarters = this._node.getAll(this._forcedPageBreakSelectors, this._contentFlow);

    // ** If the element is the FIRST child of nested FIRST children of a content flow,
    // ** we do not process it further for page breaks.
    // ** This ensures that page breaks are only made where they have not already been made for other reasons.
    if (this._node.isFirstChildOfFirstChild(pageStarters[0], this._contentFlow)) {
      pageStarters.shift()
    };
    // ** If the element is the LAST child of nested LAST children of a content flow,
    // ** we do not process it further for page breaks.
    // ** This ensures that page breaks are only made where they have not already been made for other reasons.
    if (this._node.isLastChildOfLastChild(pageEnders.at(-1), this._contentFlow)) {
      pageEnders.pop()
    };

    // * find all relevant elements and insert forced page break markers before them.
    pageStarters.length && pageStarters.forEach(element => {
      const firstChildParent = this._node.findFirstChildParent(element, this._contentFlow);
      if (firstChildParent) {
        element = firstChildParent;
      };
      this._node.insertForcedPageBreakBefore(element);
    });

    // * find all relevant elements and insert forced page break markers before them.
    forcedPageStarters && forcedPageStarters.forEach(element => {
      const firstChildParent = this._node.findFirstChildParent(element, this._contentFlow)
      if (firstChildParent) {
        element = firstChildParent;
      }
      this._node.insertForcedPageBreakBefore(element);
    });

    // * find all relevant elements and insert forced page break markers after them.
    pageEnders.length && pageEnders.forEach(element => {
      const lastChildParent = this._node.findLastChildParent(element, this._contentFlow)
      if (lastChildParent) {
        element = lastChildParent;
      }
      // If there are AFTER and BEFORE breaks - insert only one.
      if (!this._node.isForcedPageBreak(element.nextElementSibling)) {
        this._node.insertForcedPageBreakAfter(element);
      } // else pass
    });

  }

  _calculate() {

    this._debugMode && console.groupCollapsed('•• init data ••');
    this._debugMode && console.log(
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
      '\n',
      'isFirefox', this._isFirefox,
    );
    this._debugMode && console.groupEnd('•• init data ••');

    // * add a safeguard elements to the start and end of content flow,
    const {contentFlowStart, contentFlowEnd} = this._node.addContentFlowStartAndEnd(this._contentFlow);
    // register a FIRST page
    this._registerPageStart(contentFlowStart);

    // IF contentFlow is less than one page,

    if (this._node.getBottomWithMargin(this._contentFlow, this._root) < this._referenceHeight) {
      // In the case of a single page,
      // we don't examine the contentFlow children.

      // Check for forced page breaks, and if they are, we register these pages.
      // If not - we'll have a single page.
      this._node.findAllForcedPageBreakInside(this._contentFlow).forEach(
        element => this._registerPageStart(element)
      );

      return;
    }

    // ELSE:

    const content = this._getChildren(this._contentFlow);
    this._debugMode && console.groupCollapsed('%c🚸 children(contentFlow)', CONSOLE_CSS_LABEL_PAGES);
    this._debugMode && console.log(content);
    this._debugMode && console.groupEnd('%c🚸 children(contentFlow)', CONSOLE_CSS_LABEL_PAGES);

    this._parseNodes({
      // don't register the parent here,
      // only on inner nodes that do not split
      array: content
    });

  }

  _registerPageStart(pageStart, improveResult = false) {
    if (improveResult) {
      const firstChildParent = this._node.findFirstChildParent(pageStart, this._contentFlow);
      pageStart = firstChildParent || pageStart;

      const previousCandidate = this._node.findPreviousNoHangingsFromPage(
        pageStart,
        // * limited to the element from which the last registered page starts:
        this._node.getTop(this.pages.at(-1)?.pageStart, this._root),
        this._root
      );
      pageStart = previousCandidate || pageStart;
    }

    const pageBottom = this._node.getTopWithMargin(pageStart, this._root) + this._referenceHeight;
    this.pages.push({
      pageStart: pageStart,
      pageBottom: pageBottom,
    });
    this._node.markPageStartElement(pageStart, this.pages.length);
    this._debugMode && this._debugToggler._registerPageStart && console.log(
      `📍 %c register page ${this.pages.length} \n`, "background:yellow; color:red",
      pageBottom, pageStart,
    )
  }

  _parseNodes({
    array,
    previous,
    next,
    parent,
    parentBottom,
  }) {
    this._debugMode && this._debugToggler._parseNodes && console.log(
      '🔵 _parseNodes',
      '\narray:', [...array],
      '\ntracedParent:', parent
    );

    for (let i = 0; i < array.length; i++) {
      this._parseNode({
        previousElement: array[i - 1] || previous,
        currentElement: array[i],
        nextElement: array[i + 1] || next,
        isCurrentFirst: (i == 0 && !array[i - 1]),
        parent,
        // *** If the parent item has a bottom margin, we must consider it
        // *** when deciding on the last child.
        // *** Otherwise, this margin may be lost
        // *** and not counted in the calculation of the next page height,
        // *** causing blank unaccounted pages.
        // *** So, for the last child:
        parentBottom: (i === array.length - 1) ? parentBottom : undefined,
      });
    }
  }

  // 📍
  _parseNode({
    isCurrentFirst,
    previousElement,
    currentElement,
    nextElement,
    parent,
    // *** for the last child:
    parentBottom,
  }) {
    const consoleMark = ['%c_parseNode\n', 'color:white',]

    this._debugMode && this._debugToggler._parseNode && console.group(
      `%c_parseNode`, CONSOLE_CSS_PRIMARY_PAGES,
      `${parentBottom ? '★last★' : ''}`
      );

    this._debugMode && this._debugToggler._parseNode && console.log(
      ...consoleMark,
      '3 nodes: ',
      {
        previousElement,
        currentElement,
        nextElement,
      },
      '\n',
      '\ncurrent: ', currentElement,
      '\nparent: ', parent,
      '\nisCurrentFirst: ', isCurrentFirst,
      );

    // TODO #tracedParent
    // * If we want to start a new page from the current node,
    // * which is the first child (i == 0),
    // * we want to register its parent as the start of the page.
    //// const currentOrParentElement = (isCurrentFirst && parent) ? parent : currentElement;

    this._debugMode && this._debugToggler._parseNode && console.log(
      ...consoleMark,
      'parent:', parent,
      '\n',
      'parentBottom:', parentBottom,
      '\n',
      'isCurrentFirst:', isCurrentFirst,
      '\n',
      'parent:', parent,
      '\n'
    );

    // THE END of content flow:
    // if there is no next element, then we are in a case
    // where the 'html2pdf-content-flow-end' element is current.
    if (!nextElement) {
      this._debugMode && this._debugToggler._parseNode && console.log('%c END _parseNode (!nextElement)', CONSOLE_CSS_END_LABEL);
      this._debugMode && this._debugToggler._parseNode && console.groupEnd()
      return
    }

    // FORCED BREAK
    if (this._node.isForcedPageBreak(currentElement)) {
      // TODO I've replaced the 'next' with the 'current' - need to test it out
      this._registerPageStart(currentElement)
      this._debugMode && this._debugToggler._parseNode && console.log('%c END _parseNode (isForcedPageBreak)', CONSOLE_CSS_END_LABEL);
      this._debugMode && this._debugToggler._parseNode && console.groupEnd();
      return
    }

    this._debugMode
      && console.assert( // is filtered in the function _gerChildren()
      this._DOM.getElementOffsetParent(currentElement),
      'it is expected that the element has an offset parent',
      currentElement);

    const newPageBottom = this.pages.at(-1).pageBottom;
    const nextElementTop = this._node.getTop(nextElement, this._root);
    this._debugMode && this._debugToggler._parseNode && console.log(...consoleMark,
      '• newPageBottom', newPageBottom,
      '\n',
      '• nextElementTop',nextElementTop,
      );

    // TODO if next elem is SVG it has no offset Top!

    if (nextElementTop <= newPageBottom) {
      this._debugMode && this._debugToggler._parseNode && console.log(
        'nextElementTop <= newPageBottom', nextElementTop, '<=', newPageBottom
      )
      // * IF: nextElementTop <= newPageBottom,
      // * then currentElement fits.

      // ** Check for page break markers inside.
      // ** If there are - register new page starts.
      this._node.findAllForcedPageBreakInside(currentElement).forEach(
        element => this._registerPageStart(element)
      );
      // TODO: это может быть внутри таблицы или другого элемента,
      // который мы не хотим / не можем разбить обычным образом!
      // Нужно проверять currentElement

      // * ... then continue.
    } else {
      this._debugMode && this._debugToggler._parseNode && console.log(
        'nextElementTop > newPageBottom', nextElementTop, '>', newPageBottom
      )
      // * ELSE IF: nextElementTop > newPageBottom,
      // * nextElement does not start on the current page.
      // * Possible cases for the currentElement:
      // *** (0) in one piece should be moved to the next page
      // *** (1) is fit in one piece on the current page
      // *** (2) must be split

      // * Check the possibility of (0)
      if (this._node.isNoHanging(currentElement)) {
        this._debugMode && this._debugToggler._parseNode && console.log(
          'currentElement _isNoHanging => move it to the next page'
        )
        // ** if currentElement can't be the last element on the page,
        // ** immediately move it to the next page:

        // TODO #tracedParent
        // this._registerPageStart(currentElement);
        // ** And if it's the first child, move the parent node to the next page.
        this._registerPageStart(currentElement, true);
        this._debugMode && this._debugToggler._parseNode && console.log('%c END _parseNode (isNoHanging)', CONSOLE_CSS_END_LABEL);
        this._debugMode && this._debugToggler._parseNode && console.groupEnd();
        return
      }

      // * Check the possibility of (1) or (0): on current or next page in one piece?

      // IMAGE with optional resizing
      // TODO float images

      if (this._node.isSVG(currentElement) || this._node.isIMG(currentElement)) {

        // TODO needs testing

        // svg has not offset props
        const currentImage = this._node.isSVG(currentElement)
        // TODO replace with setFlag... and remove wrapper function
        // TODO process at the beginning, find all SVG and set Flag
          ? this._node.createSignpost(currentElement)
          : currentElement;

        const availableSpace = newPageBottom - this._node.getTop(currentImage, this._root);
        const currentImageHeight = this._DOM.getElementOffsetHeight(currentImage);
        const currentImageWidth = this._DOM.getElementOffsetWidth(currentImage);

        // TODO !!! page width overflow for SVG
        if (currentImageHeight < this._referenceWidth) {
          // just leave it on the current page
          this._debugMode && this._debugToggler._parseNode
          && console.warn('%c IMAGE is too wide', 'color: red');
        }

        // if it fits
        if (currentImageHeight < availableSpace) {
          // just leave it on the current page
          this._registerPageStart(nextElement);
          this._debugMode && this._debugToggler._parseNode && console.log('%c END _parseNode IMG fits', CONSOLE_CSS_END_LABEL);
          this._debugMode && this._debugToggler._parseNode && console.groupEnd();
          return
        }

        // if not, try to fit it
        const ratio = availableSpace / currentImageHeight;

        if (ratio > this._imageReductionRatio) {
          // leave it on the current page
          this._registerPageStart(nextElement);
          // and reduce it a bit
          this._node.fitElementWithinBoundaries({
            element: currentElement,
            height: currentImageHeight,
            width: currentImageWidth,
            vspace: availableSpace,
            hspace: this._referenceWidth
          });
          this._debugMode && this._debugToggler._parseNode && console.log('%c END _parseNode IMG scaled', CONSOLE_CSS_END_LABEL);
          this._debugMode && this._debugToggler._parseNode && console.groupEnd();
          return
        }

        // otherwise move it to next page,
        // *** 'true':
        // *** add the possibility of moving it with the wrap tag
        // *** if it's the first child
        this._registerPageStart(currentImage, true);
        // and avoid page overflow if the picture is too big to fit on the page as a whole
        if (currentImageHeight > this._referenceHeight) {
          this._node.fitElementWithinBoundaries({
            element: currentElement,
            height: currentImageHeight,
            width: currentImageWidth,
            vspace: this._referenceHeight,
            hspace: this._referenceWidth
          });
        }
        this._debugMode && this._debugToggler._parseNode && console.log('%c END', CONSOLE_CSS_END_LABEL);
        this._debugMode && this._debugToggler._parseNode && console.groupEnd();
        return
      }

      // ... in case nextElementTop > newPageBottom
      if(currentElement.style.height) {
        // TODO: create test
        this._debugMode && this._debugToggler._parseNode && console.log(
          '🥁 currentElement has HEIGHT', currentElement.style.height
        );
        // * If a node has its height set with styles, we handle it as a non-breaking object,
        // * and can just scale it if it doesn't fit on the page.

        const currentElementTop = this._node.getTop(currentElement, this._root);
        const availableSpace = newPageBottom - currentElementTop;
        const currentElementContextualHeight = nextElementTop - currentElementTop;

        const availableSpaceFactor = availableSpace / currentElementContextualHeight;
        const fullPageFactor = this._referenceHeight / currentElementContextualHeight;

        this._debugMode && this._debugToggler._parseNode && console.log(
          '\n🥁 currentElementTop', currentElementTop,
          '\n🥁 availableSpace', availableSpace,
          '\n🥁 currentElementContextualHeight', currentElementContextualHeight,
          '\n🥁 availableSpaceFactor', availableSpaceFactor,
          '\n🥁 fullPageFactor', fullPageFactor,
        );

        console.assert(availableSpaceFactor < 1);

        // Try to fit currentElement into the remaining space
        // on the current(last) page (availableSpace).
        if(availableSpaceFactor > 0.8) {
          this._debugMode && this._debugToggler._parseNode && console.log(
            '🥁 availableSpaceFactor > 0.8: ', availableSpaceFactor
          );
          // If, in order for it to fit, it needs to be scaled by no more than 20%,
          // we can afford to scale:
          this._DOM.setStyles(currentElement, { transform: `scale(${availableSpaceFactor})` });
          // and start a new page with the next element:
          this._registerPageStart(nextElement);
          this._debugMode && this._debugToggler._parseNode && console.log('%c END _parseNode (has height & scale)', CONSOLE_CSS_END_LABEL);
          this._debugMode && this._debugToggler._parseNode && console.groupEnd();
          return
        }

        // Otherwise the element will be placed on the next page.
        // And now we'll scale it anyway if it doesn't fit in its entirety.

        if(fullPageFactor < 1) {
          this._debugMode && this._debugToggler._parseNode && console.log(
            '🥁 fullPageFactor < 1: ', fullPageFactor
          );
          this._DOM.setStyles(currentElement, { transform: `scale(${fullPageFactor})` });
        }

        this._debugMode && this._debugToggler._parseNode && console.log(
          '🥁 _registerPageStart', currentElement
        );
        this._registerPageStart(currentElement);
        this._debugMode && this._debugToggler._parseNode && console.log('%c END _parseNode (has height & put on next page)', CONSOLE_CSS_END_LABEL);
        this._debugMode && this._debugToggler._parseNode && console.groupEnd();
        return
      }

      // * Check the possibility of (1) or (2): split or not?


      const currentElementBottom = parentBottom || this._node.getBottomWithMargin(currentElement, this._root);

      this._debugMode && this._debugToggler._parseNode && console.log(
        'split or not? \n',
        'currentElementBottom', currentElementBottom
      );

      // IF currentElement does fit
      // in the remaining space on the page,
      if (currentElementBottom <= newPageBottom) {
        this._debugMode && this._debugToggler._parseNode && console.log(
          'currentElementBottom <= newPageBottom', currentElementBottom, '<=', newPageBottom,
          '\n register nextElement as pageStart'
        );
        // we need <= because splitted elements often get equal height // todo comment

        // * AND it's being fulfilled:
        // *** nextElementTop > newPageBottom
        // * so this element cannot be the first child,
        // * because the previous element surely ends before this one begins,
        // * and so is its previous neighbor, not its parent.
        this._registerPageStart(nextElement);
        this._debugMode && this._debugToggler._parseNode && console.log('%c END _parseNode (currentElement fits)', CONSOLE_CSS_END_LABEL);
        this._debugMode && this._debugToggler._parseNode && console.groupEnd();
        return
      }

      this._debugMode && this._debugToggler._parseNode && console.log(
        'currentElementBottom > newPageBottom', currentElementBottom, '>', newPageBottom
      );

      // see if this node is worth paying attention to, based on its height
      // TODO: need to rearrange the order of the condition checks
      if (this._DOM.getElementOffsetHeight(currentElement) + 2 < this._minimumBreakableHeight) {
        this._debugMode && this._debugToggler._parseNode && console.log(
          'this._DOM.getElementOffsetHeight(currentElement) + 2 < this._minimumBreakableHeight',
          this._DOM.getElementOffsetHeight(currentElement),
        );

        // todo #fewLines
        // ! add 2 compensation pixels, because when converting millimeters to pixels,
        // ! there's a rounding off, and with a rough calculation (like now)
        // ! and the rounding of 1 line will be rougher than 4 -->
        // ! we will get a smaller number than the actual 4 lines, at least by a 2 pixel.
        // todo #mm-px convert mm to px before all calculations and rendering
        // console.log('??????????????????????????? \n getElementHeight(currentElement) <= this._minimumBreakableHeight',
        // this._DOM.getElementOffsetHeight(currentElement),
        //  '<',
        //  this._minimumBreakableHeight,
        //   currentElement)
        this._registerPageStart(currentElement, true);
        this._debugMode && this._debugToggler._parseNode && console.log('%c END _parseNode #fewLines', CONSOLE_CSS_END_LABEL);
        this._debugMode && this._debugToggler._parseNode && console.groupEnd();
        return
      }

      // otherwise try to break it and loop the children:
      const children = this._getProcessedChildren(currentElement, newPageBottom, this._referenceHeight);
      this._debugMode && this._debugToggler._parseNode && console.log(
        'try to break it and loop the children:', children
      );

      // **
      // * The children are processed.
      // * Depending on the number of children:

      const childrenNumber = children.length;
      this._debugMode && this._debugToggler._parseNode && console.log(...consoleMark,
        'childrenNumber ', childrenNumber);
      this._debugMode && this._debugToggler._parseNode && console.log(...consoleMark,
        'currentElement ', currentElement);

      // TODO #tracedParent
      // ?? If it is an only child (it means that the parent node is not split),
      // ** as well as if the first child is being registered,
      // ** -- we want to use the past parent (=wrapper of the current node)
      // ** as the start of the page.

      // condition "childrenNumber <= 1" || // !!! - P PRE и тп с 1 ребенком вносят ошибки
      // * if the first child - keep the previous parent,
      // * if not the first - change to the current element:
      const tracedParent = isCurrentFirst ? (parent || currentElement) : currentElement;

      // * Parse children:
      if (childrenNumber) {
        // * In a fully split node, children replace it,
        // * so we don't take into account the last child bottom margins (parentBottom).
        const isFullySPlittedParent = this._node.isFullySPlitted(currentElement);
        // * Process children if exist:
        this._parseNodes({
          array: children,
          previous: previousElement,
          next: nextElement,
          parent: tracedParent,
          parentBottom: isFullySPlittedParent ? undefined : currentElementBottom,
        })
      } else {
        // * If no children,
        // * move element to the next page.
        // ** But,
        if (this._node.isNoHanging(previousElement)) {
          // ** if previousElement can't be the last element on the page,
          // ** move it to the next page.
          this._registerPageStart(previousElement, true);

        } else {
          // TODO #tracedParent
          // this._registerPageStart(currentElement);
          this._debugMode && this._debugToggler._parseNode && console.log(
            ...consoleMark,
            '_registerPageStart (from _parseNode): \n',
            currentElement
          );
          this._registerPageStart(currentElement, true);

        }
      }
    }

    this._debugMode && this._debugToggler._parseNode && console.log('%c END _parseNode', CONSOLE_CSS_END_LABEL);
    this._debugMode && this._debugToggler._parseNode && console.groupEnd();
  }


  // CHILDREN

  _getChildren(element) {
    // Check children:
    // TODO variants
    // TODO last child
    // TODO first Li

    // fon display:none / contents
    // this._DOM.getElementOffsetParent(currentElement)

    // TODO: to do this check more elegant
    // SEE the context here:
    // _splitComplexTextBlockIntoLines(node)
    // ...
    // const nodeChildren = this._getChildren(node);
    // * _processInlineChildren (makes ComplexTextBlock) is running extra on complex nodes
    if (this._node.isComplexTextBlock(element)) {
      return [...this._DOM.getChildren(element)]

    } else {

      let childrenArr = [...this._DOM.getChildNodes(element)]
        .reduce(
          (acc, item) => {

            // * filter STYLE, use element.tagName
            if (this._node.isSTYLE(item)) {
              return acc;
            }

            // * wrap text node, use element.nodeType
            if (this._node.isSignificantTextNode(item)) {
              acc.push(this._node.wrapTextNode(item));
              return acc;
            }

            // * no offset parent (contains)
            if (!this._DOM.getElementOffsetParent(item)) {
              const ch = this._getChildren(item);
              ch.length > 0 && acc.push(...ch);
              return acc;
            }

            // * normal
            if (this._DOM.isElementNode(item)) {
              acc.push(item);
              return acc;
            };

          }, [])

          if (this._node.isVerticalFlowDisrupted(childrenArr)) {
            // * If the vertical flow is disturbed and the elements are side by side:
            childrenArr = this._processInlineChildren(childrenArr);
          }

      return childrenArr;
    }
  }

  _getProcessedChildren(node, firstPageBottom, fullPageHeight) {
    const consoleMark = ['%c_getProcessedChildren\n', 'color:white',];

    let children = [];

    if (this._node.isNoBreak(node)) {
      // don't break apart, thus keep an empty children array
      this._debugMode && this._debugToggler._getProcessedChildren && console.info(...consoleMark,
        '🧡 isNoBreak', node);
      return children = [];

    } else if (this._node.isComplexTextBlock(node)) {
      this._debugMode && this._debugToggler._getProcessedChildren && console.info(...consoleMark,
        '💚 ComplexTextBlock', node);
      return children = this._splitComplexTextBlockIntoLines(node) || [];

    } else if (this._node.isWrappedTextNode(node)) {
      this._debugMode && this._debugToggler._getProcessedChildren && console.info(...consoleMark,
        '💚 TextNode', node);

      return children = this._splitComplexTextBlockIntoLines(node) || [];

    }

    const nodeComputedStyle = this._DOM.getComputedStyle(node);

    // ? TABLE now has conditions that overlap with PRE (except for the tag name),
    // ? so let's check it first.
    // FIXME the order of checks
    if (this._node.isTableLikeNode(node, nodeComputedStyle)) {
      this._debugMode && this._debugToggler._getProcessedChildren && console.info(...consoleMark,
        '💚 TABLE like', node);
      children = this._splitTableLikeNode(
        node,
        firstPageBottom,
        fullPageHeight,
        nodeComputedStyle
      ) || [];

    } else if (this._node.isTableNode(node, nodeComputedStyle)) {
      this._debugMode && this._debugToggler._getProcessedChildren && console.info(...consoleMark,
        '💚 TABLE', node);
      children = this._splitTableNode(
        node,
        firstPageBottom,
        fullPageHeight,
        nodeComputedStyle
      ) || [];

    } else if (this._node.isPRE(node, nodeComputedStyle)) {
      this._debugMode && this._debugToggler._getProcessedChildren && console.info(...consoleMark,
        '💚 PRE', node);
      children = this._splitPreNode(
        node,
        firstPageBottom,
        fullPageHeight,
      ) || [];

    } else if (this._node.isGridAutoFlowRow(this._DOM.getComputedStyle(node))) {
      // ** If it is a grid element.
      // ????? Process only some modifications of grids!
      // ***** There's an inline grid check here, too.
      // ***** But since the check for inline is below and real inline children don't get here,
      // ***** it is expected that the current element is either block or actually
      // ***** behaves as a block element in the flow thanks to its content.
      this._debugMode && this._debugToggler._getProcessedChildren && console.info(...consoleMark,
        '💜 GRID');
      children = this._splitGridNode(
        node,
        firstPageBottom,
        fullPageHeight
      ) || [];


      // TODO LI: если в LI есть UL, маркер может оставаться на прежней странице - см. скрин в телеге.
      // } else if (this._node.isLiNode(node)) {
      //   // todo
      //   // now make all except UL unbreakable
      //   const liChildren = this._getChildren(node)
      //     .reduce((acc, child) => {
      //       if (this._DOM.getElementTagName(child) === 'UL') {
      //         acc.push(child);
      //       } else {
      //         // TODO сразу собирать в нейтральный объект
      //         // и проверить display contents!! чтобы брать положение, но отключать стили и влияние на другие
      //         if (acc[acc.length - 1]?.length) {
      //           acc[acc.length - 1].push(child);
      //         } else {
      //           acc.push([child]);
      //         }
      //       }
      //       return acc
      //     }, []);

    } else {
      this._debugMode && this._debugToggler._getProcessedChildren && console.info(...consoleMark,
        '💚 some node', node);
      children = this._getChildren(node);

      this._debugMode && this._debugToggler._getProcessedChildren && console.info(
        ...consoleMark,
        '🚸 get element children ',
        children
      );
    }

    return children
  }

  _processInlineChildren(children) {

    let complexTextBlock = null;
    const newChildren = [];

    children.forEach(child => {
      if (this._node.isInline(this._DOM.getComputedStyle(child))) {
        if (!complexTextBlock) {
          // the first inline child
          complexTextBlock = this._node.createComplexTextBlock();
          this._node.wrapNode(child, complexTextBlock);
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

  _splitComplexTextBlockIntoLines(node) {

    // TODO "complexTextBlock"

    this._debugMode && this._debugToggler._splitComplexTextBlockIntoLines && console.group('_splitComplexTextBlockIntoLines');
    this._debugMode && this._debugToggler._splitComplexTextBlockIntoLines && console.log('_splitComplexTextBlockIntoLines (node)', node);

    // TODO ЭТА ШТУКА ЗАПУСКАЕТСЯ ДВАЖДЫ!

    if (this._node.isSelectorMatching(node, this._selector.splitted)) {

      this._debugMode && this._debugToggler._parseNode && console.log(`%c END ${this._selector.splitted}`, CONSOLE_CSS_END_LABEL);
      this._debugMode && this._debugToggler._splitComplexTextBlockIntoLines && console.groupEnd();
      return this._getChildren(node);
    }

    // GET CHILDREN

    // console.log('\n\n\n\n\n\n');
    // const o = node.cloneNode(true);
    // console.log('before', o);

    // console.log('\n\nAAAAAAA');
    // const a = node.cloneNode(true);
    // const nodeChildrenA = this._getChildren(a).map(
    //   item => {return [
    //     item,
    //     item.innerHTML
    //   ]}
    // );
    // console.log(a, 'nodeChildrenA', nodeChildrenA);

    // console.log('\n\nBBBBBBBBB');
    // const b = node.cloneNode(true);
    // const nodeChildrenB = [...this._DOM.getChildren(b)].map(
    //   item => {return [
    //     item,
    //     item.innerHTML
    //   ]}
    // );
    // console.log(b, 'nodeChildrenB', nodeChildrenB);

    // console.log('\n\n\n\n\n\n');

    // Она уже обработана - можно просто взять детей ?? -- так разбивается только первая строка
    // TODO (вложенные не работают - теряется внутренний 2й как минимум)
    // const nodeChildren = [...this._DOM.getChildren(node)]; // а так не считывается текстовая нода
    // const nodeChildren = this._getChildren(node); // а так дважды обрабатывается _processInlineChildren
    // ? FIX was made in _getChildren(element)

    const nodeChildren = this._getChildren(node);

    const complexChildren = nodeChildren.map(
      element => {
        const lineHeight = this._node.getLineHeight(element);
        const height = this._DOM.getElementOffsetHeight(element);
        const left = this._DOM.getElementOffsetLeft(element);
        const top = this._DOM.getElementOffsetTop(element);
        const lines = ~~(height / lineHeight);
        const text = this._DOM.getInnerHTML(element);

        return {
          element,
          lines,
          left,
          top,
          lineHeight,
          text
        }
      }
    );

    // !!!
    // ? break it all down into lines

    // * Process the children of the block:
    const newComplexChildren = complexChildren.flatMap((item) => {
      // * Break it down as needed:
      if ((item.lines > 1) && !this._node.isNoBreak(item.element)) {
        // TODO: add GROUP to no-break elements?
        item.element.classList.add('newComplexChildren🅱️');
        return this._breakItIntoLines(item.element); // array
      }
      // this._debugMode && console.log('%c no break ', 'color:red', item);
      // * otherwise keep the original element:
      return item.element;
    });

    // * Prepare an array of arrays containing references to elements
    // * that fit into the same row:
    const newComplexChildrenGroups = newComplexChildren.reduce(
      (result, currentElement, currentIndex, array) => {

        // * If BR is encountered, we start a new empty line:
        if(this._DOM.getElementTagName(currentElement) === 'BR' ) {
          result.at(-1).push(currentElement);
          result.push([]); // => will be: result.at(-1).length === 0;
          return result;
        }

        // * If this is the beginning, or if a new line:
        if(!result.length || this._node.isLineChanged(result.at(-1).at(-1), currentElement)) {
          result.push([currentElement]);
          return result;
        }

        // TODO: isLineChanged vs isLineKept: можно сделать else? они противоположны
        if(
          result.at(-1).length === 0 // the last element was BR
          || (result.length && this._node.isLineKept(result.at(-1).at(-1), currentElement))
        ) {
          result.at(-1).push(currentElement);
          return result;
        }

        this._debugMode
          // && this._debugToggler._parseNode
          && console.assert(
            true,
            'newComplexChildrenGroups: An unexpected case of splitting a complex paragraph into lines.',
            '\nOn the element:',
            currentElement
        );
      }, []
    );

    // Consider the paragraph partitioning settings:
    // * this._minBreakableLines
    // * this._minLeftLines
    // * this._minDanglingLines

    this._debugMode && this._debugToggler._splitComplexTextBlockIntoLines && console.log(
      '🟡🟡🟡 newComplexChildrenGroups',
      newComplexChildrenGroups
    );

    if (newComplexChildrenGroups.length < this._minBreakableLines) {
      this._debugMode && this._debugToggler._splitComplexTextBlockIntoLines && console.log(
          'newComplexChildrenGroups.length < this._minBreakableLines',
          newComplexChildrenGroups.length, '<', this._minBreakableLines
        );
      this._debugMode && this._debugToggler._parseNode && console.log('%c END NOT _splitComplexTextBlockIntoLines', CONSOLE_CSS_END_LABEL);
      this._debugMode && this._debugToggler._splitComplexTextBlockIntoLines && console.groupEnd();
      // Not to break it up
      return []
    }

    const firstUnbreakablePart = newComplexChildrenGroups.slice(0, this._minLeftLines).flat();
    const lastUnbreakablePart = newComplexChildrenGroups.slice(-this._minDanglingLines).flat();
    newComplexChildrenGroups.splice(0, this._minLeftLines, firstUnbreakablePart);
    newComplexChildrenGroups.splice(-this._minDanglingLines, this._minDanglingLines, lastUnbreakablePart);

    // * Then collect the resulting children into rows
    // * which are not to be split further.
    const linedChildren = newComplexChildrenGroups.map(
      (arr, index) => {
        // * Create a new line
        const line = this._node.createWithFlagNoBreak();
        (arr.length > 1) && line.classList.add('group🛗');
        line.setAttribute('role', 'group〰️');

        if (arr.length == 0) {
          line.setAttribute('role', '🚫');
          console.assert(arr.length == 0, 'The string cannot be empty (_splitComplexTextBlockIntoLines)')
        } else if (arr.length == 1) {
          line.setAttribute('role', 'line');
        } else {
          line.setAttribute('role', 'group');
        }
        line.dataset.index = index;
        // * Replace the array of elements with a line
        // * that contains all these elements:
        this._DOM.insertBefore(arr[0], line);
        this._DOM.insertAtEnd(line, ...arr);
        // * Return a new unbreakable line.
        return line;
      }
    );

    this._debugMode && this._debugToggler._parseNode && console.log('%c END OK _splitComplexTextBlockIntoLines', CONSOLE_CSS_END_LABEL);
    this._debugMode && this._debugToggler._splitComplexTextBlockIntoLines && console.groupEnd();

    this._DOM.setAttribute(node, this._selector.splitted);

    return linedChildren
  }

  _breakItIntoLines(splittedItem) {

    if (this._node.isNoBreak(splittedItem)) {
      return splittedItem
    }

    // Split the splittedItem into spans.
    // * array with words:
    const itemWords = this._node.splitByWordsGreedyWithSpacesFilter(splittedItem);
    // * array with words wrapped with the inline tag 'html2pdf-word':
    const itemWrappedWords = itemWords.map((item, index) => {
      const span = this._node.create('html2pdf-word');
      span.dataset.index = index;
      // span.innerHTML = item + WORD_JOINER;
      this._DOM.setInnerHTML(span, item + WORD_JOINER)
      return span;
    });

    // Replacing the contents of the splittedItem with a span sequence:
    // splittedItem.innerHTML = '';
    this._DOM.setInnerHTML(splittedItem, '');
    this._DOM.insertAtEnd(splittedItem, ...itemWrappedWords);

    // Split the splittedItem into lines.
    // Let's find the elements that start a new line.
    const beginnerNumbers = itemWrappedWords.reduce(
      (result, currentWord, currentIndex) => {
        if (currentIndex > 0 && (itemWrappedWords[currentIndex - 1].offsetTop + itemWrappedWords[currentIndex - 1].offsetHeight) <= currentWord.offsetTop) {
          result.push(currentIndex);
        }
        return result;
      }, [0]
    );

    // Create the needed number of lines,
    // fill them with text from itemWords, relying on the data from beginnerNumbers,
    // and replace splittedItem with these lines:
    // * insert new lines before the source element,
    const newLines = beginnerNumbers.reduce(
      (result, currentElement, currentIndex) => {
        const line = this._DOM.cloneNodeWrapper(splittedItem);
        this._node.setFlagNoBreak(line); // TODO ?

        this._DOM.setAttribute(line, '[role]', 'line-simplest');
        this._DOM.setAttribute(line, '.cloned🅱️');

        const start = beginnerNumbers[currentIndex];
        const end = beginnerNumbers[currentIndex + 1];
        // need to add safety spaces at both ends of the line:
        const text = ' ' + itemWords.slice(start, end).join(WORD_JOINER) + WORD_JOINER + ' ';
        this._DOM.setInnerHTML(line, text);
        this._DOM.insertBefore(splittedItem, line);
        // Keep the ID only on the first clone
        (currentIndex > 0) && line.removeAttribute("id");

        result.push(line);
        return result;
      }, []);


    // * and then delete the source element.
    splittedItem.remove();

    return newLines;
  }



  // TODO
  // - если не разбиваемый и его высота больше чем страница - уменьшать

  // HELPERS

  _splitPreNode(node, pageBottom, fullPageHeight, nodeComputedStyle) {
    // ['pre', 'pre-wrap', 'pre-line', 'break-spaces']

    // * If we call the function in a context where
    // * the computedStyle for a node has already been computed,
    // * it will be passed in the nodeComputedStyle variable.
    const _nodeComputedStyle = nodeComputedStyle
      ? nodeComputedStyle
      : this._DOM.getComputedStyle(node);

    const consoleMark = ['%c_splitPreNode\n', 'color:white',]
    this._debugMode && this._debugToggler._splitPreNode && console.group('%c_splitPreNode', 'background:cyan');
    this._debugMode && this._debugToggler._splitPreNode && console.log(...consoleMark, 'node', node);

    // Prepare node parameters
    const nodeTop = this._node.getTop(node, this._root);
    const nodeHeight = this._DOM.getElementOffsetHeight(node);
    const nodeLineHeight = this._node.getLineHeight(node);
    const preWrapperHeight = this._node.getEmptyNodeHeight(node, false);

    // * Let's check the probable number of rows in the simplest case,
    // * as if the element had the style.whiteSpace=='pre'
    // * and the line would occupy exactly one line.
    const minNodeHeight = preWrapperHeight + nodeLineHeight * this._minPreBreakableLines;
    if (nodeHeight < minNodeHeight) {
      this._debugMode && this._debugToggler._splitPreNode && console.log('%c END _splitPreNode (small node)', CONSOLE_CSS_END_LABEL);
      return []
    }

    const _children = this._DOM.getChildNodes(node);
    this._debugMode && this._debugToggler._splitPreNode && console.log('_children:', _children.length);
    if (_children.length == 0) {
      // ??? empty tag => not breakable
      this._debugMode && this._debugToggler._splitPreNode && console.log('%c END _splitPreNode (not breakable)', CONSOLE_CSS_END_LABEL);
      return []
    } else if (_children.length > 1) {
      // ! if _children.length > 1
      // TODO check if there are NODES except text nodes
      // ! TODO
      this._debugMode && this._debugToggler._splitPreNode && console.log('%c END _splitPreNode TODO!', CONSOLE_CSS_END_LABEL);
      return []
    } else { // * if _children.length == 1
      // * then it is a TEXT node and has only `\n` as a line breaker
      if (this._DOM.isElementNode(_children[0])) {
        // element node
        // TODO check if there are NODES except text nodes
        const currentElementNode = _children[0];
        this._debugMode && this._debugToggler._splitPreNode && console.warn("is Element Node", currentElementNode)
        // FIXME other cases i.e. node and we need recursion
        this._debugMode && this._debugToggler._splitPreNode && console.log('%c END _splitPreNode ???????', CONSOLE_CSS_END_LABEL);
        return []
      }
      if (this._node.isWrappedTextNode(_children[0])) {
        // if (textNode.nodeType === 3) // 3 - тип TextNode
        this._debugMode && this._debugToggler._splitPreNode && console.warn(`is TEXT Node: ${_children[0]}`);
        // FIXME other cases i.e. node and we need recursion
      }

      // ? wholeText vs textContent
      const currentNodeText = _children[0].wholeText;

      // * split the text node into lines by \n,
      // * leaving the character \n at the end of the resulting string:
      const stringsFromNodeText = this._node.splitByLinesGreedy(currentNodeText);

      if (stringsFromNodeText.length < this._minPreBreakableLines) {
        this._debugMode && this._debugToggler._splitPreNode && console.log('%c END _splitPreNode few lines', CONSOLE_CSS_END_LABEL);
        return []
      }

      // * Strings array normalization.
      // ** Get the first this._minPreFirstBlockLines elements
      // ** and concatenate them into a string
      const startString = stringsFromNodeText.splice(0, this._minPreFirstBlockLines).join('');
      // ** Get the first this._minPreLastBlockLines elements
      // ** and concatenate them into a string
      const endString = stringsFromNodeText.splice(-this._minPreLastBlockLines).join('');
      // ** Insert new rows into the array stringsFromNodeText
      stringsFromNodeText.unshift(startString);
      stringsFromNodeText.push(endString);

      // * Modifying DOM
      const linesFromNode = stringsFromNodeText.map(string => {
        const line = this._node.createWithFlagNoBreak();
        this._DOM.setInnerHTML(line, string);
        return line
      });
      this._debugMode && this._debugToggler._splitPreNode && console.log('linesFromNode', linesFromNode);
      this._node.replaceNodeContentsWith(node, ...linesFromNode);

      // * calculate parts

      // ** Prepare parameters for splitters calculation
      let firstPartSpace = pageBottom - nodeTop - preWrapperHeight;
      const fullPageSpace = fullPageHeight - preWrapperHeight;

      // * find starts of parts splitters

      let page = 0;
      let splitters = [];
      let floater = firstPartSpace;

      // *** need to make the getTop work with root = node
      const initPosition = _nodeComputedStyle.position;
      if (initPosition != 'relative') {
        this._DOM.setStyles(node, { position: 'relative' });
      }

      for (let index = 0; index < linesFromNode.length; index++) {
        const current = linesFromNode[index];
        const currentBottom = this._node.getBottom(current, node);

        // TODO move to DOM
        if (currentBottom > floater) {
          // * start a new part at [index]
          index && splitters.push(index);
          // ? start a new page
          index && (page += 1);
          // * move the floater down:
          // ** if this is the very first element,
          // ** we just assume that the first part can take up the whole page.
          floater = index ? this._node.getTop(current, node) + fullPageSpace : fullPageSpace;
        } // end for
      }

      // *** need to revert back to the original positioning of the node
      this._DOM.setStyles(node, { position: initPosition });

      if(!splitters.length) {
        // ** if there is no partitioning, we return an empty array
        // ** and the original node will be taken in its entirety.
        this._debugMode && this._debugToggler._splitPreNode && console.log('%c END _splitPreNode NO SPLIITERS', CONSOLE_CSS_END_LABEL);
        return []
      }

      // ******** ELSE:
      // * If there are parts here, and the node will be split, continue.
      // * Render new parts.

      // * The last part end is registered automatically.
      splitters.push(null);
      this._debugMode && this._debugToggler._splitPreNode && console.log(
        ...consoleMark,
        'splitters', splitters
      );

      const newPreElementsArray = splitters.map((id, index, splitters) => {
        // Avoid trying to break this node: createWithFlagNoBreak()
        // We can't wrap in createWithFlagNoBreak()
        // because PRE may have margins and that will affect the height of the wrapper.
        // So we will give the PRE itself this property.
        const part = this._DOM.cloneNodeWrapper(node);
        this._node.setFlagNoBreak(part);

        // id = the beginning of the next part
        const start = splitters[index - 1] || 0;
        const end = id || splitters[splitters.length];

        this._DOM.insertAtEnd(part, ...linesFromNode.slice(start, end));

        return part;
      });

      // * Mark nodes as parts
      this._node.markPartNodesWithClass(newPreElementsArray);

      this._debugMode && this._debugToggler._splitPreNode && console.log(
        ...consoleMark,
        'newPreElementsArray',
        newPreElementsArray
      );

      //// this._DOM.insertInsteadOf(node, ...newPreElementsArray);
      // * We need to keep the original node,
      // * we may need it as a parent in this._parseNode().
      this._node.replaceNodeContentsWith(node, ...newPreElementsArray);
      // * We "open" the slough node, but leave it.
      this._DOM.setStyles(node, { display: 'contents' });
      this._DOM.setAttribute(node, '[slough-node]', '');
      this._DOM.removeAllClasses(node);

      this._debugMode && this._debugToggler._splitPreNode && console.log('%c END _splitPreNode', CONSOLE_CSS_END_LABEL);
      this._debugMode && this._debugToggler._splitPreNode && console.groupEnd();

      return newPreElementsArray;

    } // END OF * if _children.length == 1

    // TODO the same in splitTextNode - make one code piece

  }

  _insertTableSplit({ startId, endId, table, tableEntries }) {

    // this._debugMode && console.log(`=> _insertTableSplit(${startId}, ${endId})`);

    const colgroup = this._node.get('colgroup', table);
    console.log(colgroup)

    const tableWrapper = this._DOM.cloneNodeWrapper(table);

    const partEntries = tableEntries.rows.slice(startId, endId);

    const part = this._node.createWithFlagNoBreak();
    table.before(part);

    if (startId) {
      // if is not first part
      this._DOM.insertAtEnd(part, this._node.createSignpost('(table continued)', this._signpostHeight));
    }

    this._DOM.insertAtEnd(
      part,
      this._node.createTable({
        wrapper: tableWrapper,
        colgroup: colgroup ? this._DOM.cloneNode(colgroup) : undefined,
        caption: this._DOM.cloneNode(tableEntries.caption),
        thead: this._DOM.cloneNode(tableEntries.thead),
        // tfoot,
        tbody: partEntries,
      }),
      this._node.createSignpost('(table continues on the next page)', this._signpostHeight)
    );

    return part
  };

  _splitTableLikeNode(node, pageBottom, fullPageHeight, nodeComputedStyle) {
    // FF has page breaks has no effect inside internal table elements.
    // So such a node will have to be split like a table.

    // todo improve partitioning:
    // now we split by rows,
    // without regard to the content or height of the rows

    // * If we call the function in a context where
    // * the computedStyle for a node has already been computed,
    // * it will be passed in the nodeComputedStyle variable.
    const _nodeComputedStyle = nodeComputedStyle
      ? nodeComputedStyle
      : this._DOM.getComputedStyle(node);

    const sortOfLines = this._getChildren(node);

    const nodeTop = this._node.getTop(node, this._root);
    const nodeWrapperHeight = this._node.getEmptyNodeHeight(node);

    // ** Prepare parameters for splitters calculation
    const firstPartSpace = pageBottom - nodeTop - nodeWrapperHeight;
    const fullPageSpace = fullPageHeight - nodeWrapperHeight;

    let distributedRows = sortOfLines; // todo?

    // todo common way to split (pre?) // 1042

    // * find starts of parts splitters

    let page = 0;
    let splitters = [];
    let floater = firstPartSpace;

    // *** need to make the getTop work with root = node
    const initPosition = _nodeComputedStyle.position;
    if (initPosition != 'relative') {
      this._DOM.setStyles(node, { position: 'relative' });
    }

    for (let index = 0; index < distributedRows.length; index++) {
      const current = distributedRows[index];
      const currentBottom = this._node.getBottom(current, node);

      // TODO move to DOM
      if (currentBottom > floater) {
        // * start a new part at [index]
        index && splitters.push(index);
        // ? start a new page
        index && (page += 1);
        // * move the floater down:
        // ** if this is the very first element,
        // ** we just assume that the first part can take up the whole page.
        floater = index ? this._node.getTop(current, node) + fullPageSpace : fullPageSpace;
      } // end for
    }

    // *** need to revert back to the original positioning of the node
    this._DOM.setStyles(node, { position: initPosition });

    if(!splitters.length) {
      // ** if there is no partitioning, we return an empty array
      // ** and the original node will be taken in its entirety.
      console.log('splitters.length', splitters.length)
      return []
    }

    // ******** ELSE:
    // * If there are parts here, and the node will be split, continue.
    // * Render new parts.

    // * The last part end is registered automatically.
    splitters.push(null);

    const newPreElementsArray = splitters.map((id, index, splitters) => {
      // Avoid trying to break this node: createWithFlagNoBreak()
      // We can't wrap in createWithFlagNoBreak()
      // because PRE may have margins and that will affect the height of the wrapper.
      // So we will give the PRE itself this property.
      const part = this._DOM.cloneNodeWrapper(node);
      this._node.setFlagNoBreak(part);
      // TODO make the same with other splitted nodes
      this._node.unmarkPageStartElement(part);

      // id = the beginning of the next part
      const start = splitters[index - 1] || 0;
      const end = id || splitters[splitters.length];

      this._DOM.insertAtEnd(part, ...distributedRows.slice(start, end));

      return part;
    });

    // * Mark nodes as parts
    this._node.markPartNodesWithClass(newPreElementsArray);

    // * We need to keep the original node,
    // * we may need it as a parent in this._parseNode().
    this._node.replaceNodeContentsWith(node, ...newPreElementsArray);
    // * We "open" the slough node, but leave it.
    this._DOM.removeAllClasses(node);
    // this._DOM.removeAllAttributes(node);
    this._DOM.removeAllStyles(node);
    this._DOM.setStyles(node, { display:'contents' });
    this._DOM.setAttribute(node, '[slough-node]', '')

    return newPreElementsArray;


    // return this._getChildren(node);
  }

  _splitTableNode(table, pageBottom, fullPageHeight) {
    // * Split simple tables, without regard to col-span and the like.
    // TODO test more complex tables

    this._node.lockTableWidths(table);

    const consoleMark = ['%c_splitTableNode\n', 'color:white',];
    this._debugMode && this._debugToggler._splitTableNode && console.time('_splitTableNode')
    this._debugMode && this._debugToggler._splitTableNode && console.group('%c_splitTableNode', 'background:cyan');
    this._debugMode && this._debugToggler._splitTableNode && console.log(...consoleMark, 'table', table);

    // calculate table wrapper (empty table element) height
    // to calculate the available space for table content
    const tableWrapperHeight = this._node.getEmptyNodeHeight(table);

    // tableEntries
    const tableEntries = this._node.getTableEntries(table);
    this._debugMode && this._debugToggler._splitTableNode && console.log(
      ...consoleMark,
      'tableEntries', tableEntries
    );

    if (tableEntries.rows.length < this._minBreakableRows) {
      this._debugMode && this._debugToggler._splitTableNode && console.groupEnd();
      return []
    }

    // Prepare node parameters
    const tableTop = this._node.getTop(table, this._root);
    const tableHeight = this._DOM.getElementOffsetHeight(table);
    const tableCaptionHeight = this._DOM.getElementOffsetHeight(tableEntries.caption) || 0;
    const tableTheadHeight = this._DOM.getElementOffsetHeight(tableEntries.thead) || 0;
    const tableTfootHeight = this._DOM.getElementOffsetHeight(tableEntries.tfoot) || 0;
    // *** Convert NULL/Undefined to 0
    // *** The logical nullish assignment (??=) operator
    const captionFirefoxAmendment = (tableCaptionHeight ?? 0) * (this._isFirefox ?? 0);

    const firstPartHeight = pageBottom
      - tableTop
      - this._signpostHeight - tableWrapperHeight;

    const fullPagePartHeight = fullPageHeight
      - tableCaptionHeight // * copied into each part
      - tableTheadHeight // * copied into each part
      - tableTfootHeight // * remains in the last part (in the table)
      - 2 * this._signpostHeight - tableWrapperHeight;

    this._debugMode && this._debugToggler._splitTableNode && console.log(
      ...consoleMark,
      'pageBottom', pageBottom,
      '\n',
      '- tableTop', tableTop,
      '\n',
      '- tableWrapperHeight', tableWrapperHeight,
      '\n',
      '- this._signpostHeight', this._signpostHeight,
      '\n',
      '= firstPartHeight', firstPartHeight,
    );
    this._debugMode && this._debugToggler._splitTableNode && console.log(
      ...consoleMark,
      'fullPageHeight', fullPageHeight,
      '\n',
      '- tableCaptionHeight', tableCaptionHeight,
      '\n',
      '- tableTheadHeight', tableTheadHeight,
      '\n',
      '- tableTfootHeight', tableTfootHeight,
      '\n',
      '- 2 * this._signpostHeight', (2 * this._signpostHeight),
      '\n',
      '- tableWrapperHeight', tableWrapperHeight,
      '\n',
      '= fullPagePartHeight', fullPagePartHeight,
    );

    // * Rows that we distribute across the partitioned table
    const getDistributedRows = (tableEntries) => [
      ...tableEntries.rows,
      tableEntries.tfoot || []
    ];

    let distributedRows = getDistributedRows(tableEntries);

    // * Calculate Table Splits Ids

    let splitsIds = [];
    let currentPageBottom = firstPartHeight;

    for (let index = 0; index < distributedRows.length; index++) {
      const currentRow = distributedRows[index];

      const currTop = this._node.getTop(currentRow, table) + captionFirefoxAmendment;

      if (currTop > currentPageBottom) {
        // * If the beginning of the line is on the second page

        if (index === 0) {
          // * If the beginning of the first line is immediately on the second page
          // * then even the header doesn't fit.
          // * Go immediately to the second page.
          currentPageBottom = fullPagePartHeight;
        } else {
          // * If the beginning of the line is on the second page
          // * and it is a row (not [0] element) -
          // * TRY TO SPLIT PREVIEW ROW

          // * Trying to split table row [index - 1]
          const splittingRowIndex = index - 1;
          const splittingRow = tableEntries.rows[splittingRowIndex];
          const splittingRowHeight = this._DOM.getElementOffsetHeight(splittingRow);
          const splittingMinRowHeight = this._node.getTableRowHeight(splittingRow, this._minBreakableRows);
          const splittingEmptyRowHeight = this._node.getTableRowHeight(splittingRow);
          const splittingRowTop = this._node.getTop(splittingRow, table) + captionFirefoxAmendment;

          const isNoBreak = this._node.isNoBreak(splittingRow);
          const makesSenseToSplitTheRow = (splittingRowHeight >= splittingMinRowHeight) && (!isNoBreak);


          if (makesSenseToSplitTheRow) {
            // * Let's split table row [index - 1]

            this._debugMode && this._debugToggler._splitTableRow && console.group(`🟣🟣🟣 Split The Row ${index - 1}`);
            // this._debugMode && this._debugToggler._splitTableRow && console.log(`🟣🟣🟣 Split The Row ${index - 1}`);

            const rowFirstPartHeight = firstPartHeight - splittingEmptyRowHeight - splittingRowTop; // TODO
            const rowFullPageHeight = fullPagePartHeight - splittingEmptyRowHeight;

            const splittingRowTDs = this._DOM.getChildren(splittingRow);

            let theRowContentSlicesByTD;

            theRowContentSlicesByTD = [...splittingRowTDs].map(td => {
              const tdChildren = this._getChildren(td);
              const tdInternalSplitters = this._getInternalSplitters({
                rootNode: td,
                children: tdChildren,
                pageBottom: pageBottom,
                firstPartHeight: rowFirstPartHeight,
                fullPageHeight: rowFullPageHeight,
              });
              return tdInternalSplitters
            });

            this._debugMode && this._debugToggler._splitTableRow && console.log(
              '🟣 \ntheRowContentSlicesByTD',
              theRowContentSlicesByTD
            );

            const shouldFirstPartBeSkipped = theRowContentSlicesByTD.some(obj => {
              this._debugMode && this._debugToggler._splitTableRow && console.log(
                '🟣',
                '\nobj.result.length',
                obj.result.length,
                '\nobj.result[0]',
                obj.result[0]
              );
              return (obj.result.length && obj.result[0] === null)
            });

            this._debugMode && this._debugToggler._splitTableRow && console.log(
              '🟣',
              '\nshouldFirstPartBeSkipped',
              shouldFirstPartBeSkipped
            );

            if(shouldFirstPartBeSkipped) {
              theRowContentSlicesByTD = [...splittingRowTDs].map(td => {
                const tdChildren = this._getChildren(td);
                const tdInternalSplitters = this._getInternalSplitters({
                  rootNode: td,
                  children: tdChildren,
                  pageBottom: pageBottom,
                  firstPartHeight: rowFullPageHeight,
                  fullPageHeight: rowFullPageHeight,
                });
                return tdInternalSplitters
              });
            }

            this._debugMode && this._debugToggler._splitTableRow && console.log(
              '🟣',
              '\n theRowContentSlicesByTD',
              theRowContentSlicesByTD
            );

            const ifThereIsSplit = theRowContentSlicesByTD.some(obj => {
              return obj.result.length
            });
            this._debugMode && this._debugToggler._splitTableRow && console.log('🟣 ifThereIsSplit', ifThereIsSplit);

            // !
            if (ifThereIsSplit) {

              const theTdContentElements = theRowContentSlicesByTD.map(el => {
                if(el.result.length) {
                  return this._createSlicesBySplitFlag(el.trail)
                } else {
                  // * el.result === 0
                  // один раз полностью копируем весь контент из столбца
                  const sliceWrapper = this._node.createWithFlagNoBreak();
                  sliceWrapper.classList.add("🟣");
                  this._DOM.setStyles(sliceWrapper, { display: 'contents' });

                  const contentElements = el.trail.map(item => item.element);
                  this._DOM.insertAtEnd(sliceWrapper, ...contentElements);

                  return [sliceWrapper]
                }
              });

              this._debugMode && this._debugToggler._splitTableRow && console.log('🟣 theTdContentElements', theTdContentElements);

              const theNewTrCount = Math.max(...theTdContentElements.map(arr => arr.length));
              this._debugMode && this._debugToggler._splitTableRow && console.log('🟣 theNewTrCount', theNewTrCount);

              const theNewRows = [];
              for (let i = 0; i < theNewTrCount; i++) {
                const rowWrapper = this._DOM.cloneNodeWrapper(splittingRow);
                this._node.setFlagNoBreak(rowWrapper);

                [...splittingRowTDs].forEach(
                  (td, tdID) => {
                    const tdWrapper = this._DOM.cloneNodeWrapper(td);
                    const content = theTdContentElements[tdID][i];
                    content && this._DOM.insertAtEnd(tdWrapper, theTdContentElements[tdID][i]);
                    this._DOM.insertAtEnd(rowWrapper, tdWrapper);
                  }
                );

                theNewRows.push(rowWrapper);
              }

              this._debugMode && this._debugToggler._splitTableRow && console.log('🟣', '\n theNewRows', theNewRows);

              // добавляем строки в массив и в таблицу

              splittingRow.className = 'splittingRow' // for test
              this._debugMode && this._debugToggler._splitTableRow && console.log('🟣 splittingRow', splittingRow);
              this._DOM.insertInsteadOf(splittingRow, ...theNewRows)

              // меняем исходный массив строк таблицы!
              tableEntries.rows.splice(splittingRowIndex, 1, ...theNewRows);
              // и обновляем рабочий массив включающий футер
              distributedRows = getDistributedRows(tableEntries);

              index = index - 1;
              // При этом шаг цикла возвращается на 1 назад;
              // и мы проверяем 2 разбитых куска (i & i-1),
              // но они с флагом "не разбивать"

            } //? END OF ifThereIsSplit

            this._debugMode && this._debugToggler._splitTableRow && console.log(`%c Split The Row ${index - 1} (or ${index})`, CONSOLE_CSS_END_LABEL);
            this._debugMode && this._debugToggler._splitTableRow && console.groupEnd(`END OF 'if makesSenseToSplitTheRow'`);
          } //? END OF 'if makesSenseToSplitTheRow'
          else {
            // TODO проверять это ТОЛЬКО если мы не можем разбить
            if (index > this._minLeftRows) {
              // * avoid < minLeftRows rows on first page
              // *** If a table row starts in the next part,
              // *** register the previous one as the beginning of the next part.
              // *** In the other case, we do not register a page break,
              // *** and the first small piece will be skipped.
              splitsIds.push(index - 1);
            }

            currentPageBottom =
            this._node.getTop(
              distributedRows[index - 1], table
            ) + captionFirefoxAmendment
            + fullPagePartHeight;
          }


        } //? END OF trying to split long TR


        // check if next fits

      } else {
        // currTop <= currentPageBottom
        // pass
      }
    }; //? END OF for: distributedRows

    this._debugMode && this._debugToggler._splitTableNode && console.log(
      ...consoleMark,
      'splitsIds', splitsIds
    );

    if (!splitsIds.length) {
      this._debugMode && this._debugToggler._splitTableNode && console.log('%c END _splitTableNode !splitsIds.length', CONSOLE_CSS_END_LABEL);
      this._debugMode && this._debugToggler._splitTableNode && console.groupEnd();
      return []
    }

    // * avoid < minDanglingRows rows on last page
    // ! distributedRows модифицировано
    const maxSplittingId = (distributedRows.length - 1) - this._minDanglingRows;
    if (splitsIds[splitsIds.length - 1] > maxSplittingId) {
      splitsIds[splitsIds.length - 1] = maxSplittingId;
    }

    const splits = splitsIds.map((value, index, array) => this._insertTableSplit({
      startId: array[index - 1] || 0,
      endId: value,
      table,
      tableEntries,
    }))

    this._debugMode && this._debugToggler._splitTableNode && console.log(
      ...consoleMark,
      'splits', splits
    );

    // create LAST PART
    const lastPart = this._node.createWithFlagNoBreak();
    table.before(lastPart);
    this._DOM.insertAtEnd(
      lastPart,
      this._node.createSignpost('(table continued)', this._signpostHeight),
      table
    );

    this._debugMode && this._debugToggler._splitTableNode && console.timeEnd('_splitTableNode');
    this._debugMode && this._debugToggler._splitTableNode && console.log('%c END _splitTableNode', CONSOLE_CSS_END_LABEL);
    this._debugMode && this._debugToggler._splitTableNode && console.groupEnd();

    return [...splits, lastPart]
  }

  // 👪👪👪👪👪👪👪👪👪👪👪👪👪👪👪👪
  _createSlicesBySplitFlag(inputArray) {
    // {
    //   id,
    //   element,
    //   children: [],
    //   split: true | false,
    // }

    this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.group(`_createSlicesBySplitFlag`);

    const sliceWrapper = this._node.createWithFlagNoBreak();
    this._DOM.setStyles(sliceWrapper, { display: 'contents' });
    sliceWrapper.classList.add("🧰");

    // *** иниццируем для первого элемента оболочку sliceWrapper
    const slices = [sliceWrapper];
    let wrappers = [sliceWrapper]; // Реальные элементы, нужно клонировать массив для нового
    let currentTargetInSlice = sliceWrapper;

    const createWrapperFromArray = (array) => {
      if (array.length === 0) {
        return null;
      }

      const wrapper = array[0];
      let currentWrapper = wrapper;

      for (let i = 1; i < array.length; i++) {
        const child = array[i];
        this._DOM.insertAtEnd(currentWrapper, child);
        currentWrapper = child;
      }

      this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log(' createWrapperFromArray:', wrapper);
      return wrapper;
    }

    const processChildren = (children, parent = null) => {
      this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.group('processChildren');
      this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('*start* children', children)

      for (let i = 0; i < children.length; i++) {
        processObj(children[i]);
      }

      this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('- wrappers BEFORE pop:', [...wrappers]);
      const a = wrappers.pop();
      this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('- wrappers.pop()', a);
      this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('- parent', parent);
      this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('- wrappers AFTER pop:', [...wrappers]);

      currentTargetInSlice = wrappers.at(-1);
      // TODO сделать функцию
      this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('🎯🎯 currentTargetInSlice', currentTargetInSlice)
      this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('🎯 wrappers.at(-1)', wrappers.at(-1))
      this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('*END* children', children)
      this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('%c END processChildren', CONSOLE_CSS_END_LABEL);
      this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.groupEnd();
    }

    const processObj = (obj) => {

      const hasChildren = obj.children?.length > 0;
      const hasSplitFlag = obj.split;
      const currentElement = obj.element;
      const id = obj.id;

      this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.group(`processObj # ${id}`); // Collapsed
      this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('currentElement', currentElement);
      currentElement && this._DOM.removeNode(currentElement);

      if(hasSplitFlag) {
        this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('••• hasSplitFlag');
        // start new object
        // const currentWrapper = slices.at(-1);
        // const nextWrapper = this._DOM.cloneNode(currentWrapper);
        wrappers = wrappers.map(wrapper => {
          const clone = this._DOM.cloneNodeWrapper(wrapper); // ???? может делать клоны не тут а при создании?
          clone.classList.add("🚩");
          return clone
        });
        this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('• hasSplitFlag: NEW wrappers.map:', [...wrappers]);
        const nextWrapper = createWrapperFromArray(wrappers);

        slices.push(nextWrapper);
        this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('• hasSplitFlag: slices.push(nextWrapper):', [...slices]);
        // find container in new object

        currentTargetInSlice = wrappers.at(-1);
        this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('• hasSplitFlag: currentTargetInSlice:', currentTargetInSlice);
      }

      // TODO проверить, когда есть оба флага

      if(hasChildren) {
        this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('••• hasChildren');
        // make new wrapper
        const cloneCurrentElementWrapper = this._DOM.cloneNodeWrapper(currentElement);

        // add cloneCurrentElementWrapper to wrappers
        wrappers.push(cloneCurrentElementWrapper); // ???????????

        this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('• hasChildren: wrappers.push(cloneCurrentElementWrapper)', cloneCurrentElementWrapper, [...wrappers]);
        // add cloneCurrentElementWrapper to slice
        this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('• hasChildren: currentTargetInSlice (check):', currentTargetInSlice);

        if(currentTargetInSlice) {
          this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('• hasChildren: currentTargetInSlice', 'TRUE, add to existing', cloneCurrentElementWrapper);
          // add to existing as a child
          this._DOM.insertAtEnd(currentTargetInSlice, cloneCurrentElementWrapper);
        } else {
          this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('• hasChildren: currentTargetInSlice', 'FALSE, init the first', cloneCurrentElementWrapper);
          // init the first
          cloneCurrentElementWrapper.classList.add('🏁first');

          this._DOM.setStyles(cloneCurrentElementWrapper, { background: 'yellow' });
          slices.push(cloneCurrentElementWrapper);
          this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('• hasChildren: slices.push(cloneCurrentElementWrapper)', cloneCurrentElementWrapper, [...slices]);
        }
        // update wrapper bookmark
        currentTargetInSlice = wrappers.at(-1) // = cloneCurrentElementWrapper
        this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('• hasChildren:  currentTargetInSlice (=):', currentTargetInSlice);


        processChildren(obj.children, currentElement);

      } else { // !!! внесли под ELSE

        // insert current Element
        currentTargetInSlice = wrappers.at(-1);
        this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('insert currentElement', currentElement, 'to target', currentTargetInSlice);
        this._DOM.insertAtEnd(currentTargetInSlice, currentElement);
      }


      this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log(`%c END processObj # ${id}`, CONSOLE_CSS_END_LABEL);
      this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.groupEnd();
    }

    this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('#######  currentTargetInSlice (=):', currentTargetInSlice);

    processChildren(inputArray);

    this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log('slices:', slices)
    this._debugMode && this._debugToggler._createSlicesBySplitFlag && slices.forEach(slice => console.log('slice:', slice))

    this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.log(`%c END _createSlicesBySplitFlag`, CONSOLE_CSS_END_LABEL);
    this._debugMode && this._debugToggler._createSlicesBySplitFlag && console.groupEnd()
    return slices
  }

  _getInternalSplitters({
    rootNode,
    rootComputedStyle,
    children,
    pageBottom,
    firstPartHeight,
    fullPageHeight,
    result = [],
    trail = [],
    indexTracker = [],
    stack = [],
  }) {

    // * Need to make the getTop work with root = rootNode.
    // * A positioned ancestor is either:
    // * - an element with a non-static position, or
    // * - td, th, table in case the element itself is static positioned.
    // * So we need to set non-static position for rootNode
    // * for the calculation runtime.
    // * Because anything in the content could be with a non-static position,
    // * and then TD without positioning wouldn't work for it as a offset parent.
    const _rootComputedStyle = rootComputedStyle
    ? rootComputedStyle
    : this._DOM.getComputedStyle(rootNode);
    const initPosition = _rootComputedStyle.position;
    if (initPosition != 'relative') {
      this._DOM.setStyles(rootNode, { position: 'relative' });
    }

    this._debugMode && this._debugToggler._getInternalSplitters && console.groupCollapsed('💟 _getInternalSplitters'); // Collapsed

    const findFirstNullIDInContinuousChain = (array) => {
      let item = null;
      let index;
      for (let i = array.length - 1; i >= 0; i--) {
        if (array[i].id === 0) {
          item = array[i];
          index = i;
        } else {
          return {item, index}
        }
      }
      return {item, index}
    }

    const updateIndexTracker = i => {
      if(i >= 0) {
        indexTracker.push(i);
      } else {
        indexTracker.pop()
      }
    }

    const registerResult = (element, id) => {
      this._debugMode && this._debugToggler._getInternalSplitters && console.assert((id >= 0), `registerResult: ID mast be provided`, element);

      let theElementObject = trail[id]; // * contender without special cases
      let theElementIndexInStack; // ***

      this._debugMode && this._debugToggler._getInternalSplitters && console.groupCollapsed('💜💜💜 registerResult(element, id)');

      this._debugMode && this._debugToggler._getInternalSplitters && console.log(
          '\n element', element,
          '\n id', id,
          '\n theElementObject (trail[id])', theElementObject,
          '\n theElementIndexInStack', theElementIndexInStack,
      );

      if (id == 0) {
        // если первый ребенок,
        // ищем самую внешнюю оболочку, которая тоже первый ребенок первого ребенка...

        const topParentElementFromStack = findFirstNullIDInContinuousChain(stack);

        this._debugMode && this._debugToggler._getInternalSplitters && console.log(
            '💜💜 id == 0',
            '\n💜 [...stack]', [...stack],
            '\n💜 topParentElementFromStack', topParentElementFromStack,
          );

        if(topParentElementFromStack.item) {
          theElementObject = topParentElementFromStack.item;
          theElementIndexInStack = topParentElementFromStack.index;
        }

      }

      this._debugMode && this._debugToggler._getInternalSplitters && console.log('💜',
        '\n theElementObject', theElementObject,
        '\n theElementIndexInStack', theElementIndexInStack,
        '\n [...indexTracker]', [...indexTracker],
      );

      if(theElementIndexInStack === 0) {
        // * If this is the first wrapper registered for the first slice, we do not register the result,
        // * since it will be the beginning of the first slice.
        // * Otherwise we will generate an empty table row.
        // * Because the first row of the table starts filling automatically,
        // * and the first flag 'split' means the beginning of the SECOND slice.

        result.push(null); // * it is used to calculate the height of a piece

        this._debugMode && this._debugToggler._getInternalSplitters && console.log(
            'result.push(null)',
            '\n\n💜💜💜',
          );
      } else {
        result.push(theElementObject.element); // * it is used to calculate the height of a piece
        theElementObject && (theElementObject.split = true);

        this._debugMode && this._debugToggler._getInternalSplitters && console.log(
            '\n theElementObject', theElementObject,
            '\n theElementObject.element', theElementObject.element,
            '\n result.push(theElementObject.element)',
            '\n\n💜💜💜 ',
          );
      }

      this._debugMode && this._debugToggler._getInternalSplitters && console.log('%c END _getInternalSplitters registerResult', CONSOLE_CSS_END_LABEL);
      this._debugMode && this._debugToggler._getInternalSplitters && console.groupEnd();
    }

    this._debugMode && this._debugToggler._getInternalSplitters && console.log(
        '💟 result 💟', result,
        '\n\n',
        `\n rootNode:`, rootNode,
        `\n children:`, children,
        `\n pageBottom:`, pageBottom,
        `\n firstPartHeight:`, firstPartHeight,
        `\n fullPageHeight:`, fullPageHeight,
        `\n\n\n`,
        '💟 stack', [...stack],
      );

    for (let i = 0; i < children.length; i++) {

      const previousElement = children[i - 1];
      const currentElement = children[i];
      const nextElement = children[i + 1];
      const nextElementTop = nextElement ? this._node.getTop(nextElement, rootNode): undefined;

      // nextElement && console.log(
      //   'ddddd',
      //   this._node.getTop(nextElement, rootNode),
      //   nextElement,
      //   rootNode
      // )

      const newObject = {
        id: i,
        element: children[i],
      }

      const newObjectFromNext = {
        id: i + 1,
        element: children[i + 1], // * depend on nextElement
      }

      // * Проверяем, не добавлен ли этот элемент,
      // * это возможно через registerResult(nextElement, i + 1).
      const lastTrailElementID = trail.length ? trail.at(-1).id : undefined;
      (i !== lastTrailElementID) && trail.push(newObject);

      const floater = (result.length === 0) // * empty array => process first slice
      ? firstPartHeight
      : (
          (result.at(-1) === null) // * case with empty first slice
          ? fullPageHeight
          : fullPageHeight + this._node.getTop(result.at(-1), rootNode)
        );

      if (this._node.isForcedPageBreak(currentElement)) {
        //register

        // TODO #ForcedPageBreak
        this._debugMode && this._debugToggler._getInternalSplitters && console.warn(
            currentElement, '💟 is isForcedPageBreak'
          );
      }

      // TODO:
      // nextElementTop?
      // nextElement?

      if (nextElementTop <= floater) {
        // -- current fits

        // this._debugMode && this._debugToggler._getInternalSplitters && console.log('💟💟 nextElementTop <= floater // current fits');

        if (this._node.isNoHanging(currentElement)) {
          // -- current fits but it can't be the last

          this._debugMode && this._debugToggler._getInternalSplitters && console.log('💟💟 currentElement _isNoHanging');

          registerResult(currentElement, i);
        }
        // go to next index
      } else { // nextElementTop > floater
              // currentElement ?

        this._debugMode && this._debugToggler._getInternalSplitters && console.log('💟💟', `nextElementTop > floater \n ${nextElementTop} > ${floater} `,);

        if (this._node.isSVG(currentElement) || this._node.isIMG(currentElement)) {
          // TODO needs testing
          this._debugMode && this._debugToggler._getInternalSplitters && console.log('%cIMAGE 💟💟', 'color:red;text-weight:bold')
        }

        const currentElementBottom = this._node.getBottomWithMargin(currentElement, rootNode);

        this._debugMode && this._debugToggler._getInternalSplitters && console.log(
          '💟💟 current ???',
          '\n currentElement', currentElement,
          '\n currentElementBottom', currentElementBottom,
          '\n floater', floater
        );

        // IF currentElement does fit
        // in the remaining space on the page,
        if (currentElementBottom <= floater) {

          this._debugMode && this._debugToggler._getInternalSplitters && console.log('💟💟💟 currentElementBottom <= floater');

          // ** add nextElement check (undefined as end)
          if(nextElement) {
            this._debugMode && this._debugToggler._getInternalSplitters && console.log('💟💟💟💟 register nextElement');
            trail.push(newObjectFromNext);
            registerResult(nextElement, i + 1);
          } // else - this is the end of element list

        } else {
          // currentElementBottom > floater
          // try to split
          this._debugMode && this._debugToggler._getInternalSplitters && console.log(
            '💟💟💟 currentElementBottom > floater,\ntry to split',
            currentElement
          );

          const currentElementChildren = this._getProcessedChildren(currentElement, pageBottom, fullPageHeight);

          // * Parse children:
          if (currentElementChildren.length) {

            // *** add wrapper ID
            updateIndexTracker(i);

            stack.push(newObject);

            // * Process children if exist:
            this._getInternalSplitters({
              rootNode,
              rootComputedStyle: _rootComputedStyle,
              children: currentElementChildren,
              pageBottom,
              firstPartHeight,
              fullPageHeight,
              result,
              trail: trail[i].children = [],
              indexTracker,
              stack,
            });

            stack.pop();

            this._debugMode && this._debugToggler._getInternalSplitters && console.log('🟪 back from _getInternalSplitters;\n trail[i]', trail[i]);
            // *** END of 'has children'

          } else {
            // * If no children,
            // * move element to the next page.
            // ** But,
            if (previousElement && this._node.isNoHanging(previousElement)) {
              // ** if previousElement can't be the last element on the page,
              // ** move it to the next page.
              // TODO #_canNotBeLast
              // а если там подряд несколько заголовков, и перед previousElement есть еще заголовки, которые мы не проверяли еслтенствнно, и они будут висеть
              // this._registerPageStart(previousElement)
              console.warn('tst improveResult', previousElement)
              // if (improveResult) {
              let result = previousElement;
              const firstChildParent = this._node.findFirstChildParent(result, this._contentFlow);
              result = firstChildParent || result;

              const previousCandidate = this._node.findPreviousNoHangingsFromPage(result, this.pages.at(-2)?.pageBottom, this._root)
              result = previousCandidate || result;


              this._debugMode && this._debugToggler._getInternalSplitters && console.log('previousElement _isNoHanging')
              registerResult(result, i - 1);
            } else {
              // TODO #tracedParent
              this._debugMode && this._debugToggler._getInternalSplitters && console.log(currentElement, 'currentElement has no children')
              registerResult(currentElement, i);
            }
          } // *** END of 'no children'
        } // *** END of 'currentElementBottom > floater'

      }
    }

    // *** remove last wrapper ID after children processing is complete
    updateIndexTracker();

    // *** need to revert back to the original positioning of the rootNode:
    this._DOM.setStyles(rootNode, { position: initPosition });

    this._debugMode && this._debugToggler._getInternalSplitters && console.log('%c END _getInternalSplitters', CONSOLE_CSS_END_LABEL);
    this._debugMode && this._debugToggler._getInternalSplitters && console.groupEnd();

    return {result, trail}
  }

  _splitGridNode(node, pageBottom, fullPageHeight) {
    // * Split simple grids,
    // * consider that templating is used, but there is no content in complex areas.
    // * If something unclear is encountered - do not split at all.
    // TODO (shall we scale?).

    const consoleMark = ['%c_splitGridNode\n', 'color:white',];
    this._debugMode && this._debugToggler._splitGridNode && console.group('_splitGridNode');

    // this._debugMode && this._debugToggler._splitGridNode && console.log(
    //   ...consoleMark,
    //   'node', this._DOM.getComputedStyle(node)
    // );

    // ** Take the node children.
    const children = this._getChildren(node);
    this._debugMode && this._debugToggler._splitGridNode && console.log(
      ...consoleMark,
      'children', children
    );

    // ** Organize the children into groups by rows.
    const childrenGroups = children.reduce(
      (result, currentElement, currentIndex, array) => {

        const currentStyle = this._DOM.getComputedStyle(currentElement);
        // this._debugMode && this._debugToggler._splitGridNode && console.log(
        //   ...consoleMark,
        //   'currentStyle', currentStyle
        // );

        // TODO: grid auto flow variants
        const start = currentStyle.getPropertyValue("grid-column-start");
        const end = currentStyle.getPropertyValue("grid-column-end");
        const currentColumnStart = (start === 'auto') ? 'auto' : parseInt(currentStyle.getPropertyValue("grid-column-start"));
        const currentColumnEnd = (end === 'auto') ? 'auto' : parseInt(currentStyle.getPropertyValue("grid-column-end"));

        const newItem = {
          element: currentElement,
          start: currentColumnStart,
          end: currentColumnEnd,
          top: this._DOM.getElementOffsetTop(currentElement)
        };

        this._debugMode && this._debugToggler._splitGridNode && console.log(
          ...consoleMark,
          '{ ???', currentElement, result
        );

        if(
          !result.length
          || (result.at(-1).at(-1).start >= newItem.start)
          || result.at(-1).at(-1).start === 'auto'
          || newItem.start === 'auto'
        ) {
          // * If this is the beginning, or if a new line.
          if (
            result.at(-1)
            && this._node.isNoHanging(result.at(-1).at(-1).element)
          ) {
            // ** If the previous last element cannot be the last element,
            // ** add to the previous group.
            this._debugMode && this._debugToggler._splitGridNode && console.log('%cLAST','color:red')
            result.at(-1).push(newItem);
          } else {
            // * Add a new group and a new item in it:
            result.push([newItem]);
          }
          this._debugMode && this._debugToggler._splitGridNode && console.log(
            ...consoleMark,
            'IF new:', newItem, [...result]
          );
          return result
        } if(result.length && (result.at(-1).at(-1).start < newItem.start)) {
          // * If the order number is increasing, it is a grid row continuation.
          // * Add a new element to the end of the last group:
          result.at(-1).push(newItem);
          this._debugMode && this._debugToggler._splitGridNode && console.log(
            ...consoleMark,
            'IF new:', newItem, [...result]
          );
          return result
        }

        this._debugMode
          && console.assert(
            true,
            '_splitGridNode: An unexpected case of splitting a grid.',
            '\nOn the element:',
            currentElement
        );
      }, []
    );
    this._debugMode && this._debugToggler._splitGridNode && console.log(
      ...consoleMark,
      'childrenGroups', childrenGroups
    );

    const nodeRows = childrenGroups.length;
    const nodeHeight = this._DOM.getElementOffsetHeight(node);

    // ** If there are enough rows for the split to be readable,
    // ** and the node is not too big (because of the content),
    // ** then we will split it.
    if (nodeRows < this._minBreakableGridRows && nodeHeight < fullPageHeight) {
      // ** Otherwise, we don't split it.
      this._debugMode && this._debugToggler._splitGridNode && console.log(`%c END DONT _splitGridNode`, CONSOLE_CSS_END_LABEL);
      this._debugMode && this._debugToggler._splitGridNode && console.groupEnd()
      return []
    }

    // ** We want to know the top point of each row
    // ** to calculate the parts to split.
    // ** After sorting, we can use [0] as the smallest element for this purpose.
    // [ [top, top, top], [top, top, top], [top, top, top] ] =>
    // [ [top, top, max-top], [top, top, max-top], [top, top, max-top] ] =>
    // [max-top, max-top, max-top]
    const topRowPoints = [
      ...childrenGroups
        .map(row => row.map(obj => obj.top).sort())
        .map(arr => arr[0]),
      nodeHeight
    ];
      // ,
      // this._node.getTop(nodeEntries.tfoot, node) || nodeHeight


    this._debugMode && this._debugToggler._splitGridNode && console.log(
      ...consoleMark,
      'topRowPoints', topRowPoints
    );

    // ** Calculate the possible parts.
    // TODO: same as the table

    // ** Prepare node parameters
    const nodeTop = this._node.getTop(node, this._root);
    const nodeWrapperHeight = this._node.getEmptyNodeHeight(node);
    const firstPartHeight = pageBottom
      - nodeTop
      // - this._signpostHeight
      - nodeWrapperHeight;
    const fullPagePartHeight = fullPageHeight
      // - 2 * this._signpostHeight
      - nodeWrapperHeight;

      this._debugMode && this._debugToggler._splitGridNode && console.log('firstPartHeight', firstPartHeight);
      this._debugMode && this._debugToggler._splitGridNode && console.log('fullPagePartHeight', fullPagePartHeight);

    // TODO 1267 -  как в таблице

    // * Calculate grid Splits Ids

    const topsArr = topRowPoints;

    let splitsIds = [];
    let currentPageBottom = firstPartHeight;

    for (let index = 0; index < topsArr.length; index++) {

      if (topsArr[index] > currentPageBottom) {

        // TODO split long TR
        // когда много диаграмм, или очень длинный текст

        if (index > this._minLeftRows) {
          // * avoid < minLeftRows rows on first page
          // *** If a table row starts in the next part,
          // *** register the previous one as the beginning of the next part.
          splitsIds.push(index - 1);
        }

        currentPageBottom = topsArr[index - 1] + fullPagePartHeight;

        // check if next fits

      }
    };

    this._debugMode && this._debugToggler._splitGridNode && console.log('splitsIds', splitsIds);

    const insertGridSplit = (startId, endId) => {
      // * The function is called later.
      // TODO Put it in a separate method: THIS AND TABLE

      this._debugMode && this._debugToggler._splitGridNode && console.log(
        ...consoleMark, `=> insertGridSplit(${startId}, ${endId})`
      );

      // const partEntries = nodeEntries.rows.slice(startId, endId);
      const partEntries = childrenGroups
        .slice(startId, endId)
        .flat()
        .map(obj => obj.element);
      this._debugMode && this._debugToggler._splitGridNode && console.log(
        ...consoleMark, `partEntries`, partEntries
      );

      // const part = this._node.createWithFlagNoBreak();
      // ! Do not wrap nodes so as not to break styles.
      // TODO - Check for other uses of createWithFlagNoBreak to see if the wrapper can be avoided.

      const part = this._DOM.cloneNodeWrapper(node);
      this._node.copyNodeWidth(part, node);
      this._node.setFlagNoBreak(part);
      node.before(part);

      if (startId) {
        // if is not first part
        // this._DOM.insertAtEnd(part, this._node.createSignpost('(table continued)', this._signpostHeight));

        // TODO: insertions between parts will not disturb the original layout & CSS.
        // Therefore, it is possible to insert an element after and before the parts
        // and specify that the node is being broken.
      }

      // в таблице другое
      // this._DOM.insertAtEnd(
      //   part,
      //   this._node.createTable({
      //     wrapper: nodeWrapper,
      //     caption: this._DOM.cloneNode(nodeEntries.caption),
      //     thead: this._DOM.cloneNode(nodeEntries.thead),
      //     // tfoot,
      //     tbody: partEntries,
      //   }),
      //   this._node.createSignpost('(table continues on the next page)', this._signpostHeight)
      // );
      // this._DOM.insertAtEnd(part, nodeWrapper);
      this._DOM.insertAtEnd(part, ...partEntries);

      return part
    };


    const splits = splitsIds.map((value, index, array) => insertGridSplit(array[index - 1] || 0, value))

    this._debugMode && this._debugToggler._splitGridNode && console.log(
      ...consoleMark,
      'splits', splits
    );

    // create LAST PART
    // TODO ??? is that really needed?
    // const lastPart = this._node.createWithFlagNoBreak();
    // node.before(lastPart);
    // this._DOM.insertAtEnd(
    //   lastPart,
    //   // this._node.createSignpost('(table continued)', this._signpostHeight),
    //   node
    // );

    // LAST PART handling
    this._node.setFlagNoBreak(node);

    this._debugMode && this._debugToggler._splitGridNode && console.log(`%c END _splitGridNode`, CONSOLE_CSS_END_LABEL);
    this._debugMode && this._debugToggler._splitGridNode && console.groupEnd()
    // return children;
    return [...splits, node]
  }

}
