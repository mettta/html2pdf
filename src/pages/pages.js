import calculateSplitters from './calculateSplitters';
import findSplitId from './findSplitId';
// import splitArrayBySplitFlag from './splitArrayBySplitFlag';

const CONSOLE_CSS_COLOR_PAGES = '#66CC00';
const CONSOLE_CSS_PRIMARY_PAGES = `color: ${CONSOLE_CSS_COLOR_PAGES};font-weight:bold`;
const CONSOLE_CSS_LABEL_PAGES = `border:1px solid ${CONSOLE_CSS_COLOR_PAGES};`
                              + `background:#EEEEEE;`
                              + `color:${CONSOLE_CSS_COLOR_PAGES};`

// SEE splitByWordsGreedyWithSpacesFilter(node) in DOM
const WORD_JOINER = '';

export default class Pages {

  constructor({
    config,
    DOM,
    layout,
    referenceWidth,
    referenceHeight
  }) {

    // * From config:
    this.debugMode = config.debugMode;
    this.debugToggler = {
      _parseNode: false,
      _parseNodes: false,
      _registerPageStart: false,
      _getProcessedChildren: false,
      _splitPreNode: false,
      _splitTableNode: false,
      _splitTableRow: false,
      _splitGridNode: false,
      _createSlicesBySplitFlag: false,
      _getInternalSplitters: false,
      _splitComplexTextBlockIntoLines: false,
    }

    // no hanging params:
    this.noHangingSelector = this._prepareNoHangingSelector(config.noHangingSelector);
    // forced Page Break params:
    this.forcedPageBreakSelector = this._prepareForcedPageBreakSelector(config.forcedPageBreakSelector);
    // do not break params:
    this.noBreakSelector = this._prepareNoBreakSelector(config.noBreakSelector);

    // ***:
    this.DOM = DOM;

    this.root = layout.root;
    this.contentFlow = layout.contentFlow;

    this.referenceWidth = referenceWidth;
    this.referenceHeight = referenceHeight;

    // todo
    // 1) move to config
    // Paragraph:
    this.minLeftLines = 2;
    this.minDanglingLines = 2;
    this.minBreakableLines = this.minLeftLines + this.minDanglingLines;
    // Table:
    this.minLeftRows = 2;
    this.minDanglingRows = 2;
    this.minBreakableRows = this.minLeftRows + this.minDanglingRows;
    // Code:
    this.minPreFirstBlockLines = 3;
    this.minPreLastBlockLines = 3;
    this.minPreBreakableLines = this.minPreFirstBlockLines + this.minPreLastBlockLines;
    // Grid:
    this.minBreakableGridRows = 4;

    this.imageReductionRatio = 0.8;

    // TODO move to config
    this.signpostHeight = 24;

    this.pages = [];

    // https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browsers
    // Firefox 1.0+
    // https://bugzilla.mozilla.org/show_bug.cgi?id=820891
    // * Reason: caption is considered as an external element
    // * and is not taken into account in calculation
    // * of offset parameters of table rows.
    this.isFirefox = typeof InstallTrigger !== 'undefined';
  }

  calculate() {
    this._prepareForcedPageBreakElements();
    this._prepareNoBreakElements();
    this._prepareNoHangingElements();
    this._calculate();
    this.debugMode && console.log('%c ✔ Pages.calculate()', CONSOLE_CSS_LABEL_PAGES, this.pages);

    return this.pages;
  }

  _prepareNoHangingElements() {
    if (this.noHangingSelector) {
      const elements = this.DOM.findAllSelectorsInside(this.contentFlow, this.noHangingSelector);
      elements.forEach(element => {
        this.DOM.setFlagNoHanging(element);
        const lastChildParent = this.DOM.findLastChildParent(element, this.contentFlow)
        if (lastChildParent) {
          this.DOM.setFlagNoHanging(lastChildParent);
        }
      });
    }
  }

  _prepareNoBreakElements() {
    if (this.noBreakSelector) {
      const elements = this.DOM.findAllSelectorsInside(this.contentFlow, this.noBreakSelector);
      elements.forEach(element => this.DOM.setFlagNoBreak(element));
    }
  }

  _prepareForcedPageBreakElements() {
    // * find all relevant elements and insert forced page break markers before them.
    if (this.forcedPageBreakSelector) {
      const pageStarters = this.DOM.findAllSelectorsInside(this.contentFlow, this.forcedPageBreakSelector);

      // ** If the element is the first child of nested first children of a content flow,
      // ** we do not process it further for page breaks.
      // ** This ensures that page breaks are only made where they have not already been made for other reasons.
      if (this.DOM.isFirstChildOfFirstChild(pageStarters[0], this.contentFlow)) {
        pageStarters.shift()
      };

      pageStarters.forEach(element => {
        const firstChildParent = this.DOM.findFirstChildParent(element, this.contentFlow)
        if (firstChildParent) {
          this.DOM.insertForcedPageBreakBefore(firstChildParent);
        } else {
          this.DOM.insertForcedPageBreakBefore(element);
        }
      });
    }
  }

  _calculate() {
    this.debugMode && console.log('%c ▼▼▼ Pages ▼▼▼ ', CONSOLE_CSS_LABEL_PAGES);

    this.debugMode && console.groupCollapsed('•• init data ••');
    this.debugMode && console.log(
      'this.referenceHeight', this.referenceHeight,
      '\n',
      'this.noHangingSelector', this.noHangingSelector,
      '\n',
      'this.forcedPageBreakSelector', this.forcedPageBreakSelector,
      '\n',
      'isFirefox', this.isFirefox,
    );
    this.debugMode && console.groupEnd('•• init data ••');

    // IF contentFlow is less than one page,

    if (this.DOM.getElementRootedRealBottom(this.contentFlow, this.root) < this.referenceHeight) {
      // In the case of a single page,
      // the markup was inserted BEFORE the contentFlow.
      // Because our script is lazy and won't go through the children
      // if it's not necessary.
      // So we insert the contentFlowStart element and register it
      // as the start of the page.
      // In doing so, we still don't examine the contentFlow children.

      // register a FIRST page
      // todo: make a DOM function
      const contentFlowStart = this.DOM.create('[data-content-flow-start]');
      this.DOM.insertAtStart(this.contentFlow, contentFlowStart);
      this._registerPageStart(contentFlowStart);

      // Check for forced page breaks, and if they are, we register these pages.
      // If not - we'll have a single page.
      this.DOM.findAllForcedPageBreakInside(this.contentFlow).forEach(
        element => this._registerPageStart(element)
      );

      return;
    }

    // ELSE:

    const content = this._getChildren(this.contentFlow);
    this.debugMode && console.groupCollapsed('%c🚸 children(contentFlow)', CONSOLE_CSS_LABEL_PAGES);
    this.debugMode && console.log(content);
    this.debugMode && console.groupEnd('%c🚸 children(contentFlow)');

    // TODO put this into main calculations?
    // FIRST ELEMENT: register the beginning of the first page.
    this._registerPageStart(content[0]);

    this._parseNodes({
      // don't register the parent here,
      // only on inner nodes that do not split
      array: content
    });

  }

