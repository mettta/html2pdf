import calculateSplitters from './calculateSplitters';

export default class Pages {

  constructor({
    DOM,
    contentFlow,
    referenceHeight
  }) {

    this.DOM = DOM;
    this.contentFlow = contentFlow;
    this.referenceHeight = referenceHeight;

    // todo
    // 1) move to config
    this.minLeftLines = 2;
    this.minDanglingLines = 2;
    this.minBreakableLines = this.minLeftLines + this.minDanglingLines;

    this.pages = [];
  }

  calculate() {
    this._calculate();
    return this.pages;
  }

  _calculate() {

    // IF contentFlow is less than one page,

    if (this.DOM.getElementHeight(this.contentFlow) < this.referenceHeight) {
      // register a single page
      this._registerPage({ pageStart: this.contentFlow });
      return;
    }

    // ELSE:

    const content = this._getChildren(this.contentFlow);

    // TODO put this into main calculations?
    // FIRST ELEMENT: register the beginning of the first page.
    this._registerPage({ pageStart: content[0] });

    this._parseNodes({
      array: content
    });
  }

  _registerPage({
    pageBreak,
    pageEnd,
    pageStart,
  }) {
    this.pages.push({
      pageBreak: pageBreak,
      pageEnd: pageEnd,
      pageStart: pageStart,
    })
  }

  _parseNodes({
    array,
    previous,
    next
  }) {

    for (let i = 0; i < array.length; i++) {

      this._parseNode({
        previousElement: array[i - 1] || previous,
        currentElement: array[i],
        nextElement: array[i + 1] || next,
      });
    }
  }

  _parseNode({
    previousElement,
    currentElement,
    nextElement,
  }) {

    // THE END:
    if (!nextElement) {
      return
    }

    // TODO
    // offsetParent: div#printTHIS
    // if relative? -> offsetParent + offsetThis

    const lastElem = this.pages[this.pages.length - 1].pageEnd;
    const flowCutPoint = lastElem ? this.DOM.getElementBottom(lastElem) : 0;
    const newPageBottom = flowCutPoint + this.referenceHeight;

    if (this.DOM.isForcedPageBreak(currentElement)) {
      this._registerPage({
        pageBreak: currentElement,
        pageEnd: previousElement,
        pageStart: nextElement,
      })
      return
    }

    // IF currentElement does not fit
    // in the remaining space on the page,
    // loop the children:
    if (this.DOM.getElementTop(nextElement) > newPageBottom) {

      let children = [];

      // if text node, process it
      if (this._isTextNode(currentElement)) {

        // console.time('TIMER ' + this.pages.length);
        children = this._splitTextNode(currentElement, newPageBottom) || [];
        // console.timeEnd('TIMER ' + this.pages.length);

        // if _isBreakable, just _getChildren
      } else if (this._isBreakable(currentElement)) {
        children = this._getChildren(currentElement);
      }
      // otherwise we keep an empty children array

      // parse children
      if (children.length) {
        // Process children if exist:
        this._parseNodes({
          array: children,
          previous: previousElement,
          next: nextElement
        })
      } else {
        // If no children, move element to the next page:
        this._registerPage({
          pageEnd: previousElement,
          pageStart: currentElement,
        });
      }

    }
    // IF currentElement fits, continue.
  }

  // TODO
  // - если не разбиваемый и его высота больше чем страница - уменьшать

  // HELPERS

