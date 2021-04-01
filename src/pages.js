export default class Pages {

  constructor({
    DOM,
    contentFlow,
    referenceHeight
  }) {

    this.DOM = DOM;
    this.contentFlow = contentFlow;
    this.referenceHeight = referenceHeight;

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

      if (this._isTextNode(currentElement)) {

        // todo PROCESS TEXT NODE
        console.time('TIMER ' + this.pages.length);
        children = this._processTextNode(currentElement, newPageBottom) || [];
        console.timeEnd('TIMER ' + this.pages.length);

      } else if (this._isBreakable(currentElement)) {
        children = this._getChildren(currentElement);
      }

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
    // console.log(availableSpace);

    const lineHeight = this.DOM.getLineHeight(node);
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

    const linesInSpace = ~~(availableSpace / lineHeight);

    // max 2 lines on next page:
    const hanging = 2;
    const firstPartLines = (totalLines - linesInSpace < hanging) ? totalLines - hanging : linesInSpace;
    const firstPartMaxHeight = firstPartLines * lineHeight;

    const partitionFactor = firstPartLines / totalLines;

    // console.log('totalLines', totalLines);
    // console.log('linesInSpace', linesInSpace);
    // console.log('firstPartLines', firstPartLines);
    // console.log('partitionFactor', partitionFactor);

    const nodeWords = this.DOM.getInnerHTML(node).split(' ');
    // console.log(nodeWords);

    const firstPart = this.DOM.createNeutral();
    const secondPart = this.DOM.createNeutral();

    // const testContainer = this.DOM.createNeutral();
    // testContainer.style = "position:absolute; width: 100%; left: -3000px;";

    node.before(firstPart, secondPart);
    node.remove();

    const secondStart = nodeWords.findIndex(item => {
      firstPart.innerHTML += (item + ' ');
      return firstPart.offsetHeight > firstPartMaxHeight
    })

    // const secondStart = nodeWords.length > 100 ? 281 : 51;

    console.log('secondStart', secondStart, nodeWords[secondStart]);

    firstPart.innerHTML = nodeWords.slice(0, secondStart).join(' ') + ' ';
    secondPart.innerHTML = nodeWords.slice(secondStart).join(' ') + ' ';

    return [firstPart, secondPart]

    // todo
    // последняя единственная строка - как проверять?
    // смотреть, если эта НОДА - единственный или последний потомок своего родителя

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