  _registerPageStart(pageStart, checkParent = false) {

    if (checkParent) {
      const firstChildParent = this.DOM.findFirstChildParent(pageStart, this.contentFlow);
      pageStart = firstChildParent || pageStart;
    }

    const pageBottom = this.DOM.getElementRootedRealTop(pageStart, this.root) + this.referenceHeight;
    this.pages.push({
      pageStart: pageStart,
      pageBottom: pageBottom,
    });
    this.DOM.markPageStartElement(pageStart, this.pages.length)
    this.debugMode && this.debugToggler._registerPageStart && console.log(
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
    this.debugMode && this.debugToggler._parseNodes && console.log(
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

    this.debugMode && this.debugToggler._parseNode && console.group(
      `%c_parseNode`, CONSOLE_CSS_PRIMARY_PAGES,
      `${parentBottom ? '★last★' : ''}`
      );

    this.debugMode && this.debugToggler._parseNode && console.log(
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
    const currentOrParentElement = (isCurrentFirst && parent) ? parent : currentElement;

    this.debugMode && this.debugToggler._parseNode && console.log(
      ...consoleMark,
      'parent:', parent,
      '\n',
      'parentBottom:', parentBottom,
      '\n',
      'currentOrParentElement:', currentOrParentElement,
      '\n'
    );

    // THE END of content flow:
    // if there is no next element, then we are in a case
    // where the [data-content-flow-end] element is current.
    if (!nextElement) {
      this.debugMode && this.debugToggler._parseNode && console.groupEnd(...consoleMark, '🏁 THE END')
      return
    }

    // FORCED BREAK
    if (this.DOM.isForcedPageBreak(currentElement)) {
      // TODO I've replaced the 'next' with the 'current' - need to test it out
      this._registerPageStart(currentElement)
      this.debugMode && this.debugToggler._parseNode && console.groupEnd(...consoleMark, '🚩 FORCED BREAK');
      return
    }

    this.debugMode
      && console.assert( // is filtered in the function _gerChildren()
      this.DOM.getElementOffsetParent(currentElement),
      'it is expected that the element has an offset parent',
      currentElement);

    const newPageBottom = this.pages.at(-1).pageBottom;
    const nextElementTop = this.DOM.getElementRootedTop(nextElement, this.root);
    this.debugMode && this.debugToggler._parseNode && console.log(...consoleMark,
      '• newPageBottom', newPageBottom,
      '\n',
      '• nextElementTop',nextElementTop,
      );

    // TODO if next elem is SVG it has no offset Top!

    if (nextElementTop <= newPageBottom) {
      // * IF: nextElementTop <= newPageBottom,
      // * then currentElement fits.

      // ** Check for page break markers inside.
      // ** If there are - register new page starts.
      this.DOM.findAllForcedPageBreakInside(currentElement).forEach(
        element => this._registerPageStart(element)
      );
      // TODO: это может быть внутри таблицы или другого элемента,
      // который мы не хотим / не можем разбить обычным образом!
      // Нужно проверять currentElement

      // * ... then continue.
    } else {
      // * ELSE IF: nextElementTop > newPageBottom,
      // * nextElement does not start on the current page.
      // * Possible cases for the currentElement:
      // *** (0) in one piece should be moved to the next page
      // *** (1) is fit in one piece on the current page
      // *** (2) must be split

      // * Check the possibility of (0)
      if (this._isNoHanging(currentElement)) {
        // ** if currentElement can't be the last element on the page,
        // ** immediately move it to the next page:

        console.log('_isNoHanging', currentElement, currentOrParentElement)

        // TODO #tracedParent
        // this._registerPageStart(currentElement);
        // ** And if it's the first child, move the parent node to the next page.
        this._registerPageStart(currentElement, true); // @@@
        this.debugMode && this.debugToggler._parseNode && console.groupEnd(...consoleMark, '_isNoHanging(current)');
        return
      }

      // * Check the possibility of (1) or (0): on current or next page in one piece?

      // IMAGE with optional resizing
      // TODO float images

      if (this._isSVG(currentElement) || this._isIMG(currentElement)) {

        // TODO needs testing

        // svg has not offset props
        const currentImage = this._isSVG(currentElement)
        // TODO replace with setFlag... and remove wrapper function
        // TODO process at the beginning, find all SVG and set Flag
          ? this.DOM.wrapWithFlagNoBreak(currentElement)
          : currentElement;

        const availableSpace = newPageBottom - this.DOM.getElementRootedTop(currentImage, this.root);
        const currentImageHeight = this.DOM.getElementHeight(currentImage);
        const currentImageWidth = this.DOM.getElementWidth(currentImage);

        // TODO !!! page width overflow for SVG
        if (currentImageHeight < this.referenceWidth) {
          // just leave it on the current page
          this.debugMode && this.debugToggler._parseNode
          && console.warn('%c IMAGE is too wide', 'color: red');
        }

        // if it fits
        if (currentImageHeight < availableSpace) {
          // just leave it on the current page
          this._registerPageStart(nextElement);
          this.debugMode && this.debugToggler._parseNode && console.groupEnd(...consoleMark, 'register next');
          return
        }

        // if not, try to fit it
        const ratio = availableSpace / currentImageHeight;

        if (ratio > this.imageReductionRatio) {
          // leave it on the current page
          this._registerPageStart(nextElement);
          // and reduce it a bit
          this.DOM.fitElementWithinBoundaries({
            element: currentElement,
            height: currentImageHeight,
            width: currentImageWidth,
            vspace: availableSpace,
            hspace: this.referenceWidth
          });
          this.debugMode && this.debugToggler._parseNode && console.groupEnd(...consoleMark, 'register Next, reduce current element a bit');
          return
        }

        // otherwise move it to next page,
        // *** 'true':
        // *** add the possibility of moving it with the wrap tag
        // *** if it's the first child
        this._registerPageStart(currentImage, true);
        // and avoid page overflow if the picture is too big to fit on the page as a whole
        if (currentImageHeight > this.referenceHeight) {
          this.DOM.fitElementWithinBoundaries({
            element: currentElement,
            height: currentImageHeight,
            width: currentImageWidth,
            vspace: this.referenceHeight,
            hspace: this.referenceWidth
          });
        }
        this.debugMode && this.debugToggler._parseNode && console.groupEnd(...consoleMark, 'register and fit current Image');
        return
      }

      // * Check the possibility of (1) or (2): split or not?


      const currentElementBottom = parentBottom || this.DOM.getElementRootedRealBottom(currentElement, this.root);

      // IF currentElement does fit
      // in the remaining space on the page,
      if (currentElementBottom <= newPageBottom) {
        // we need <= because splitted elements often get equal height // todo comment

        // * AND it's being fulfilled:
        // *** nextElementTop > newPageBottom
        // * so this element cannot be the first child,
        // * because the previous element surely ends before this one begins,
        // * and so is its previous neighbor, not its parent.
        this._registerPageStart(nextElement);
        this.debugMode && this.debugToggler._parseNode && console.groupEnd(...consoleMark, 'register Next');
        return
      }

      // otherwise try to break it and loop the children:
      const children = this._getProcessedChildren(currentElement, newPageBottom, this.referenceHeight);

      // **
      // * The children are processed.
      // * Depending on the number of children:

      const childrenNumber = children.length;
      this.debugMode && this.debugToggler._parseNode && console.log(...consoleMark,
        'childrenNumber ', childrenNumber);
      this.debugMode && this.debugToggler._parseNode && console.log(...consoleMark,
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
        const isFullySPlittedParent = this._isFullySPlitted(currentElement);
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
        if (this._isNoHanging(previousElement)) {
          // ** if previousElement can't be the last element on the page,
          // ** move it to the next page.
          // TODO #_canNotBeLast
          // а если там подряд несколько заголовков, и перед previousElement
          //  есть еще заголовки, которые мы не проверяли еслтенствнно,
          //  и они будут висеть
          console.log('_isNoHanging previousElement', previousElement)

          this._registerPageStart(previousElement, true)
        } else {
          // TODO #tracedParent
          // this._registerPageStart(currentElement);
          this.debugMode && this.debugToggler._parseNode && console.log(
            ...consoleMark,
            '_registerPageStart (from _parseNode): \n',
            currentOrParentElement
          );
          this._registerPageStart(currentElement, true);
        }
      }
    }



    this.debugMode && this.debugToggler._parseNode && console.groupEnd(`%c_parseNode`);
  }

  _isFullySPlitted(node) {
    return (
      this._isPRE(node) ||
      this._isTableNode(node) ||
      this.DOM.isGridAutoFlowRow(node)
    );
  }

  _getProcessedChildren(node, firstPageBottom, fullPageHeight) {
    const consoleMark = ['%c_getProcessedChildren\n', 'color:white',];

    let children = [];

    if (this._isNoBreak(node)) {
      // don't break apart, thus keep an empty children array
      this.debugMode && this.debugToggler._getProcessedChildren && console.info(...consoleMark,
        '🧡 isNoBreak');
      children = [];
    } else if (this.DOM.isComplexTextBlock(node)) {
      this.debugMode && this.debugToggler._getProcessedChildren && console.info(...consoleMark,
        '💚 ComplexTextBlock', node);
      children = this._splitComplexTextBlockIntoLines(node) || [];
    } else if (this._isTextNode(node)) {
      this.debugMode && this.debugToggler._getProcessedChildren && console.info(...consoleMark,
        '💚 TextNode', node);
      // TODO: Compare performance of _splitComplexTextBlockIntoLines and _splitTextNode!
      // temporarily use the less productive function.

      // children = this._splitTextNode(node, firstPageBottom, fullPageHeight) || [];
      children = this._splitComplexTextBlockIntoLines(node) || [];
    } else if (this._isPRE(node)) {
      this.debugMode && this.debugToggler._getProcessedChildren && console.info(...consoleMark,
        '💚 PRE');
      children = this._splitPreNode(node, firstPageBottom, fullPageHeight) || [];
    } else if (this._isTableNode(node)) {
      this.debugMode && this.debugToggler._getProcessedChildren && console.info(...consoleMark,
        '💚 TABLE');
      children = this._splitTableNode(node, firstPageBottom, fullPageHeight) || [];

    } else if (this.DOM.isGridAutoFlowRow(node)) {
      // ** If it is a grid element.
      // ????? Process only some modifications of grids!
      // ***** There's an inline grid check here, too.
      // ***** But since the check for inline is below and real inline children don't get here,
      // ***** it is expected that the current element is either block or actually
      // ***** behaves as a block element in the flow thanks to its content.
      this.debugMode && this.debugToggler._getProcessedChildren && console.info(...consoleMark,
        '💜 GRID');
      children = this._splitGridNode(node, firstPageBottom, fullPageHeight) || [];


      // TODO LI: если в LI есть UL, маркер может оставаться на прежней странице - см. скрин в телеге.
      // } else if (this._isLiNode(node)) {
      //   // todo
      //   // now make all except UL unbreakable
      //   const liChildren = this._getChildren(node)
      //     .reduce((acc, child) => {
      //       if (this.DOM.getElementTagName(child) === 'UL') {
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
      children = this._getChildren(node);
      this.debugMode && this.debugToggler._getProcessedChildren && console.info(
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
      if (this.DOM.isInline(child)) {
        if (!complexTextBlock) {
          // the first inline child
          complexTextBlock = this.DOM.createComplexTextBlock();
          this.DOM.wrapNode(child, complexTextBlock);
          newChildren.push(complexTextBlock);
        }
        // not the first inline child
        this.DOM.insertAtEnd(complexTextBlock, child)
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

    this.debugMode
      && this.debugToggler._splitComplexTextBlockIntoLines
      && console.group('_splitComplexTextBlockIntoLines');
    this.debugMode
      && this.debugToggler._splitComplexTextBlockIntoLines
      && console.log('_splitComplexTextBlockIntoLines (node)', node);

    // TODO ЭТА ШТУКА ЗАПУСКАЕТСЯ ДВАЖДЫ!

    // TODO [html2pdf-splitted] SELECTOR
    if (this.DOM.isSelectorMatching(node, '[html2pdf-splitted]')) {

      this.debugMode
      && this.debugToggler._splitComplexTextBlockIntoLines
      && console.groupEnd('_splitComplexTextBlockIntoLines', [html2pdf-splitted]);
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
    // const nodeChildrenB = [...this.DOM.getChildren(b)].map(
    //   item => {return [
    //     item,
    //     item.innerHTML
    //   ]}
    // );
    // console.log(b, 'nodeChildrenB', nodeChildrenB);

    // console.log('\n\n\n\n\n\n');

    // Она уже обработана - можно просто взять детей ?? -- так разбивается только первая строка
    // TODO (вложенные не работают - теряется внутренний 2й как минимум)
    // const nodeChildren = [...this.DOM.getChildren(node)]; // а так не считывается текстовая нода
    // const nodeChildren = this._getChildren(node); // а так дважды обрабатывается _processInlineChildren
    // ? FIX was made in _getChildren(element)

    const nodeChildren = this._getChildren(node);

    const complexChildren = nodeChildren.map(
      element => {
        const lineHeight = this.DOM.getLineHeight(element);
        const height = this.DOM.getElementHeight(element);
        const left = this.DOM.getElementLeft(element);
        const top = this.DOM.getElementTop(element);
        const lines = ~~(height / lineHeight);
        const text = element.innerHTML;

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
      if ((item.lines > 1) && !this._isNoBreak(item.element)) {
        // TODO: add GROUP to no-break elements?
        item.element.classList.add('newComplexChildren🅱️');
        return this._breakItIntoLines(item.element); // array
      }
      // this.debugMode && console.log('%c no break ', 'color:red', item);
      // * otherwise keep the original element:
      return item.element;
    });

    // * Prepare an array of arrays containing references to elements
    // * that fit into the same row:
    const newComplexChildrenGroups = newComplexChildren.reduce(
      (result, currentElement, currentIndex, array) => {

        // * If BR is encountered, we start a new empty line:
        if(this.DOM.getElementTagName(currentElement) === 'BR' ) {
          result.at(-1).push(currentElement);
          result.push([]); // => will be: result.at(-1).length === 0;
          return result;
        }

        // * If this is the beginning, or if a new line:
        if(!result.length || this.DOM.isLineChanged(result.at(-1).at(-1), currentElement)) {
          result.push([currentElement]);
          return result;
        }

        // TODO: isLineChanged vs isLineKept: можно сделать else? они противоположны
        if(
          result.at(-1).length === 0 // the last element was BR
          || (result.length && this.DOM.isLineKept(result.at(-1).at(-1), currentElement))
        ) {
          result.at(-1).push(currentElement);
          return result;
        }

        this.debugMode
          // && this.debugToggler._parseNode
          && console.assert(
            true,
            'newComplexChildrenGroups: An unexpected case of splitting a complex paragraph into lines.',
            '\nOn the element:',
            currentElement
        );
      }, []
    );

    // Consider the paragraph partitioning settings:
    // * this.minBreakableLines
    // * this.minLeftLines
    // * this.minDanglingLines

    this.debugMode
        && this.debugToggler._splitComplexTextBlockIntoLines
        && console.log('🟡🟡🟡 newComplexChildrenGroups', newComplexChildrenGroups);

    if (newComplexChildrenGroups.length < this.minBreakableLines) {
      this.debugMode
        && this.debugToggler._splitComplexTextBlockIntoLines
        && console.log(
          'newComplexChildrenGroups.length < this.minBreakableLines',
          newComplexChildrenGroups.length, '<', this.minBreakableLines
        );
      this.debugMode
        && this.debugToggler._splitComplexTextBlockIntoLines
        && console.groupEnd('_splitComplexTextBlockIntoLines');
      // Not to break it up
      return []
    }

    const firstUnbreakablePart = newComplexChildrenGroups.slice(0, this.minLeftLines).flat();
    const lastUnbreakablePart = newComplexChildrenGroups.slice(-this.minDanglingLines).flat();
    newComplexChildrenGroups.splice(0, this.minLeftLines, firstUnbreakablePart);
    newComplexChildrenGroups.splice(-this.minDanglingLines, this.minDanglingLines, lastUnbreakablePart);

    // * Then collect the resulting children into rows
    // * which are not to be split further.
    const linedChildren = newComplexChildrenGroups.map(
      (arr, index) => {
        // * Create a new line
        const line = this.DOM.createWithFlagNoBreak();
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
        this.DOM.insertBefore(arr[0], line);
        this.DOM.insertAtEnd(line, ...arr);
        // * Return a new unbreakable line.
        return line;
      }
    );

    this.debugMode
      && this.debugToggler._splitComplexTextBlockIntoLines
      && console.groupEnd('_splitComplexTextBlockIntoLines');

    this.DOM.setAttribute(node, '[html2pdf-splitted]');

    return linedChildren
  }

  _breakItIntoLines(splittedItem) {

    if (this._isNoBreak(splittedItem)) {
      return splittedItem
    }

    // Split the splittedItem into spans.
    // * array with words:
    const itemWords = this.DOM.splitByWordsGreedyWithSpacesFilter(splittedItem);
    // * array with words wrapped with the inline tag 'html2pdf-word':
    const itemWrappedWords = itemWords.map((item, index) => {
      const span = this.DOM.create('html2pdf-word');
      span.dataset.index = index;
      span.innerHTML = item + WORD_JOINER;
      return span;
    });

    // Replacing the contents of the splittedItem with a span sequence:
    splittedItem.innerHTML = '';
    this.DOM.insertAtEnd(splittedItem, ...itemWrappedWords);

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
        const line = this.DOM.cloneNodeWrapper(splittedItem);
        this.DOM.setFlagNoBreak(line); // TODO ? 
        line.setAttribute('role', 'line-simplest');
        line.classList.add('cloned🅱️');
        const start = beginnerNumbers[currentIndex];
        const end = beginnerNumbers[currentIndex + 1];
        // need to add safety spaces at both ends of the line:
        const text = ' ' + itemWords.slice(start, end).join(WORD_JOINER) + WORD_JOINER + ' ';
        this.DOM.setInnerHTML(line, text);
        this.DOM.insertBefore(splittedItem, line);
        // Keep the ID only on the first clone
        (currentIndex > 0) && line.removeAttribute("id");

        result.push(line);
        return result;
      }, []);


    // * and then delete the source element.
    splittedItem.remove();

    return newLines;
  }

  _isVerticalFlowDisrupted(arrayOfElements) {
    return arrayOfElements.some(

      (current, currentIndex, array) => {
        const currentElement = current;
        const nextElement = array[currentIndex + 1];

        if (!nextElement) {
          return false
        };
        const isTrue = this.DOM.getElementRelativeBottom(currentElement) > this.DOM.getElementRelativeTop(nextElement);
        return isTrue;
      }
    )
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
      : this.DOM.getComputedStyle(node);

    const consoleMark = ['%c_splitPreNode\n', 'color:white',]
    this.debugMode && this.debugToggler._splitPreNode && console.group('%c_splitPreNode', 'background:cyan');
    this.debugMode && this.debugToggler._splitPreNode && console.log(...consoleMark, 'node', node);

    // Prepare node parameters
    const nodeTop = this.DOM.getElementRootedTop(node, this.root);
    const nodeHeight = this.DOM.getElementHeight(node);
    const nodeLineHeight = this.DOM.getLineHeight(node);
    const preWrapperHeight = this.DOM.getEmptyNodeHeight(node, false);

    // * Let's check the probable number of rows in the simplest case,
    // * as if the element had the style.whiteSpace=='pre'
    // * and the line would occupy exactly one line.
    const minNodeHeight = preWrapperHeight + nodeLineHeight * this.minPreBreakableLines;
    if (nodeHeight < minNodeHeight) {
      return []
    }

    const _children = this.DOM.getChildNodes(node);
    this.debugMode && this.debugToggler._splitPreNode && console.log('_children:', _children.length);
    if (_children.length == 0) {
      // ??? empty tag => not breakable
      return []
    } else if (_children.length > 1) {
      // ! if _children.length > 1
      // TODO check if there are NODES except text nodes
      // ! TODO
      return []
    } else { // * if _children.length == 1
      // * then it is a TEXT node and has only `\n` as a line breaker
      if (this.DOM.isElementNode(_children[0])) {
        // element node
        // TODO check if there are NODES except text nodes
        const currentElementNode = _children[0];
        this.debugMode && this.debugToggler._splitPreNode && console.warn("is Element Node", currentElementNode)
        // FIXME other cases i.e. node and we need recursion
        return []
      }
      if (this.DOM.isTextNode(_children[0])) {
        // if (textNode.nodeType === 3) // 3 - тип TextNode
        this.debugMode && this.debugToggler._splitPreNode && console.warn(`is TEXT Node: ${_children[0]}`);
        // FIXME other cases i.e. node and we need recursion
      }

      // ? wholeText vs textContent
      const currentNodeText = _children[0].wholeText;

      // * split the text node into lines by \n,
      // * leaving the character \n at the end of the resulting string:
      const stringsFromNodeText = this.DOM.splitByLinesGreedy(currentNodeText);

      if (stringsFromNodeText.length < this.minPreBreakableLines) {
        return []
      }

      // * Strings array normalization.
      // ** Get the first this.minPreFirstBlockLines elements
      // ** and concatenate them into a string
      const startString = stringsFromNodeText.splice(0, this.minPreFirstBlockLines).join('');
      // ** Get the first this.minPreLastBlockLines elements
      // ** and concatenate them into a string
      const endString = stringsFromNodeText.splice(-this.minPreLastBlockLines).join('');
      // ** Insert new rows into the array stringsFromNodeText
      stringsFromNodeText.unshift(startString);
      stringsFromNodeText.push(endString);

      // * Modifying DOM
      const linesFromNode = stringsFromNodeText.map(string => {
        const line = this.DOM.createWithFlagNoBreak();
        this.DOM.setInnerHTML(line, string);
        return line
      });
      this.debugMode && this.debugToggler._splitPreNode && console.log('linesFromNode', linesFromNode);
      this.DOM.replaceNodeContentsWith(node, ...linesFromNode);

      // * calculate parts

      // ** Prepare parameters for splitters calculation
      let firstPartSpace = pageBottom - nodeTop - preWrapperHeight;
      const fullPageSpace = fullPageHeight - preWrapperHeight;

      // * find starts of parts splitters

      let page = 0;
      let splitters = [];
      let floater = firstPartSpace;

      // *** need to make the getElementRootedTop work with root = node
      const initPosition = _nodeComputedStyle.position;
      if (initPosition != 'relative') {
        node.style.position = 'relative';
      }

      for (let index = 0; index < linesFromNode.length; index++) {
        const current = linesFromNode[index];
        const currentBottom = this.DOM.getElementRootedBottom(current, node);

        // TODO move to DOM
        if (currentBottom > floater) {
          // * start a new part at [index]
          index && splitters.push(index);
          // ? start a new page
          index && (page += 1);
          // * move the floater down:
          // ** if this is the very first element,
          // ** we just assume that the first part can take up the whole page.
          floater = index ? this.DOM.getElementRootedTop(current, node) + fullPageSpace : fullPageSpace;
        } // end for
      }

      // *** need to revert back to the original positioning of the node
      node.style.position = initPosition;

      if(!splitters.length) {
        // ** if there is no partitioning, we return an empty array
        // ** and the original node will be taken in its entirety.
        return []
      }

      // ******** ELSE:
      // * If there are parts here, and the node will be split, continue.
      // * Render new parts.

      // * The last part end is registered automatically.
      splitters.push(null);
      this.debugMode && this.debugToggler._splitPreNode && console.log(
        ...consoleMark,
        'splitters', splitters
      );

      const newPreElementsArray = splitters.map((id, index, splitters) => {
        // Avoid trying to break this node: createWithFlagNoBreak()
        // We can't wrap in createWithFlagNoBreak()
        // because PRE may have margins and that will affect the height of the wrapper.
        // So we will give the PRE itself this property.
        const part = this.DOM.cloneNodeWrapper(node);
        this.DOM.setFlagNoBreak(part);

        // id = the beginning of the next part
        const start = splitters[index - 1] || 0;
        const end = id || splitters[splitters.length];

        this.DOM.insertAtEnd(part, ...linesFromNode.slice(start, end));

        return part;
      });

      // * Mark nodes as parts
      this.DOM.markPartNodesWithClass(newPreElementsArray);

      this.debugMode && this.debugToggler._splitPreNode && console.log(
        ...consoleMark,
        'newPreElementsArray',
        newPreElementsArray
      );

      //// this.DOM.insertInsteadOf(node, ...newPreElementsArray);
      // * We need to keep the original node,
      // * we may need it as a parent in this._parseNode().
      this.DOM.replaceNodeContentsWith(node, ...newPreElementsArray);
      // * We "open" the slough node, but leave it.
      node.style.display = 'contents';
      node.setAttribute('slough-node', '')
      node.classList = '';

      this.debugMode && this.debugToggler._splitPreNode && console.groupEnd('%c_splitPreNode', 'background:cyan');

      return newPreElementsArray; 

    } // END OF * if _children.length == 1

    // TODO the same in splitTextNode - make one code piece

  }

  _insertTableSplit({ startId, endId, table, tableEntries }) {

    // this.debugMode && console.log(`=> _insertTableSplit(${startId}, ${endId})`);

    const tableWrapper = this.DOM.cloneNodeWrapper(table);

    const partEntries = tableEntries.rows.slice(startId, endId);

    const part = this.DOM.createWithFlagNoBreak();
    table.before(part);

    if (startId) {
      // if is not first part
      this.DOM.insertAtEnd(part, this.DOM.createSignpost('(table continued)', this.signpostHeight));
    }

    this.DOM.insertAtEnd(
      part,
      this.DOM.createTable({
        wrapper: tableWrapper,
        caption: this.DOM.cloneNode(tableEntries.caption),
        thead: this.DOM.cloneNode(tableEntries.thead),
        // tfoot,
        tbody: partEntries,
      }),
      this.DOM.createSignpost('(table continues on the next page)', this.signpostHeight)
    );

    return part
  };

  _splitTableNode(table, pageBottom, fullPageHeight) {
    // * Split simple tables, without regard to col-span and the like.
    // TODO test more complex tables

    this.DOM.lockTableWidths(table);

    const consoleMark = ['%c_splitTableNode\n', 'color:white',];
    this.debugMode && this.debugToggler._splitTableNode && console.time('_splitTableNode')
    this.debugMode && this.debugToggler._splitTableNode && console.group('%c_splitTableNode', 'background:cyan');
    this.debugMode && this.debugToggler._splitTableNode && console.log(...consoleMark, 'table', table);

    // calculate table wrapper (empty table element) height
    // to calculate the available space for table content
    const tableWrapperHeight = this.DOM.getEmptyNodeHeight(table);

    // tableEntries
    const tableEntries = this.DOM.getTableEntries(table);
    this.debugMode && this.debugToggler._splitTableNode && console.log(
      ...consoleMark,
      'tableEntries', tableEntries
    );

    if (tableEntries.rows.length < this.minBreakableRows) {
      this.debugMode && this.debugToggler._splitTableNode && console.groupEnd('%c_splitTableNode', 'background:cyan');
      return []
    }

    // Prepare node parameters
    const tableTop = this.DOM.getElementRootedTop(table, this.root);
    const tableHeight = this.DOM.getElementHeight(table);
    const tableCaptionHeight = this.DOM.getElementHeight(tableEntries.caption) || 0;
    const tableTheadHeight = this.DOM.getElementHeight(tableEntries.thead) || 0;
    const tableTfootHeight = this.DOM.getElementHeight(tableEntries.tfoot) || 0;
    // *** Convert NULL/Undefined to 0
    // *** The logical nullish assignment (??=) operator
    const captionFirefoxAmendment = (tableCaptionHeight ?? 0) * (this.isFirefox ?? 0);

    const firstPartHeight = pageBottom
      - tableTop
      - this.signpostHeight - tableWrapperHeight;

    const fullPagePartHeight = fullPageHeight
      - tableCaptionHeight // * copied into each part
      - tableTheadHeight // * copied into each part
      - tableTfootHeight // * remains in the last part (in the table)
      - 2 * this.signpostHeight - tableWrapperHeight;

    this.debugMode && this.debugToggler._splitTableNode && console.log(
      ...consoleMark,
      'pageBottom', pageBottom,
      '\n',
      '- tableTop', tableTop,
      '\n',
      '- tableWrapperHeight', tableWrapperHeight,
      '\n',
      '- this.signpostHeight', this.signpostHeight,
      '\n',
      '= firstPartHeight', firstPartHeight,
    );
    this.debugMode && this.debugToggler._splitTableNode && console.log(
      ...consoleMark,
      'fullPageHeight', fullPageHeight,
      '\n',
      '- tableCaptionHeight', tableCaptionHeight,
      '\n',
      '- tableTheadHeight', tableTheadHeight,
      '\n',
      '- tableTfootHeight', tableTfootHeight,
      '\n',
      '- 2 * this.signpostHeight', (2 * this.signpostHeight),
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

      const currTop = this.DOM.getElementRootedTop(currentRow, table) + captionFirefoxAmendment;

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
          const splittingRowHeight = this.DOM.getElementHeight(splittingRow);
          const splittingMinRowHeight = this.DOM.getTableRowHeight(splittingRow, this.minBreakableRows);
          const splittingEmptyRowHeight = this.DOM.getTableRowHeight(splittingRow);
          const splittingRowTop = this.DOM.getElementRootedTop(splittingRow, table) + captionFirefoxAmendment;

          const isNoBreak = this.DOM.isNoBreak(splittingRow);
          const makesSenseToSplitTheRow = (splittingRowHeight >= splittingMinRowHeight) && (!isNoBreak);


          if (makesSenseToSplitTheRow) {
            // * Let's split table row [index - 1]

            this.debugMode
              && this.debugToggler._splitTableRow
              && console.group(`🟣🟣🟣 Split The Row ${index - 1}`);

            const rowFirstPartHeight = firstPartHeight - splittingEmptyRowHeight - splittingRowTop; // TODO
            const rowFullPageHeight = fullPagePartHeight - splittingEmptyRowHeight;

            const splittingRowTDs = this.DOM.getChildren(splittingRow);

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

            this.debugMode
              && this.debugToggler._splitTableRow
              && console.log('🟣 \ntheRowContentSlicesByTD', theRowContentSlicesByTD);

            const shouldFirstPartBeSkipped = theRowContentSlicesByTD.some(obj => {
              this.debugMode
                && this.debugToggler._splitTableRow
                && console.log('🟣', '\nobj.result.length', obj.result.length, '\nobj.result[0]', obj.result[0]);
              return (obj.result.length && obj.result[0] === null)
            });

            this.debugMode
              && this.debugToggler._splitTableRow
              && console.log('🟣', '\nshouldFirstPartBeSkipped', shouldFirstPartBeSkipped);

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

            this.debugMode
              && this.debugToggler._splitTableRow
              && console.log('🟣', '\n theRowContentSlicesByTD', theRowContentSlicesByTD);

            const ifThereIsSplit = theRowContentSlicesByTD.some(obj => {
              return obj.result.length
            });
            this.debugMode
              && this.debugToggler._splitTableRow
              && console.log('🟣 ifThereIsSplit', ifThereIsSplit);

            // !
            if (ifThereIsSplit) {

              const theTdContentElements = theRowContentSlicesByTD.map(el => {
                if(el.result.length) {
                  return this._createSlicesBySplitFlag(el.trail)
                } else {
                  // * el.result === 0
                  // один раз полностью копируем весь контент из столбца
                  const sliceWrapper = this.DOM.createWithFlagNoBreak();
                  sliceWrapper.classList.add("🟣");
                  sliceWrapper.display = 'contents';

                  const contentElements = el.trail.map(item => item.element);
                  this.DOM.insertAtEnd(sliceWrapper, ...contentElements);

                  return [sliceWrapper]
                }
              });

              this.debugMode
                && this.debugToggler._splitTableRow
                && console.log('🟣 theTdContentElements', theTdContentElements);

              const theNewTrCount = Math.max(...theTdContentElements.map(arr => arr.length));
              this.debugMode
                && this.debugToggler._splitTableRow
                && console.log('🟣 theNewTrCount', theNewTrCount);

              const theNewRows = [];
              for (let i = 0; i < theNewTrCount; i++) {
                const rowWrapper = this.DOM.cloneNodeWrapper(splittingRow);
                this.DOM.setFlagNoBreak(rowWrapper);

                [...splittingRowTDs].forEach(
                  (td, tdID) => {
                    const tdWrapper = this.DOM.cloneNodeWrapper(td);
                    const content = theTdContentElements[tdID][i];
                    content && this.DOM.insertAtEnd(tdWrapper, theTdContentElements[tdID][i]);
                    this.DOM.insertAtEnd(rowWrapper, tdWrapper);
                  }
                );

                theNewRows.push(rowWrapper);
              }

              this.debugMode
                && this.debugToggler._splitTableRow
                && console.log('🟣', '\n theNewRows', theNewRows);

              // добавляем строки в массив и в таблицу

              splittingRow.className = 'splittingRow' // for test
              this.debugMode
                && this.debugToggler._splitTableRow
                && console.log('🟣 splittingRow', splittingRow);
              this.DOM.insertInsteadOf(splittingRow, ...theNewRows)

              // меняем исходный массив строк таблицы!
              tableEntries.rows.splice(splittingRowIndex, 1, ...theNewRows);
              // и обновляем рабочий массив включающий футер
              distributedRows = getDistributedRows(tableEntries);

              index = index - 1;
              // При этом шаг цикла возвращается на 1 назад;
              // и мы проверяем 2 разбитых куска (i & i-1),
              // но они с флагом "не разбивать"

            } //? END OF ifThereIsSplit

            this.debugMode
              && this.debugToggler._splitTableRow
              && console.groupEnd(`🟣🟣🟣 Split The Row ${index - 1}`);

          } //? END OF 'if makesSenseToSplitTheRow'
          else {
            // TODO проверять это ТОЛЬКО если мы не можем разбить
            if (index > this.minLeftRows) {
              // * avoid < minLeftRows rows on first page
              // *** If a table row starts in the next part,
              // *** register the previous one as the beginning of the next part.
              // *** In the other case, we do not register a page break,
              // *** and the first small piece will be skipped.
              splitsIds.push(index - 1);
            }

            currentPageBottom =
            this.DOM.getElementRootedTop(
              distributedRows[index - 1], table
            ) + captionFirefoxAmendment
            + fullPagePartHeight;
          }

        } //? END OF trying to split long TR


        // check if next fits

      }
    }; //? END OF for: distributedRows

    this.debugMode && this.debugToggler._splitTableNode && console.log(
      ...consoleMark,
      'splitsIds', splitsIds
    );

    if (!splitsIds.length) {
      this.debugMode && this.debugToggler._splitTableNode && console.groupEnd('%c_splitTableNode', 'background:cyan');
      return []
    }

    // * avoid < minDanglingRows rows on last page
    // ! distributedRows модифицировано
    const maxSplittingId = (distributedRows.length - 1) - this.minDanglingRows;
    if (splitsIds[splitsIds.length - 1] > maxSplittingId) {
      splitsIds[splitsIds.length - 1] = maxSplittingId;
    }

    const splits = splitsIds.map((value, index, array) => this._insertTableSplit({
      startId: array[index - 1] || 0,
      endId: value,
      table,
      tableEntries,
    }))

    this.debugMode && this.debugToggler._splitTableNode && console.log(
      ...consoleMark,
      'splits', splits
    );

    // create LAST PART
    const lastPart = this.DOM.createWithFlagNoBreak();
    table.before(lastPart);
    this.DOM.insertAtEnd(
      lastPart,
      this.DOM.createSignpost('(table continued)', this.signpostHeight),
      table
    );

    this.debugMode && this.debugToggler._splitTableNode && console.timeEnd('_splitTableNode');
    this.debugMode && this.debugToggler._splitTableNode && console.groupEnd('%c_splitTableNode', 'background:cyan');

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

    const sliceWrapper = this.DOM.createWithFlagNoBreak();
    sliceWrapper.classList.add("🧰");
    sliceWrapper.display = 'contents';

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
        this.DOM.insertAtEnd(currentWrapper, child);
        currentWrapper = child;
      }

      this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log(' createWrapperFromArray:', wrapper);
      return wrapper;
    }

    const processChildren = (children, parent = null) => {
      this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.group('processChildren');
      this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('*start* children', children)

      for (let i = 0; i < children.length; i++) {
        processObj(children[i]);
      }

      this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('- wrappers BEFORE pop:', [...wrappers]);
      const a = wrappers.pop();
      this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('- wrappers.pop()', a);
      this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('- parent', parent);
      this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('- wrappers AFTER pop:', [...wrappers]);

      currentTargetInSlice = wrappers.at(-1);
      // TODO сделать функцию
      this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('🎯🎯 currentTargetInSlice', currentTargetInSlice)
      this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('🎯 wrappers.at(-1)', wrappers.at(-1))
      this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('*END* children', children)
      this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.groupEnd('processChildren');
    }

    const processObj = (obj) => {

      const hasChildren = obj.children?.length > 0;
      const hasSplitFlag = obj.split;
      const currentElement = obj.element;
      const id = obj.id;

      this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.group(`processObj # ${id}`); // Collapsed
      this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('currentElement', currentElement);
      currentElement && this.DOM.removeNode(currentElement);

      if(hasSplitFlag) {
        this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('••• hasSplitFlag');
        // start new object
        // const currentWrapper = slices.at(-1);
        // const nextWrapper = this.DOM.cloneNode(currentWrapper);
        wrappers = wrappers.map(wrapper => {
          const clone = this.DOM.cloneNodeWrapper(wrapper); // ???? может делать клоны не тут а при создании?
          clone.classList.add("🚩");
          return clone
        });
        this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('• hasSplitFlag: NEW wrappers.map:', [...wrappers]);
        const nextWrapper = createWrapperFromArray(wrappers);

        slices.push(nextWrapper);
        this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('• hasSplitFlag: slices.push(nextWrapper):', [...slices]);
        // find container in new object
        // currentTargetInSlice = this.DOM.findDeepestChild(nextWrapper);
        currentTargetInSlice = wrappers.at(-1);
        this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('• hasSplitFlag: currentTargetInSlice:', currentTargetInSlice);
      }

      // TODO проверить, когда есть оба флага

      if(hasChildren) {
        this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('••• hasChildren');
        // make new wrapper
        const cloneCurrentElementWrapper = this.DOM.cloneNodeWrapper(currentElement);

        // add cloneCurrentElementWrapper to wrappers
        wrappers.push(cloneCurrentElementWrapper); // ???????????

        this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('• hasChildren: wrappers.push(cloneCurrentElementWrapper)', cloneCurrentElementWrapper, [...wrappers]);
        // add cloneCurrentElementWrapper to slice
        this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('• hasChildren: currentTargetInSlice (check):', currentTargetInSlice);

        if(currentTargetInSlice) {
          this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('• hasChildren: currentTargetInSlice', 'TRUE, add to existing', cloneCurrentElementWrapper);
          // add to existing as a child
          this.DOM.insertAtEnd(currentTargetInSlice, cloneCurrentElementWrapper);
        } else {
          this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('• hasChildren: currentTargetInSlice', 'FALSE, init the first', cloneCurrentElementWrapper);
          // init the first
          cloneCurrentElementWrapper.classList.add('🏁first');
          cloneCurrentElementWrapper.style.background = 'yellow';
          slices.push(cloneCurrentElementWrapper);
          this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('• hasChildren: slices.push(cloneCurrentElementWrapper)', cloneCurrentElementWrapper, [...slices]);
        }
        // update wrapper bookmark
        currentTargetInSlice = wrappers.at(-1) // = cloneCurrentElementWrapper
        this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('• hasChildren:  currentTargetInSlice (=):', currentTargetInSlice);


        processChildren(obj.children, currentElement);

      } else { // !!! внесли под ELSE

        // insert current Element
        currentTargetInSlice = wrappers.at(-1);
        this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('insert currentElement', currentElement, 'to target', currentTargetInSlice);
        this.DOM.insertAtEnd(currentTargetInSlice, currentElement);
      }


      this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.groupEnd(`processObj # ${id}`);
    }

    this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('#######  currentTargetInSlice (=):', currentTargetInSlice);

    processChildren(inputArray);

    this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.log('slices:', slices)
    this.debugMode && this.debugToggler._createSlicesBySplitFlag && slices.forEach(slice => console.log('slice:', slice))

    this.debugMode && this.debugToggler._createSlicesBySplitFlag && console.groupEnd('%c_createSlicesBySplitFlag')
    return slices
  }

  _getInternalSplitters({
    rootNode,
    children,
    pageBottom,
    firstPartHeight,
    fullPageHeight,
    result = [],
    trail = [],
    indexTracker = [],
    stack = [],
  }) {

    this.debugMode
      && this.debugToggler._getInternalSplitters
      && console.group('💟 _getInternalSplitters'); // Collapsed

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
      this.debugMode && this.debugToggler._getInternalSplitters && console.assert((id >= 0), `registerResult: ID mast be provided`, element);

      let theElementObject = trail[id]; // * contender without special cases
      let theElementIndexInStack; // ***

      this.debugMode && this.debugToggler._getInternalSplitters && console.groupCollapsed('💜💜💜 registerResult(element, id)');

      this.debugMode
        && this.debugToggler._getInternalSplitters
        && console.log(
          '\n element', element,
          '\n id', id,
          '\n theElementObject (trail[id])', theElementObject,
          '\n theElementIndexInStack', theElementIndexInStack,
      );

      if (id == 0) {
        // если первый ребенок,
        // ищем самую внешнюю оболочку, которая тоже первый ребенок первого ребенка...

        const topParentElementFromStack = findFirstNullIDInContinuousChain(stack);

        this.debugMode
          && this.debugToggler._getInternalSplitters
          && console.log(
            '💜💜 id == 0',
            '\n💜 [...stack]', [...stack],
            '\n💜 topParentElementFromStack', topParentElementFromStack,
          );

        if(topParentElementFromStack.item) {
          theElementObject = topParentElementFromStack.item;
          theElementIndexInStack = topParentElementFromStack.index;
        }

      }

      this.debugMode
        && this.debugToggler._getInternalSplitters
        && console.log('💜',
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

        this.debugMode
          && this.debugToggler._getInternalSplitters
          && console.log(
            'result.push(null)',
            '\n\n💜💜💜',
          );
      } else {
        result.push(theElementObject.element); // * it is used to calculate the height of a piece
        theElementObject && (theElementObject.split = true);

        this.debugMode
          && this.debugToggler._getInternalSplitters
          && console.log(
            '\n theElementObject', theElementObject,
            '\n theElementObject.element', theElementObject.element,
            '\n result.push(theElementObject.element)',
            '\n\n💜💜💜 ',
          );
      }

      this.debugMode && this.debugToggler._getInternalSplitters && console.groupEnd('💜💜💜 registerResult(element, id)');
    }

    this.debugMode
      && this.debugToggler._getInternalSplitters
      && console.log(
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
      const nextElementTop = nextElement ? this.DOM.getElementRootedTop(nextElement, rootNode): undefined;

      // nextElement && console.log(
      //   'ddddd',
      //   this.DOM.getElementRootedTop(nextElement, rootNode),
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
          : fullPageHeight + this.DOM.getElementRootedTop(result.at(-1), rootNode)
        );

      if (this.DOM.isForcedPageBreak(currentElement)) {
        //register

        // TODO #ForcedPageBreak
        this.debugMode
          && this.debugToggler._getInternalSplitters
          && console.warn(
            currentElement, '💟 is isForcedPageBreak'
          );
      }

      // TODO:
      // nextElementTop?
      // nextElement?

      if (nextElementTop <= floater) {
        // -- current fits

        // this.debugMode
        //     && this.debugToggler._getInternalSplitters
        //     && console.log('💟💟 nextElementTop <= floater // current fits');

        if (this._isNoHanging(currentElement)) {
          // -- current fits but it can't be the last

          this.debugMode
            && this.debugToggler._getInternalSplitters
            && console.log('💟💟 currentElement _isNoHanging');

          registerResult(currentElement, i);
        }
        // go to next index
      } else { // nextElementTop > floater
              // currentElement ?

        this.debugMode
          && this.debugToggler._getInternalSplitters
          && console.log('💟💟', `nextElementTop > floater \n ${nextElementTop} > ${floater} `,);

        if (this._isSVG(currentElement) || this._isIMG(currentElement)) {
          // TODO needs testing
          this.debugMode
            && this.debugToggler._getInternalSplitters
            && console.log('%cIMAGE 💟💟', 'color:red;text-weight:bold')
        }

        const currentElementBottom = this.DOM.getElementRootedRealBottom(currentElement, rootNode);

        this.debugMode
          && this.debugToggler._getInternalSplitters
          && console.log('💟💟 current ???',
          '\n currentElement', currentElement,
          '\n currentElementBottom', currentElementBottom,
          '\n floater', floater
        );

        // IF currentElement does fit
        // in the remaining space on the page,
        if (currentElementBottom <= floater) {

          this.debugMode
            && this.debugToggler._getInternalSplitters
            && console.log('💟💟💟 currentElementBottom <= floater');

          // ** add nextElement check (undefined as end)
          if(nextElement) {
            this.debugMode
            && this.debugToggler._getInternalSplitters
            && console.log('💟💟💟💟 register nextElement');
            trail.push(newObjectFromNext);
            registerResult(nextElement, i + 1);
          } // else - this is the end of element list

          this.debugMode
            && this.debugToggler._getInternalSplitters
            && console.groupEnd('💟 _getInternalSplitters');

        } else {
          // currentElementBottom > floater
          // try to split
          this.debugMode
            && this.debugToggler._getInternalSplitters
            && console.log('💟💟💟 currentElementBottom > floater, \ntry to split', currentElement);

          const currentElementChildren = this._getProcessedChildren(currentElement, pageBottom, fullPageHeight);

          // * Parse children:
          if (currentElementChildren.length) {

            // *** add wrapper ID
            updateIndexTracker(i);

            stack.push(newObject);

            // * Process children if exist:
            this._getInternalSplitters({
              rootNode,
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

            this.debugMode
              && this.debugToggler._getInternalSplitters
              && console.log('🟪 back from _getInternalSplitters;\n trail[i]', trail[i]);
            // *** END of 'has children'

          } else {
            // * If no children,
            // * move element to the next page.
            // ** But,
            if (previousElement && this._isNoHanging(previousElement)) {
              // ** if previousElement can't be the last element on the page,
              // ** move it to the next page.
              // TODO #_canNotBeLast
              // а если там подряд несколько заголовков, и перед previousElement есть еще заголовки, которые мы не проверяли еслтенствнно, и они будут висеть
              // this._registerPageStart(previousElement)
              this.debugMode && this.debugToggler._getInternalSplitters && console.log('previousElement _isNoHanging')
              registerResult(previousElement, i - 1);
            } else {
              // TODO #tracedParent
              // this._registerPageStart(currentElement);
              // this._registerPageStart(currentOrParentElement);
              this.debugMode
                && this.debugToggler._getInternalSplitters
                && console.log(currentElement, 'currentElement has no children')
              registerResult(currentElement, i);
            }
          } // *** END of 'no children'
        } // *** END of 'currentElementBottom > floater'

      }
    }

    // *** remove last wrapper ID after children processing is complete
    updateIndexTracker();

    this.debugMode
      && this.debugToggler._getInternalSplitters
      && console.groupEnd('💟 _getInternalSplitters');
    return {result, trail}
  }

  _splitGridNode(node, pageBottom, fullPageHeight) {
    // * Split simple grids,
    // * consider that templating is used, but there is no content in complex areas.
    // * If something unclear is encountered - do not split at all.
    // TODO (shall we scale?).

    const consoleMark = ['%c_splitGridNode\n', 'color:white',];
    this.debugMode && this.debugToggler._splitGridNode && console.group('_splitGridNode');

    // this.debugMode && this.debugToggler._splitGridNode && console.log(
    //   ...consoleMark,
    //   'node', this.DOM.getComputedStyle(node)
    // );

    // ** Take the node children.
    const children = this._getChildren(node);
    this.debugMode && this.debugToggler._splitGridNode && console.log(
      ...consoleMark,
      'children', children
    );

    // ** Organize the children into groups by rows.
    const childrenGroups = children.reduce(
      (result, currentElement, currentIndex, array) => {

        const currentStyle = this.DOM.getComputedStyle(currentElement);
        // this.debugMode && this.debugToggler._splitGridNode && console.log(
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
          top: this.DOM.getElementTop(currentElement)
        };

        this.debugMode && this.debugToggler._splitGridNode && console.log(
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
            && this._isNoHanging(result.at(-1).at(-1).element)
          ) {
            // ** If the previous last element cannot be the last element,
            // ** add to the previous group.
            this.debugMode
              && this.debugToggler._splitGridNode
              && console.log('%cLAST','color:red')
            result.at(-1).push(newItem);
          } else {
            // * Add a new group and a new item in it:
            result.push([newItem]);
          }
          this.debugMode && this.debugToggler._splitGridNode && console.log(
            ...consoleMark,
            'IF new:', newItem, [...result]
          );
          return result
        } if(result.length && (result.at(-1).at(-1).start < newItem.start)) {
          // * If the order number is increasing, it is a grid row continuation.
          // * Add a new element to the end of the last group:
          result.at(-1).push(newItem);
          this.debugMode && this.debugToggler._splitGridNode && console.log(
            ...consoleMark,
            'IF new:', newItem, [...result]
          );
          return result
        }

        this.debugMode
          && console.assert(
            true,
            '_splitGridNode: An unexpected case of splitting a grid.',
            '\nOn the element:',
            currentElement
        );
      }, []
    );
    this.debugMode && this.debugToggler._splitGridNode && console.log(
      ...consoleMark,
      'childrenGroups', childrenGroups
    );

