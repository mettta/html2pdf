export default class Pages {

  constructor({
    DOM,
    contentFlow,
    referenceHeight
  }) {

    this.DOM = DOM;
    this.contentFlow = contentFlow;
    this.referenceHeight = referenceHeight;

    this.minHangingLines = 2;

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

      console.log('==>', currentElement);

      let children = [];

      // if text node, process it
      if (this._isTextNode(currentElement)) {
        console.log('==> _isTextNode', currentElement);

        // console.time('TIMER ' + this.pages.length);
        children = this._processTextNode(currentElement, newPageBottom) || [];
        // console.timeEnd('TIMER ' + this.pages.length);

        console.log('==> CHILDREN', children);

        // if _isBreakable, just _getChildren
      } else if (this._isBreakable(currentElement)) {
        children = this._getChildren(currentElement);
      }
      // otherwise we keep an empty children array

      // parse children
      if (children.length) {
        console.log(children);
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

    console.log('==> _isTextNode 2', node);

    const availableSpace = pageBottom - node.offsetTop;
    // console.log(availableSpace);


    // const lineHeight = this.DOM.getLineHeight(node);
    const testNode = this.DOM.createNeutral();
    testNode.innerHTML = '!';
    testNode.style = "position:absolute; left:-100px; width:100%;";
    node.before(testNode);
    // FIXME Why does it take 4+ times longer on large nodes
    const lineHeight = testNode.offsetHeight;
    testNode.remove();


    // console.log(lineHeight);

    const totalLines = node.offsetHeight / lineHeight;
    // console.log(totalLines);

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

    return this._splitTextNode(
      node,
      nodeWords,
      wrappedNodeWords,
      lineHeight,
      availableSpace);

    // todo
    // последняя единственная строка - как проверять?
    // смотреть, если эта НОДА - единственный или последний потомок своего родителя

  }

  _splitTextNode(
    node,
    nodeWords,
    wrappedNodeWords,
    lineHeight,
    availableSpace,
    splittedArr = [node]) {

    console.log('----> _splitTextNode', node);

    const currNode = node;

    const restNode = this.DOM.createNeutral();
    currNode.after(restNode);

    const testNode = this.DOM.createTestNode();
    currNode.before(testNode);

    console.log('----> ## testNode', testNode);

    const totalLines = currNode.offsetHeight / lineHeight;
    console.log('currNode.offsetHeight', currNode.offsetHeight);
    console.log('totalLines', totalLines);

    const linesInSpace = ~~(availableSpace / lineHeight);
    console.log('availableSpace', availableSpace);
    console.log('lineHeight', lineHeight);
    console.log('linesInSpace', linesInSpace);
    const hangingLines = totalLines - linesInSpace;
    // max 2 lines on next page:
    const firstPartLines = (hangingLines < this.minHangingLines) ? totalLines - this.minHangingLines : linesInSpace;
    console.log('firstPartLines', firstPartLines);

    const maxTop = (firstPartLines - 1) * lineHeight;
    console.log('maxTop', maxTop);

    testNode.innerHTML = wrappedNodeWords.join(' ') + ' ';

    console.log([...testNode.children][0]);

    const partitionFactor = firstPartLines / totalLines;
    const trySecondStart = ~~(nodeWords.length * partitionFactor);
    console.log('trySecondStart', trySecondStart);
    const breakIndex = this._findBreak([...testNode.children][trySecondStart], maxTop);
    console.log('BR ', breakIndex);

    const currentPartNodeWords = nodeWords.slice(0, breakIndex);
    const restPartNodeWords = nodeWords.slice(breakIndex);
    const restPartWrappedNodeWords = wrappedNodeWords.slice(breakIndex);

    console.log('===', currentPartNodeWords, 'and', restPartNodeWords);
    console.log('===', currentPartNodeWords.length, 'and', restPartNodeWords.length);

    currNode.innerHTML = currentPartNodeWords.join(' ') + ' ';
    restNode.innerHTML = restPartNodeWords.join(' ') + ' ';
    restNode.classList = `breakIndex_${breakIndex}`;
    splittedArr = [...splittedArr, currNode];

    // test REST
    testNode.innerHTML = restPartWrappedNodeWords.join(' ') + ' ';
    const restHeight = testNode.offsetHeight;
    testNode.remove();

    if (restHeight > this.referenceHeight) {
      console.log('%c INSIDE LOOP ', 'color:black;background:yellow');
      splittedArr = this._splitTextNode(
        restNode,
        restPartNodeWords,
        restPartWrappedNodeWords,
        lineHeight,
        this.referenceHeight,
        splittedArr)
    } else {
      splittedArr = [...splittedArr, restNode];
    }

    return splittedArr;

  }

  _findBreak(item, floater) {
    console.log('----> findBreak', item);
    const curr = item;
    const currTop = item.offsetTop;

    const prev = item.previousElementSibling;
    const prevTop = prev.offsetTop;

    const next = item.nextElementSibling;
    const nextTop = next.offsetTop;



    if (currTop > floater) {

      if (prevTop < currTop) {
        return curr.dataset.id;
      }

      return this._findBreak(prev, floater);

    } else {

      if (currTop < nextTop) {
        const a = next.dataset.id;
        // console.log('next.dataset.id ', a);
        return a;
      }

      return this._findBreak(next, floater);
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

    console.log(childrenArr);
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
