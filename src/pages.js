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
    console.log(content);

    // TODO put this into main calculations?
    // FIRST ELEMENT: register the beginning of the first page.
    this._registerPage({ pageStart: content[0] });

    this._parseNodes({
      array: content
    });

    // return this.pages;

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

      const children = this._isUnbreakable(currentElement) ? [] : this._getChildren(currentElement);

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

  // HELPERS

  _getChildren(element) {
    // Check children:
    // TODO variants
    // TODO last child
    // TODO first Li
    let childrenArr = [];
    const tag = this.DOM.getElementTagName(element);
    if (tag === 'LI') {
      childrenArr = [...this.DOM.getChildNodes(element)]
        .filter(child => this.DOM.getElementTagName(child) === 'UL' || this.DOM.getElementTagName(child) === 'OL');
    } else if (tag === 'DL') {
      childrenArr = [...this.DOM.getChildNodes(element)]
        .filter(child => this.DOM.getElementTagName(child) === 'DD');
    } else {
      childrenArr = [...this.DOM.getChildNodes(element)]
        .filter(child => this.DOM.isForcedPageBreak(child) || this.DOM.isPrintEnd(child) || this._isSignificantChild(child));
    }

    return childrenArr;
  }

  _isSignificantChild(child) {
    const tag = this.DOM.getElementTagName(child);

    // TODO isSignificantChild
    // If my nodeName is #text, my height is always undefined
    return (tag !== 'A' && tag !== 'TT' && this.DOM.getElementHeight(child) > 0);
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

    const takeAsWhole = (tag === 'IMG' || tag === 'TABLE' || this.DOM.isNoBreak(element) || tag === 'OBJECT')
    return takeAsWhole;
  }
}