    const nodeRows = childrenGroups.length;
    const nodeHeight = this.DOM.getElementHeight(node);

    // ** If there are enough rows for the split to be readable,
    // ** and the node is not too big (because of the content),
    // ** then we will split it.
    if (nodeRows < this.minBreakableGridRows && nodeHeight < fullPageHeight) {
      // ** Otherwise, we don't split it.
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
      // this.DOM.getElementRootedTop(nodeEntries.tfoot, node) || nodeHeight


    this.debugMode && this.debugToggler._splitGridNode && console.log(
      ...consoleMark,
      'topRowPoints', topRowPoints
    );

    // ** Calculate the possible parts.
    // TODO: same as the table

    // ** Prepare node parameters
    const nodeTop = this.DOM.getElementRootedTop(node, this.root);
    const nodeWrapperHeight = this.DOM.getEmptyNodeHeight(node);
    const firstPartHeight = pageBottom
      - nodeTop
      // - this.signpostHeight
      - nodeWrapperHeight;
    const fullPagePartHeight = fullPageHeight
      // - 2 * this.signpostHeight
      - nodeWrapperHeight;

      this.debugMode && this.debugToggler._splitGridNode && console.log('firstPartHeight', firstPartHeight);
      this.debugMode && this.debugToggler._splitGridNode && console.log('fullPagePartHeight', fullPagePartHeight);

    // TODO 1267 -  как в таблице

    // * Calculate grid Splits Ids

    const topsArr = topRowPoints;

    let splitsIds = [];
    let currentPageBottom = firstPartHeight;

    for (let index = 0; index < topsArr.length; index++) {

      if (topsArr[index] > currentPageBottom) {

        // TODO split long TR
        // когда много диаграмм, или очень длинный текст

        if (index > this.minLeftRows) {
          // * avoid < minLeftRows rows on first page
          // *** If a table row starts in the next part,
          // *** register the previous one as the beginning of the next part.
          splitsIds.push(index - 1);
        }

        currentPageBottom = topsArr[index - 1] + fullPagePartHeight;

        // check if next fits

      }
    };

    this.debugMode && this.debugToggler._splitGridNode && console.log('splitsIds', splitsIds);

    const insertGridSplit = (startId, endId) => {
      // * The function is called later.
      // TODO Put it in a separate method: THIS AND TABLE

      this.debugMode && this.debugToggler._splitGridNode && console.log(
        ...consoleMark, `=> insertGridSplit(${startId}, ${endId})`
      );

      // const partEntries = nodeEntries.rows.slice(startId, endId);
      const partEntries = childrenGroups
        .slice(startId, endId)
        .flat()
        .map(obj => obj.element);
      this.debugMode && this.debugToggler._splitGridNode && console.log(
        ...consoleMark, `partEntries`, partEntries
      );

      // const part = this.DOM.createWithFlagNoBreak();
      // ! Do not wrap nodes so as not to break styles.
      // TODO - Check for other uses of createWithFlagNoBreak to see if the wrapper can be avoided.

      const part = this.DOM.cloneNodeWrapper(node);
      this.DOM.copyNodeWidth(part, node);
      this.DOM.setFlagNoBreak(part);
      node.before(part);

      if (startId) {
        // if is not first part
        // this.DOM.insertAtEnd(part, this.DOM.createSignpost('(table continued)', this.signpostHeight));

        // TODO: insertions between parts will not disturb the original layout & CSS.
        // Therefore, it is possible to insert an element after and before the parts
        // and specify that the node is being broken.
      }

      // в таблице другое
      // this.DOM.insertAtEnd(
      //   part,
      //   this.DOM.createTable({
      //     wrapper: nodeWrapper,
      //     caption: this.DOM.cloneNode(nodeEntries.caption),
      //     thead: this.DOM.cloneNode(nodeEntries.thead),
      //     // tfoot,
      //     tbody: partEntries,
      //   }),
      //   this.DOM.createSignpost('(table continues on the next page)', this.signpostHeight)
      // );
      // this.DOM.insertAtEnd(part, nodeWrapper);
      this.DOM.insertAtEnd(part, ...partEntries);

      return part
    };


    const splits = splitsIds.map((value, index, array) => insertGridSplit(array[index - 1] || 0, value))

    this.debugMode && this.debugToggler._splitGridNode && console.log(
      ...consoleMark,
      'splits', splits
    );

    // create LAST PART
    // TODO ??? is that really needed?
    // const lastPart = this.DOM.createWithFlagNoBreak();
    // node.before(lastPart);
    // this.DOM.insertAtEnd(
    //   lastPart,
    //   // this.DOM.createSignpost('(table continued)', this.signpostHeight),
    //   node
    // );

    // LAST PART handling
    this.DOM.setFlagNoBreak(node);

    this.debugMode && this.debugToggler._splitGridNode && console.groupEnd('_splitGridNode')
    // return children;
    return [...splits, node]
  }

