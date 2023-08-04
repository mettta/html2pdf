import calculateSplitters from './calculateSplitters';
import findSplitId from './findSplitId';

const CONSOLE_CSS_COLOR_PAGES = '#66CC00';
const CONSOLE_CSS_PRIMARY_PAGES = `color: ${CONSOLE_CSS_COLOR_PAGES};font-weight:bold`;
const CONSOLE_CSS_SECONDARY_PAGES = `color: ${CONSOLE_CSS_COLOR_PAGES};font-weight:bold;font-size:smaller;`;
const CONSOLE_CSS_LABEL_PAGES = `border:1px solid ${CONSOLE_CSS_COLOR_PAGES};`
                              + `background:#EEEEEE;`
                              + `color:${CONSOLE_CSS_COLOR_PAGES};`

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
      _parseNode: true,
      _getProcessedChildren: true,
      _splitPreNode: false,
      _splitTableNode: true,
      _splitGridNode: false,
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

      pageStarters.forEach(element => this.DOM.insertForcedPageBreakBefore(element));
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

  _registerPageStart(pageStart) {
    this.pages.push({
      pageStart: pageStart,
      pageBottom: this.DOM.getElementRootedRealTop(pageStart, this.root) + this.referenceHeight,
    })
  }

  _parseNodes({
    array,
    previous,
    next,
    parent,
    parentBottom,
  }) {

    for (let i = 0; i < array.length; i++) {

      this._parseNode({
        i,
        previousElement: array[i - 1] || previous,
        currentElement: array[i],
        nextElement: array[i + 1] || next,
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
    i,
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
      });

    // TODO #retainedParent
    // * If we want to start a new page from the current node,
    // * which is the first (i == 0) or only child (= has 'parent'),
    // * we want to register its parent as the start of the page.
    const currentPageStart = (i == 0 && parent) ? parent : currentElement;

    this.debugMode && this.debugToggler._parseNode && console.log(
      ...consoleMark,
      'parent:', parent,
      '\n',
      'parentBottom:', parentBottom,
      '\n',
      'currentPageStart:', currentPageStart,
      '\n'
    );

    // THE END of content flow:
    // if there is no next element, then we are in a case
    // where the [data-content-flow-end] element is current.
    if (!nextElement) {
      this.debugMode && this.debugToggler._parseNode && console.log(...consoleMark, '🏁 THE END')
      return
    }

    // FORCED BREAK
    if (this.DOM.isForcedPageBreak(currentElement)) {
      // TODO I've replaced the 'next' with the 'current' - need to test it out
      this._registerPageStart(currentElement)
      this.debugMode && this.debugToggler._parseNode && console.log(...consoleMark, '🚩 FORCED BREAK');
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

        // TODO #retainedParent
        // this._registerPageStart(currentElement);
        // ** And if it's the first child, move the parent node to the next page.
        this._registerPageStart(currentPageStart);
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
          return
        }

        // otherwise move it to next page,
        this._registerPageStart(currentImage);
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
        return
      }

      // * Check the possibility of (1) or (2): split or not?


      const currentElementBottom = parentBottom || this.DOM.getElementRootedRealBottom(currentElement, this.root);

      // IF currentElement does fit
      // in the remaining space on the page,
      if (currentElementBottom <= newPageBottom) {
        // we need <= because splitted elements often get equal height // todo comment

        this._registerPageStart(nextElement);
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

      // TODO #retainedParent
      // ** If it is an only child (it means that the parent node is not split),
      // ** as well as if the first child is being registered,
      // ** -- we want to use the past parent (=wrapper of the current node)
      // ** as the start of the page.
      const retainedParent = (childrenNumber <= 1 || i == 0)
                            ? (parent ? parent : currentElement)
                            : undefined;
      this.debugMode && this.debugToggler._parseNode && console.log(...consoleMark,
        'set retainedParent', retainedParent)

      // * Parse children:
      if (childrenNumber) {
        // * Process children if exist:
        this._parseNodes({
          array: children,
          previous: previousElement,
          next: nextElement,
          parent: retainedParent,
          parentBottom: currentElementBottom,
        })
      } else {
        // * If no children,
        // * move element to the next page.
        // ** But,
        if (this._isNoHanging(previousElement)) {
          // ** if previousElement can't be the last element on the page,
          // ** move it to the next page.
          // TODO #_canNotBeLast
          // а если там подряд несколько заголовков, и перед previousElement есть еще заголовки, которые мы не проверяли еслтенствнно, и они будут висеть
          this._registerPageStart(previousElement)
        } else {
          // TODO #retainedParent
          // this._registerPageStart(currentElement);
          this._registerPageStart(currentPageStart);
          this.debugMode && this.debugToggler._parseNode && console.log(...consoleMark,
            '_registerPageStart:', currentPageStart);
        }
      }
    }



    this.debugMode && this.debugToggler._parseNode && console.groupEnd(`%c_parseNode`);
  }

  _getProcessedChildren(node, firstPageBottom, fullPageHeight) {
    const consoleMark = ['%c_getProcessedChildren\n', 'color:white',]

    let children = [];

    if (this._isNoBreak(node)) {
      // don't break apart, thus keep an empty children array
      this.debugMode && this.debugToggler._getProcessedChildren && console.info(...consoleMark,
        '🧡 isNoBreak');
      children = [];
    } else if (this.DOM.isComplexTextBlock(node)) {
      this.debugMode && this.debugToggler._getProcessedChildren && console.info(...consoleMark,
        '💚 ComplexTextBlock');
      children = this._splitComplexTextBlock(node) || [];
    } else if (this._isTextNode(node)) {
      this.debugMode && this.debugToggler._getProcessedChildren && console.info(...consoleMark,
        '💚 TextNode');

      // TODO: Compare performance of _splitComplexTextBlock and _splitTextNode!
      // temporarily use the less productive function.

      // children = this._splitTextNode(node, firstPageBottom, fullPageHeight) || [];
      children = this._splitComplexTextBlock(node) || [];
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

    if (this._isVerticalFlowDisrupted(children)) {
      // * If the vertical flow is disturbed and the elements are side by side:
      children = this._processInlineChildren(children);
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

  _splitComplexTextBlock(node) {
    // TODO "complexTextBlock"

    // GET CHILDREN

    const complexChildren = this._getChildren(node).map(
      element => {
        const lineHeight = this.DOM.getLineHeight(element);
        const height = this.DOM.getElementHeight(element);
        const left = this.DOM.getElementLeft(element);
        const top = this.DOM.getElementTop(element);
        const lines = ~~(height / lineHeight);

        return {
          element,
          left,
          top,
          lineHeight,
          lines,
        }
      }
    );

    // this.debugMode && console.log('%c ⛱️ complexTextBlock ⛱️ ', 'color:red;background:yellow', complexChildren);

    // !!!
    // ? break it all down into lines

    // * Process the children of the block:
    const newComplexChildren = complexChildren.flatMap((item) => {
      // * Break it down as needed:
      if (item.lines > 1) {
        return this._breakItIntoLines(item); // array
      }
      // this.debugMode && console.log('%c no break ', 'color:red', item);
      // * otherwise keep the original element:
      return item.element;
    });
    // * Prepare an array of arrays containing references to elements
    // * that fit into the same row:
    const newComplexChildrenGroups = newComplexChildren.reduce(
      (result, currentElement, currentIndex, array) => {
        // * If this is the beginning, or if a new line:
        if(!result.length || this.DOM.isLineChanged(result.at(-1).at(-1), currentElement)) {
          result.push([currentElement]);
          return result;
        }
        if(result.length && this.DOM.isLineKept(result.at(-1).at(-1), currentElement)) {
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

    if (newComplexChildrenGroups.length < this.minBreakableLines) {
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
        line.dataset.index = index;
        // * Replace the array of elements with a line
        // * that contains all these elements:
        this.DOM.insertBefore(arr[0], line);
        this.DOM.insertAtEnd(line, ...arr);
        // * Return a new unbreakable line.
        return line;
      }
    );

    return linedChildren
  }

  _breakItIntoLines(item) {

    // Take the element:
    const splittedItem = item.element;

    // Split the splittedItem into spans.
    // * array with words:
    const itemWords = this.DOM.splitByWordsGreedy(splittedItem);
    // * array with words wrapped with the inline tag 'html2pdf-s':
    const itemWrappedWords = itemWords.map((item, index) => {
      const span = this.DOM.create('html2pdf-s');
      span.dataset.index = index;
      span.innerHTML = item + ' ';
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
        const start = beginnerNumbers[currentIndex];
        const end = beginnerNumbers[currentIndex + 1];
        const text = itemWords.slice(start, end).join(' ') + ' ';
        this.DOM.setInnerHTML(line, text);
        this.DOM.insertBefore(splittedItem, line);
        // Keep the ID only on the first clone
        (currentIndex > 0) && line.removeAttribute("id");

        result.push(line);
        return result;
      }, []);

    // TODO #hyphen
    // If a string ends in a hyphen,
    // it is naturally not split because the word is not space-separated.
    // Example: examples/test/cases/p_1_hyphen_vs_space.html
    // In this case, we get an assertion trigger:
    this.debugMode
      // && this.debugToggler._parseNode
      && console.assert(
        newLines.length == item.lines,
        'The number of new lines is not equal to the expected number of lines when splitting.',
        '\nNew lines:',
        newLines,
        item.lines
    );
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

  _splitPreNode(node, pageBottom, fullPageHeight) {
    const consoleMark = ['%c_splitPreNode\n', 'color:white',]

    this.debugMode && this.debugToggler._splitPreNode && console.group('%c_splitPreNode', 'background:cyan');
    this.debugMode && this.debugToggler._splitPreNode && console.log(...consoleMark, 'node', node);

    // TODO the same in splitTextNode - make one code piece

    // TODO try first split the PRE by \n\n
    // and then split solid PRE by lines

    // TODO check if there are NODES except text nodes

    // Prepare node parameters
    const nodeTop = this.DOM.getElementRootedTop(node, this.root);
    const nodeHeight = this.DOM.getElementHeight(node);
    const nodeLineHeight = this.DOM.getLineHeight(node);
    const preWrapperHeight = this.DOM.getEmptyNodeHeight(node);
    const totalLines = (nodeHeight - preWrapperHeight) / nodeLineHeight;

    if (totalLines < this.minPreBreakableLines) {
      // this._registerPageStart(node);
      return []
    }












    // *** try split by blocks
    // TODO <br>

    // TODO
    // const linesJoiner = '\n';
    // const blocksJoiner = '\n\n';

    // correction for line break, not affecting the block view, but affecting the calculations
    let preText = this.DOM.getInnerHTML(node);
    if (preText.charAt(preText.length - 1) === '\n') {
      this.debugMode && this.debugToggler._splitPreNode && console.log(
        ...consoleMark,
        'LAST CHAR IS \\n'
      );
      preText = preText.slice(0, -1);
    }

    this.debugMode && this.debugToggler._splitPreNode && console.log(
      ...consoleMark,
      '1 - preText'
    );

    const preLines = preText.split('\n');
    // "000", "", "001", "002", "003", "004", "005", "006", "", "007" .....

    this.debugMode && this.debugToggler._splitPreNode && console.log(
      ...consoleMark,
      '#### 2 - preLines', preLines
    );


    if (preLines.length < this.minPreBreakableLines) {
      // this._registerPageStart(node);
      this.debugMode && this.debugToggler._splitPreNode && console.log(
        ...consoleMark,
        '< minPreBreakableLines => return []'
      );
      return []
    }


    // TODO
    // нужны ли эти странные вычисления,
    // нужно смотреть, сколько реальных строк помещается в первой части/
    // А НАДО ЛИ ЭТО?
    // может просто разбить на возможные части и отправить выше, пусть сами распределяют

    // ? Can we not do all these calculations,
    // ? but just split up into lines and send them upstairs to make decisions?
    // * The current answer:
    // ** When we split, we create new nodes,
    // ** so we need to know exactly what pieces we can and should split into.

    // * Prepare parameters for splitters calculation
    // TODO : availableSpace considers the upper margin, but does not consider the lower margin
    let availableSpace = pageBottom - nodeTop - preWrapperHeight;
    const pageSpace = fullPageHeight - preWrapperHeight;

    this.debugMode && this.debugToggler._splitPreNode && console.log(
      ...consoleMark,
      'availableSpace: \n',
      `${availableSpace} = ${pageBottom} - ${nodeTop} - ${preWrapperHeight}`,
    );

    let firstPartLines = Math.trunc(availableSpace / nodeLineHeight);
    const linesPerPage = Math.trunc(pageSpace / nodeLineHeight);

    if (firstPartLines < this.minPreFirstBlockLines) {
      this.debugMode && this.debugToggler._splitPreNode && console.log(
        ...consoleMark,
        'availableSpace is too small \n (availableSpace = fullPageHeight)'
      );
      availableSpace = fullPageHeight;
      firstPartLines = linesPerPage;
    }

    const restLines = totalLines - firstPartLines;
    this.debugMode && this.debugToggler._splitPreNode && console.log(
      ...consoleMark,
      'restLines:', restLines
    ); // BUG -32 ????

    const fullPages = Math.floor(restLines / linesPerPage);
    const lastPartLines = restLines % linesPerPage;
    this.debugMode && this.debugToggler._splitPreNode && console.log(
      ...consoleMark,
      'lastPartLines:', lastPartLines
    );

    if (lastPartLines < this.minPreLastBlockLines) {
      firstPartLines = firstPartLines - (this.minPreLastBlockLines - lastPartLines);
      this.debugMode && this.debugToggler._splitPreNode && console.log(
        ...consoleMark,
        'firstPartLines:', firstPartLines
      );
    }


    this.debugMode && this.debugToggler._splitPreNode && console.log(
      ...consoleMark,
      '#### 3 - grouping lines',
    );

    // ["000"], ["001", "002", "003", "004", "005", "006"], ["007", .....
    const preGroupedLines = preLines.reduce((accumulator, line, index, array) => {

      if (line === '') {
        accumulator.push([]);
      } else {
        accumulator[accumulator.length - 1].push(line)
      }
      return accumulator;
    }, [[]])
      .filter(array => array.length);

    this.debugMode && this.debugToggler._splitPreNode && console.log(
      ...consoleMark,
      '(3) raw preGroupedLines:', ...preGroupedLines
    );

    // TODO TEST THIS! logik is too compex
    let veryStartGroup = '';
    let veryEndGroup = '';

    if (preGroupedLines[0].length < this.minPreFirstBlockLines) {
      veryStartGroup = preGroupedLines.shift().join('\n') + '\n\n';
    }
    if (preGroupedLines[preGroupedLines.length - 1].length < this.minPreLastBlockLines) {
      veryEndGroup = '\n' + preGroupedLines.pop().join('\n');
    }

    this.debugMode && this.debugToggler._splitPreNode && console.log(
      ...consoleMark, '(3) split into groups of lines:'
    );
    this.debugMode && this.debugToggler._splitPreNode && console.log(
      ...consoleMark,
      'veryStartGroup', veryStartGroup
    );
    this.debugMode && this.debugToggler._splitPreNode && console.log(
      ...consoleMark,
      'preGroupedLines', preGroupedLines
    );
    this.debugMode && this.debugToggler._splitPreNode && console.log(
      ...consoleMark,
      'veryEndGroup', veryEndGroup
    );

    // ["000"], [Array(3), Array(3)], [Array(3), "010", "011", Array(3)], .....
    const preBlocks = preGroupedLines.reduce((accumulator, block, index, array) => {

      this.debugMode && this.debugToggler._splitPreNode && console.log(
        ...consoleMark,
        `preBlocks block # ${index}`,
        block
      );

      if (block.length < this.minPreBreakableLines) {
        accumulator.push(block.join('\n') + '\n');

        this.debugMode && this.debugToggler._splitPreNode && console.log(
          ...consoleMark,
          `this block.length < this.minPreBreakableLines`
        );
      } else {
        const first = block.slice(0, this.minPreFirstBlockLines).join('\n') + '\n';
        const rest = block.slice(this.minPreFirstBlockLines, - this.minPreLastBlockLines)
          .map(line => line + '\n');
        const last = block.slice(-this.minPreLastBlockLines).join('\n') + '\n';
        const res = [];
        accumulator.push(first);
        rest.length && accumulator.push(...rest);
        accumulator.push(last);
      };

      accumulator.push('\n');
      // (index < array.length - 1) && accumulator.push('\n'); // for each block except last
      return accumulator;
    }, []);

    if (preBlocks[preBlocks.length - 1] === '\n') {
      preBlocks.pop()
    }

    veryStartGroup.length && (preBlocks[0] = veryStartGroup + preBlocks[0]);
    veryEndGroup.length && (preBlocks[preBlocks.length - 1] = preBlocks[preBlocks.length - 1] + veryEndGroup);

    this.debugMode && this.debugToggler._splitPreNode && console.log(
      ...consoleMark,
      '#### 4 - preBlocks',
      preBlocks
    );

    // TODO TEST THIS! its hack

    if (preBlocks.length === 1) {
      this.debugMode && this.debugToggler._splitPreNode && console.log(
        ...consoleMark,
        `DON'T SPLIT IT`
      );
      return []
    }


    // **************************************

    const blockAndLineElementsArray = preBlocks.map(
      block => {
        const blockElement = this.DOM.createNeutral();
        this.DOM.setInnerHTML(blockElement, block);
        return blockElement;
      }
    )

    this.debugMode && this.debugToggler._splitPreNode && console.log(
      ...consoleMark,
      'blockAndLineElementsArray',
      blockAndLineElementsArray
    );

    //TODO move to DOM, like prepareSplittedNode(node)



    const testNode = this.DOM.createTestNodeFrom(node);
    this.DOM.insertAtEnd(testNode, ...blockAndLineElementsArray);
    this.DOM.insertAtEnd(node, testNode);



    this.debugMode && this.debugToggler._splitPreNode && console.log(
      ...consoleMark,
      `• availableSpace: ${availableSpace}`,
      '\n',
      `• pageSpace: ${pageSpace}`,
    );

    // find starts of parts splitters

    let page = 0;
    let splitters = [];
    let floater = availableSpace;

    this.debugMode && this.debugToggler._splitPreNode && console.log(
      ...consoleMark,
      'Find starts of parts splitters\n',
      '◆ page: #', page,
      '\n',
      '◆ floater:', floater,
    );

    for (let index = 0; index < blockAndLineElementsArray.length; index++) {
      // const floater = availableSpace + page * pageSpace;
      const current = blockAndLineElementsArray[index];
      const currentBottom = this.DOM.getElementRootedBottom(current, testNode);


      // TODO: If the first part does not fit in the available space,
      // start the second page.


      this.debugMode && this.debugToggler._splitPreNode && console.log(
        'currentBottom:', currentBottom
      );

      // TODO move to DOM
      if (this.DOM.getElementRootedBottom(current, testNode) > floater) {
        index && splitters.push(index);
        index && (page += 1);
        floater = this.DOM.getElementRootedTop(current, testNode) + pageSpace;

        this.debugMode && this.debugToggler._splitPreNode && console.log(
          ...consoleMark,
          '◆ page: #', page,
          '\n',
          '◆ new floater:', floater,
        );
      }
    }

    // * Delete the test node that is no longer needed.
    testNode.remove();

    // * The last part end is registered automatically.
    // * Thus, this array has at least 1 element.
    splitters.push(null);
    this.debugMode && this.debugToggler._splitPreNode && console.log(
      ...consoleMark,
      'splitters', splitters
    );
    // * The last part end may be the only part. Check it out below.
    if(splitters.length < 2) {
      // ** If we have only one part, we return an empty array
      // ** and the original node will be taken in its entirety.
      return []
    }

    // * If there are more parts and the node will be split, continue.

    const newPreElementsArray = splitters.map((id, index, splitters) => {
      // Avoid trying to break this node: createWithFlagNoBreak()
      // We can't wrap in createWithFlagNoBreak()
      // because PRE may have margins and that will affect the height of the wrapper.
      // So we will give the PRE itself this property.
      const part = this.DOM.cloneNodeWrapper(node);
      this.DOM.setFlagNoBreak(part);

      const start = splitters[index - 1] || 0;
      const end = id || splitters[splitters.length];

      this.DOM.insertAtEnd(part, ...blockAndLineElementsArray.slice(start, end));

      return part;
    });

    this.debugMode && this.debugToggler._splitPreNode && console.log(
      ...consoleMark,
      'newPreElementsArray',
      newPreElementsArray
    );





    //// this.DOM.insertInsteadOf(node, ...newPreElementsArray);
    // * We need to keep the original node,
    // * we may need it as a parent in this._parseNode().
    this.DOM.setInnerHTML(node, '');
    this.DOM.insertAtEnd(node, ...newPreElementsArray);
    // * We "open" the slough node, but leave it.
    node.style.display = 'contents';
    node.setAttribute('slough-node', '')
    node.classList = '';

    this.debugMode && this.debugToggler._splitPreNode && console.groupEnd('%c_splitPreNode', 'background:cyan');

    return newPreElementsArray;

    // TODO переполнение ширины страницы
    // overflow-x hidden + warning

  }

  _insertTableSplit({ startId, endId, table, tableEntries }) {

    this.debugMode && console.log(`=> _insertTableSplit(${startId}, ${endId})`);

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


    const rowTopsArr = [
      ...tableEntries.rows.map(
        (row) => this.DOM.getElementRootedTop(row, table)
        + captionFirefoxAmendment
      ),
      this.DOM.getElementRootedTop(tableEntries.tfoot, table) || tableHeight
    ];

    this.debugMode && this.debugToggler._splitTableNode && console.log(
      ...consoleMark,
      '• rowTopsArr', rowTopsArr
    );

    // * Calculate Table Splits Ids

    let splitsIds = [];
    let currentPageBottom = firstPartHeight;

    for (let index = 0; index < rowTopsArr.length; index++) {

      if (topsArr[index] > currentPageBottom) {

        // TODO split long TR

        if (index > this.minLeftRows) {
          // * avoid < minLeftRows rows on first page
          // *** If a table row starts in the next part,
          // *** register the previous one as the beginning of the next part.
          splitsIds.push(index - 1);
          currentPageBottom = rowTopsArr[index - 1] + fullPagePartHeight;
        }


        // check if next fits

      }
    };

    this.debugMode && this.debugToggler._splitTableNode && console.log(
      ...consoleMark,
      'splitsIds', splitsIds
    );

    if (!splitsIds.length) {
      return []
    }

    // * avoid < minDanglingRows rows on last page
    const maxSplittingId = (rowTopsArr.length - 1) - this.minDanglingRows;
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

    this.debugMode && this.debugToggler._splitTableNode && console.timeEnd('_splitTableNode')
    return [...splits, lastPart]
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
              &&  console.log('%cLAST','color:red')
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

      this.DOM.setInnerHTML(part, nodeWords.slice(start, end).join(' ') + ' ');

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

    const childrenArr = [...this.DOM.getChildNodes(element)]
      .reduce(
        (acc, item) => {

          // * filter STYLE, use element.tagName
          if (this._isSTYLE(item)) {
            console.log({item})
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

    return childrenArr;
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
