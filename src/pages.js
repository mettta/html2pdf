export default class Pages {

  constructor({
    DOM,
    contentFlow,
    referenceHeight
  }) {

    this.DOM = DOM;
    this.contentFlow = contentFlow;
    this.referenceHeight = referenceHeight;

    this.danglingLines = 1;

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

    // this.DOM.getElementBottom(element)

    // IF currentElement does not fit
    // in the remaining space on the page,
    // loop the children:
    if (this.DOM.getElementTop(nextElement) > newPageBottom) {


      let children = [];

      // if text node, process it
      if (this._isTextNode(currentElement)) {

        // console.time('TIMER ' + this.pages.length);
        children = this._processTextNode(currentElement, newPageBottom) || [];
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

  _processTextNode(node, pageBottom) {

    const availableSpace = pageBottom - node.offsetTop;

    // const lineHeight = this.DOM.getLineHeight(node);
    const testNode = this.DOM.createNeutral();
    testNode.innerHTML = '!';
    testNode.style = "position:absolute; left:-100px; width:100%;";
    node.before(testNode);
    // FIXME Why does it take 4+ times longer on large nodes
    const lineHeight = testNode.offsetHeight;
    testNode.remove();

    const totalLines = node.offsetHeight / lineHeight;

    // min 4 string for break:
    if (totalLines < 4) {

      return
    }

    // min 2 string on previous page:
    if (availableSpace < lineHeight * 2) {

      return
    }

    // GO:

    const nodeWords = this.DOM.getInnerHTML(node).split(' ');
    const wrappedNodeWords = nodeWords.map((item, ind) => `<span data-id='${ind}'>${item}</span>`);

    return this._splitTextNode({
      node,
      nodeWords,
      wrappedNodeWords,
      lineHeight,
      availableSpace,
    });

    // todo
    // последняя единственная строка - как проверять?
    // смотреть, если эта НОДА - единственный или последний потомок своего родителя

  }

  _checkPossibleBreaks({
    nodeLines,
    pageLines,
    firstPartLines,
    wordNumbers,
    // local:
    breaks = [],
    partNumber = 0
  }) {

    const currentEndLine = pageLines * partNumber + firstPartLines;

    if (nodeLines > currentEndLine) {

      breaks = [
        ...breaks,
        {
          endLine: currentEndLine,
          possibleBreak: ~~(wordNumbers * currentEndLine / nodeLines)
        }
      ];

      return this._checkPossibleBreaks({
        nodeLines,
        pageLines,
        firstPartLines,
        wordNumbers,
        // local:
        breaks,
        partNumber: partNumber + 1
      });

    } // ELSE - LAST PART

    const lastPartLines = nodeLines - (currentEndLine - pageLines);
    console.log('LAST PART: lastPartLines', lastPartLines);

    // TODO 1 lines!
    // If there is a dangling line:
    // this.danglingLines
    // TODO -----------------------------
    if (lastPartLines && lastPartLines < 2) {
      // console.log('SHORT');
      const correctedEndLine = breaks[breaks.length - 1].endLine - 1;

      breaks[breaks.length - 1] = {
        endLine: breaks[breaks.length - 1].endLine - 1,
        possibleBreak: ~~(wordNumbers * correctedEndLine / nodeLines)
      }
    }

    // last part, has no break.
    breaks = [
      ...breaks,
      {
        endLine: currentEndLine,
        possibleBreak: null
      }
    ];

    return breaks;
  }

  _splitTextNode({
    node,
    nodeWords,
    wrappedNodeWords,
    lineHeight,
    availableSpace,
  }) {

    // CALCULATE possible breaks
    const possibleBreaks = this._checkPossibleBreaks({
      wordNumbers: wrappedNodeWords.length,
      nodeLines: ~~(node.offsetHeight / lineHeight),
      pageLines: ~~(this.referenceHeight / lineHeight),
      firstPartLines: ~~(availableSpace / lineHeight),
    });

    console.log('possibleBreaks', possibleBreaks);

    // CALCULATE real breaks
    const testNode = this.DOM.createTestNode();
    node.before(testNode);
    testNode.innerHTML = wrappedNodeWords.join(' ') + ' ';
    const allNodeWords = [...testNode.children];
    console.log('allNodeWords.length', allNodeWords.length);
    const breakIds = possibleBreaks.map(
      ({ possibleBreak, endLine }) =>
        (possibleBreak && allNodeWords[possibleBreak])
          ? this._reviseBreak(allNodeWords[possibleBreak], (endLine * lineHeight))
          : null
    );
    console.log('breakIds', breakIds);

    testNode.remove();
    // possibleBreaks.map(({ possibleBreak }) => {
    //   console.log(possibleBreak);
    //   console.log(allNodeWords[possibleBreak]);
    //   allNodeWords[possibleBreak] && (allNodeWords[possibleBreak].style = 'background:blue');
    // })
    // breakIds.map((id) => {
    //   allNodeWords[id] && (allNodeWords[id].style = 'color:red');
    //   allNodeWords[id] && console.log(allNodeWords[id].offsetTop);
    // })

    const splittedArr = breakIds.map((id, index, breakIds) => {
      const part = this.DOM.createNeutral();

      const start = breakIds[index - 1] || 0;
      const end = id || breakIds[breakIds.length];
      part.innerHTML = nodeWords.slice(start, end).join(' ') + ' ';

      return part;
    });
    node.before(...splittedArr);
    node.remove();

    return splittedArr;

  }

  _reviseBreak(item, topRef) {

    const curr = item;
    const currTop = item.offsetTop;

    // IF we are to the left of the breaking point (i.e. above)
    if (currTop < topRef) {

      const next = item.nextElementSibling;
      const nextTop = next.offsetTop;

      // if the current word and the next one are on different lines,
      // and the next one is on the correct line,
      // then it starts the correct line
      if (currTop < nextTop && nextTop === topRef) {
        return next.dataset.id;
      }

      // otherwise we move to the right
      return this._reviseBreak(next, topRef);

      // IF we are to the right of the break point (i.e. below)
    } else {

      const prev = item.previousElementSibling;
      const prevTop = prev.offsetTop;

      // if the current word and the previous one are on different lines,
      // and the current one is on the correct line,
      // then it starts the correct line
      if (prevTop < currTop && currTop === topRef) {
        return curr.dataset.id;
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