  // TODO split text with BR
  // TODO split text with A (long, splitted) etc.

  _splitTextNode(node, pageBottom, fullPageHeight) {

    // Prepare node parameters
    const nodeTop = this.DOM.getElementRootedTop(node, this.root);
    const nodeHeight = this.DOM.getElementHeight(node);
    const nodeLineHeight = this.DOM.getLineHeight(node);

    // Prepare parameters for splitters calculation
    const availableSpace = pageBottom - nodeTop;

    const nodeLines = ~~(nodeHeight / nodeLineHeight);
    const pageLines = ~~(fullPageHeight / nodeLineHeight);
    const firstPartLines = ~~(availableSpace / nodeLineHeight);

    // calculate approximate splitters
    const approximateSplitters = calculateSplitters({
      nodeLines: nodeLines,
      pageLines: pageLines,
      firstPartLines: firstPartLines,
      // const
      minBreakableLines: this.minBreakableLines,
      minLeftLines: this.minLeftLines,
      minDanglingLines: this.minDanglingLines,
    });

    // this.debugMode && console.log('approximateSplitters', approximateSplitters);

    if (approximateSplitters.length < 2) {
      // this.debugMode && console.log(' ... do not break', node);
      return []
    }

    // Split this node:

    const {
      splittedNode,
      nodeWords,
      nodeWordItems,
    } = this.DOM.prepareSplittedNode(node);

    // CALCULATE exact split IDs
    const exactSplitters = approximateSplitters.map(
      ({ endLine, splitter }) =>
        splitter
          ? findSplitId({
            arr: nodeWordItems,
            floater: splitter,
            topRef: endLine * nodeLineHeight,
            getElementTop: this.DOM.getElementRelativeTop, // we are inside the 'absolute' test node
            root: this.root
          })
          : null
    );

    const splitsArr = exactSplitters.map((id, index, exactSplitters) => {
      // Avoid trying to break this node: createWithFlagNoBreak()
      const part = this.DOM.createWithFlagNoBreak();

      const start = exactSplitters[index - 1] || 0;
      const end = id || exactSplitters[exactSplitters.length];

      this.DOM.setInnerHTML(part, nodeWords.slice(start, end).join(WORD_JOINER) + WORD_JOINER);

      return part;
    });

    this.DOM.insertInsteadOf(splittedNode, ...splitsArr);

    return splitsArr;

    // todo
    // последняя единственная строка - как проверять?
    // смотреть, если эта НОДА - единственный или последний потомок своего родителя

  }

