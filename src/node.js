export default class Node {
  constructor({
    config,
    DOM,
    selector
  }) {
    this._config = config;
    this._DOM = DOM;
    this._selector = selector;
  }

  init() {
    this._config.debugMode && console.log('🍄 i am Node!')
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

  isTextNode(element) {
    return this._DOM.isWrappedTextNode(element);
  }

  isPageStartElement(element) {
    return this._DOM.isSelectorMatching(element, this._selector.pageStartMarker)
  }

  isNoBreak(element, _style = this._DOM.getComputedStyle(element)) {
    return this._DOM.isNoBreak(element)
        || this._DOM.isInlineBlock(_style)
        || this.notSolved(element);
  }

  isNoHanging(element) {
    return this._DOM.isSelectorMatching(element, this._selector.flagNoHanging)
  }

  findPreviousNoHangingsFromPage(element, topFloater, root) {
    let suitableSibling = null;
    let prev = element.previousElementSibling;

    // while the candidates are within the current page
    // (below the element from which the last registered page starts):
    while (this._DOM.getElementRootedTop(prev, root) > topFloater) {
      // if it can't be left
      if (this.isNoHanging(prev)) {
        // and it's the Start of the page
        if (this.isPageStartElement(prev)) {
          // if I'm still on the current page and have a "start" -
          // then I simply drop the case and move the original element
          return element
        } else {
          // * isNoHanging(prev) && !isPageStartElement(prev)
          // I'm looking at the previous element:
          suitableSibling = prev;
          element = prev;
          prev = element.previousElementSibling;
        }
      } else {
        // * !isNoHanging(prev) - return last computed
        return suitableSibling;
      }
    }
    return suitableSibling;
  }

  isLiNode(element) {
    return this._DOM.getElementTagName(element) === 'LI';
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

  // isSignificantChild(child) {
  //   const tag = this._DOM.getElementTagName(child);

  //   // TODO isSignificantChild
  //   // If my nodeName is #text, my height is always undefined
  //   return (tag !== 'A' && tag !== 'TT' && this._DOM.getElementHeight(child) > 0);
  // }

  // **********

  notSolved(element) {
    // TODO !!!
    // помещать такой объект просто на отдельную страницу
    // проверить, если объект больше - как печатаются номера и разрывы
    const tag = this._DOM.getElementTagName(element);
    return (tag === 'OBJECT')
  }


  // _isUnbreakable(element) {
  //   // IF currentElement is specific,
  //   // process as a whole:
  //   const tag = this._DOM.getElementTagName(element);

  //   // BUG WITH OBJECT: in FF is ignored, in Chrome get wrong height
  //   // if (tag === 'OBJECT') {
  //   //   this._debugMode && console.log('i am object');
  //   //   resizeObserver.observe(currentElement)
  //   // }

  //   // this._DOM.isNeutral(element) || 

  //   const takeAsWhole = (tag === 'IMG' || tag === 'svg' || tag === 'TABLE' || this._DOM.isNoBreak(element) || tag === 'OBJECT')
  //   return takeAsWhole;
  // }
}