  _splitTextNode(node, pageBottom) {

    // Prepare node parameters
    const nodeTop = this.DOM.getElementTop(node);
    const nodeHeight = this.DOM.getElementHeight(node);
    const nodeLineHeight = this.DOM.getLineHeight(node);

    // Prepare parameters for splitters calculation
    const availableSpace = pageBottom - nodeTop;

    const nodeLines = ~~(nodeHeight / nodeLineHeight);
    const pageLines = ~~(this.referenceHeight / nodeLineHeight);
    const firstPartLines = ~~(availableSpace / nodeLineHeight);

    // calculate splitters
    const splitters = calculateSplitters({
      nodeLines: nodeLines,
      pageLines: pageLines,
      firstPartLines: firstPartLines,
      // const
      minBreakableLines: this.minBreakableLines,
      minLeftLines: this.minLeftLines,
      minDanglingLines: this.minDanglingLines,
    });

    if (splitters.length < 2) {
      return []
    }

    // GO:

    const nodeWords = this.DOM.getInnerHTML(node).split(' ');
    const wrappedNodeWords = nodeWords.map((item, ind) => `<span data-id='${ind}'>${item}</span>`);

    // CALCULATE real breaks
    const testNode = this.DOM.createTestNode();

    this.DOM.insertBefore(node, testNode);
    this.DOM.setInnerHTML(testNode, wrappedNodeWords.join(' ') + ' ');

    const allNodeWords = [...this.DOM.getChildren(testNode)];

    const splitIds = splitters.map(
      ({ endLine, splitter }) =>
        splitter
          ? this._reviseBreak(
            allNodeWords[~~(wrappedNodeWords.length * splitter)],
            (endLine * nodeLineHeight)
          )
          : null
    );

    // testNode.remove();
    this.DOM.removeNode(testNode);

    const splittedArr = splitIds.map((id, index, splitIds) => {
      // Avoid trying to break this node: createPrintNoBreak()
      const part = this.DOM.createPrintNoBreak();

      const start = splitIds[index - 1] || 0;
      const end = id || splitIds[splitIds.length];

      this.DOM.setInnerHTML(part, nodeWords.slice(start, end).join(' ') + ' ');

      return part;
    });

    this.DOM.insertBefore(node, ...splittedArr)

    this.DOM.removeNode(node);

    return splittedArr;

    // todo
    // последняя единственная строка - как проверять?
    // смотреть, если эта НОДА - единственный или последний потомок своего родителя

  }

  _reviseBreak(item, topRef) {

    const curr = item;
    const currTop = this.DOM.getElementTop(item);

    // IF we are to the left of the breaking point (i.e. above)
    if (currTop < topRef) {

      const next = this.DOM.getRightNeighbor(item);
      const nextTop = this.DOM.getElementTop(next);

      // if the current word and the next one are on different lines,
      // and the next one is on the correct line,
      // then it starts the correct line
      if (currTop < nextTop && nextTop === topRef) {
        //  next.dataset.id;
        return this.DOM.getDataId(next)
      }

      // otherwise we move to the right
      return this._reviseBreak(next, topRef);

      // IF we are to the right of the break point (i.e. below)
    } else {

      const prev = this.DOM.getLeftNeighbor(item);
      const prevTop = this.DOM.getElementTop(prev);

      // if the current word and the previous one are on different lines,
      // and the current one is on the correct line,
      // then it starts the correct line
      if (prevTop < currTop && currTop === topRef) {
        //  curr.dataset.id;
        return this.DOM.getDataId(curr)
      }

      // otherwise we move to the left
      return this._reviseBreak(prev, topRef);
    }
  }

  _getChildren(element) {
    // Check children:
    // TODO variants
    // TODO last child
    // TODO first Li

    const childrenArr = [...this.DOM.getChildNodes(element)]
      .map(
        item =>
          this.DOM.isSignificantTextNode(item)
            ? this.DOM.wrapTextNode(item)
            : item
      )
      .filter(
        item =>
          this.DOM.isElementNode(item)
      );

    return childrenArr;
  }

  _isSignificantChild(child) {
    const tag = this.DOM.getElementTagName(child);

    // TODO isSignificantChild
    // If my nodeName is #text, my height is always undefined
    return (tag !== 'A' && tag !== 'TT' && this.DOM.getElementHeight(child) > 0);
  }

  _isTextNode(element) {
    return this.DOM.isNeutral(element);
  }

  _isBreakable(element) {
    const tag = this.DOM.getElementTagName(element);
    return (
      !this.DOM.isNoBreak(element)
      && tag !== 'IMG'
      && tag !== 'TABLE'
      && tag !== 'OBJECT'
    )
  }

  _isUnbreakable(element) {
    // IF currentElement is specific,
    // process as a whole:
    const tag = this.DOM.getElementTagName(element);

    // BUG WITH OBJECT: in FF is ignored, in Chrome get wrong height
    // if (tag === 'OBJECT') {
    //   console.log('i am object');
    //   resizeObserver.observe(currentElement)
    // }

    // this.DOM.isNeutral(element) || 

    const takeAsWhole = (tag === 'IMG' || tag === 'TABLE' || this.DOM.isNoBreak(element) || tag === 'OBJECT')
    return takeAsWhole;
  }
}