  _getChildren(element) {
    // Check children:
    // TODO variants
    // TODO last child
    // TODO first Li

    // fon display:none / contents
    // this.DOM.getElementOffsetParent(currentElement)

    // TODO: to do this check more elegant
    // SEE the context here:
    // _splitComplexTextBlockIntoLines(node)
    // ...
    // const nodeChildren = this._getChildren(node);
    // * _processInlineChildren (makes ComplexTextBlock) is running extra on complex nodes
    if (this.DOM.isComplexTextBlock(element)) {
      return [...this.DOM.getChildren(element)]

    } else {

      let childrenArr = [...this.DOM.getChildNodes(element)]
        .reduce(
          (acc, item) => {

            // * filter STYLE, use element.tagName
            if (this._isSTYLE(item)) {
              return acc;
            }

            // * wrap text node, use element.nodeType
            if (this.DOM.isSignificantTextNode(item)) {
              acc.push(this.DOM.wrapTextNode(item));
              return acc;
            }

            // * no offset parent (contains)
            if (!this.DOM.getElementOffsetParent(item)) {
              const ch = this._getChildren(item);
              ch.length > 0 && acc.push(...ch);
              return acc;
            }

            // * normal
            if (this.DOM.isElementNode(item)) {
              acc.push(item);
              return acc;
            };

          }, [])

          if (this._isVerticalFlowDisrupted(childrenArr)) {
            // * If the vertical flow is disturbed and the elements are side by side:
            childrenArr = this._processInlineChildren(childrenArr);
          }

      return childrenArr;
    }
  }

