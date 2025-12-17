import * as Logging from './utils/logging.js';

export default class Validator {
  constructor({
    config,
    DOM,
    selector,
    node,
    layout,
    pages,
    previewValidations,
  }) {
    this._config = config;
    this._selector = selector;
    this._DOM = DOM;
    this._node = node;
    this._layout = layout;
    this._root = layout.root;

    this._pageCount = pages.length;
    this._accumulatedAssertions = previewValidations;

    this._assert = config.consoleAssert ? true : false;
    Object.assign(this, Logging);
  }

  init() {
    this._config.debugMode && console.log('🐙 i am Validator!');
    const pagesWithOverflow = this._collectPageOverflowAssertions();

    for (const [page, data] of Object.entries(pagesWithOverflow)) {
      this._accumulatedAssertions[page] = {
        ...(this._accumulatedAssertions[page] || {}),
        ...data,
      };
    }

    this.strictAssert(Object.keys(this._accumulatedAssertions).length === 0, 'Page overflow detected:', this._accumulatedAssertions);
  }

  _collectPageOverflowAssertions() {
   // * selectors
    const paperGapSelector = `${this._selector.paperFlow} ${this._selector.virtualPaperGap}`;
    const pageGapSelector = `${this._selector.contentFlow} ${this._selector.virtualPaperGap}`;
    const contentFlowEndSelector = `${this._selector.contentFlow} ${this._selector.contentFlowEnd}`;
    const pageEndMarkerSelector = `${this._selector.contentFlow} ${this._selector.pageEndMarker}`;
    const bodySpacerSelector = `${this._selector.pageChrome} ${this._selector.pageBodySpacer}`;

    // * elements
    const paperGapElements = [...this._DOM.getAllElements(paperGapSelector)];
    const pageGapElements = [...this._DOM.getAllElements(pageGapSelector)];
    const bodySpacerElements = [...this._DOM.getAllElements(bodySpacerSelector)];
    const contentFlowEndElement = this._DOM.getElement(contentFlowEndSelector);
    const rawPageEndElements = this._DOM.getAllElements(pageEndMarkerSelector);
    const sortedPageEndElements = Array.from(rawPageEndElements).sort((a, b) => {
      const numA = parseInt(a.getAttribute('html2pdf-page-end'), 10) || 0;
      const numB = parseInt(b.getAttribute('html2pdf-page-end'), 10) || 0;
      return numA - numB;
    });
    const pageEndElements = [...sortedPageEndElements, contentFlowEndElement];

    // * CHECK

    this._assertElementsCount(
      this._pageCount - 1, // * last page has no gap
      {
        paperGapElements,
        pageGapElements,
      }
    );

    this._assertElementsCount(
      this._pageCount,
      {
        bodySpacerElements,
        pageEndElements,
      }
    );

    const pagesWithOverflow = {};

    const paperGapTops = paperGapElements.map(paperGap => this._node.getTop(paperGap, this._root));
    const pageGapTops = pageGapElements.map(pageGap => this._node.getTop(pageGap, this._root));
    for (let index = 0; index < paperGapTops.length; index += 1) {
      const paperGapTop = paperGapTops[index];
      const pageGapTop = pageGapTops[index];
      if (paperGapTop !== pageGapTop) {
        const problemPageNumber = index + 1;
        (pagesWithOverflow[problemPageNumber] ??= {}).pageNumber = problemPageNumber;
        (pagesWithOverflow[problemPageNumber] ??= {}).paperGap = paperGapElements[index];
        (pagesWithOverflow[problemPageNumber] ??= {}).pageGap = pageGapElements[index];
      }
    }

    const bodyBottoms = bodySpacerElements.map(body => this._node.getBottom(body, this._root));
    const pageEndBottoms = pageEndElements.map(el => this._node.getBottom(el, this._root));
    for (let index = 0; index < bodyBottoms.length; index += 1) {
      const bodyBottom = bodyBottoms[index];
      const pageEndBottom = pageEndBottoms[index];
      if (bodyBottom < pageEndBottom) {
        const problemPageNumber = index + 1;
        (pagesWithOverflow[problemPageNumber] ??= {}).pageNumber = problemPageNumber;
        (pagesWithOverflow[problemPageNumber] ??= {}).overflowingPageEnd = pageEndElements[index];
        (pagesWithOverflow[problemPageNumber] ??= {}).overflowingPage = bodySpacerElements[index];
      }
    }

    return pagesWithOverflow
  }

  _assertElementsCount(expected, elementsMap) {
    const details = [];

    for (const name in elementsMap) {
      const arr = elementsMap[name];

      if (!Array.isArray(arr)) {
        details.push(`${name}=not an array`);
        continue;
      }

      if (arr.length !== expected) {
        details.push(`${name}=${arr.length}`);
      }
    }

    this.strictAssert(
      details.length === 0,
      `The number of structural elements does not match. Expected ${expected}, mismatched: ${details.join(', ')}`
    );
  }
}