  _isSignificantChild(child) {
    const tag = this.DOM.getElementTagName(child);

    // TODO isSignificantChild
    // If my nodeName is #text, my height is always undefined
    return (tag !== 'A' && tag !== 'TT' && this.DOM.getElementHeight(child) > 0);
  }

  _prepareNoHangingSelector(string) {
    const arr = string?.length ? string?.split(/\s+/) : [];
    return ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', ...arr]
  }

  _prepareForcedPageBreakSelector(string) {
    // * The settings may pass an empty string, prevent errors here.
    return string?.length ? string?.split(/\s+/) : [];
  }

  _prepareNoBreakSelector(string) {
    // TODO the same as _prepareForcedPageBreakSelector!
    // * The settings may pass an empty string, prevent errors here.
    return string?.length ? string?.split(/\s+/) : [];
  }

  _isSTYLE(element) {
    return this.DOM.getElementTagName(element) === 'STYLE'
  }

  _isPRE(element) {
    return this.DOM.getElementTagName(element) === 'PRE'
  }

  _isIMG(element) {
    return this.DOM.getElementTagName(element) === 'IMG'
  }

  _isSVG(element) {
    return this.DOM.getElementTagName(element) === 'svg'
  }

  _isTextNode(element) {
    return this.DOM.isWrappedTextNode(element);
  }

  _isTableNode(element) {
    return this.DOM.getElementTagName(element) === 'TABLE';
  }

  _isLiNode(element) {
    return this.DOM.getElementTagName(element) === 'LI';
  }

  _isNoBreak(element) {
    return this.DOM.isNoBreak(element)
        || this.DOM.isInlineBlock(element)
        || this._notSolved(element);
  }

  _isNoHanging(element) {
    return this.DOM.isNoHanging(element);
  }

  _notSolved(element) {
    // TODO !!!
    // помещать такой объект просто на отдельную страницу
    // проверить, если объект больше - как печатаются номера и разрывы
    const tag = this.DOM.getElementTagName(element);
    return (tag === 'OBJECT')
  }

  // _isUnbreakable(element) {
  //   // IF currentElement is specific,
  //   // process as a whole:
  //   const tag = this.DOM.getElementTagName(element);

  //   // BUG WITH OBJECT: in FF is ignored, in Chrome get wrong height
  //   // if (tag === 'OBJECT') {
  //   //   this.debugMode && console.log('i am object');
  //   //   resizeObserver.observe(currentElement)
  //   // }

  //   // this.DOM.isNeutral(element) || 

  //   const takeAsWhole = (tag === 'IMG' || tag === 'svg' || tag === 'TABLE' || this.DOM.isNoBreak(element) || tag === 'OBJECT')
  //   return takeAsWhole;
  // }

}
