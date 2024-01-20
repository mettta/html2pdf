import addCSSMask from './mask.js';

const CONSOLE_CSS_LABEL_PREVIEW = 'border:1px solid #ee00ee;'
                                + 'background:#EEEEEE;'
                                + 'color:#ee00ee;'

export default class Preview {

  // TODO SHOW STATS (with close option)

  constructor({
    config,
    DOM,
    selector,
    node,

    pages,
    layout,
    paper,
  }) {

    this._config = config;
    this._debugMode = config.debugMode;
    this._DOM = DOM;
    this._selector = selector;
    this._node = node;

    // selectors
    this._virtualPaperGapSelector = selector.virtualPaperGap;
    this._runningSafetySelector = selector.runningSafety;
    this._printPageBreakSelector = selector.printPageBreak;
    this._pageDivider = selector.pageDivider;

    // selectors used for the mask
    this._virtualPaper = selector.virtualPaper;
    this._virtualPaperTopMargin = selector.virtualPaperTopMargin;
    this._paperBody = selector.paperBody;

    // data
    this._pages = pages;
    this._root = layout.root;
    this._contentFlow = layout.contentFlow;
    this._paperFlow = layout.paperFlow;
    this._paper = paper;

    this._hasFrontPage = !!layout.frontpageTemplate;

  }

  create() {
    this._debugMode && console.groupCollapsed('%c Preview ', CONSOLE_CSS_LABEL_PREVIEW);
    this._processFirstPage();
    this._processOtherPages();
    (this._config.mask === true || this._config.mask === 'true') && this._addMask();
    this._debugMode && console.groupEnd('%c Preview ', CONSOLE_CSS_LABEL_PREVIEW);

  }

  _addMask() {
    // The height of the paper is converted from millimeters to pixels.
    // The 'height' of the HTML element will be an integer, which is inaccurate.
    // In fact, it most likely contains a fractional part, and inaccuracy is accumulated.
    // Therefore, let's calculate the average value on the whole set of pages.
    const papers = [...this._paperFlow.querySelectorAll(this._virtualPaper)];
    const maskHeight = this._DOM.getElementTop(papers.at(-1)) / (papers.length - 1);

    // The height of the topMargin is converted from millimeters to pixels.
    // The 'height' of the HTML element will be an integer, which is inaccurate.
    // But we use this shift only 1 time, so the error is insignificant.
    const topMargin = this._DOM.getElementHeight(
      this._paperFlow.querySelector(this._virtualPaperTopMargin)
    );

    const bodyHeight = this._DOM.getElementHeight(
      this._paperFlow.querySelector(this._paperBody)
    );

    // TODO: do a simplified calculation based on pixel dimensions
    addCSSMask({
      targetElement: this._contentFlow,
      maskHeight: maskHeight,
      maskWindow: bodyHeight,
      maskTopPosition: topMargin,
    })
  }

  _processFirstPage() {
    // LET'S MAKE A FIRST PAGE.
    let firstPage;

    if (this._hasFrontPage) {
      // IF FRONTPAGE,

      // insert Frontpage Spacer into Content Flow,
      // get a reference to the inserted element,
      const frontpage = this._insertFrontpageSpacer(this._contentFlow, this._paper.bodyHeight);

      // register the added Frontpage Spacer in pages array,
      // thereby increasing the number of pages by 1.
      this._pages.unshift({ // todo unshift performance?
        pageStart: frontpage
      });
      // Create a paper with the added frontpage template
      firstPage = this._paper.createFrontpage({
        currentPage: 1,
        totalPages: this._pages.length
      });
    } else {
      // Create a blank paper
      firstPage = this._paper.create({
        currentPage: 1,
        totalPages: this._pages.length
      });
    }

    // insert first page without pre-separator
    this._insertIntoPaperFlow(firstPage)
    // ADD ONLY HEADER into Content Flow before the first page.
    this._insertIntoContentFlow(0);
  }

  _processOtherPages() {
    // And now add all the remaining pages, except for the first one.
    for (let index = 1; index < this._pages.length; index++) {

      const paper = this._paper.create({
        currentPage: index + 1,
        totalPages: this._pages.length
      });
      const paperSeparator = this._createVirtualPaperGap();

      // insert with pre-separator
      this._insertIntoPaperFlow(paper, paperSeparator)

      // ADD FOOTER and HEADER into Content Flow (as page break)
      this._insertIntoContentFlow(index, paperSeparator);
    }
  }

  _insertIntoPaperFlow(paper, separator) {
    // ADD VIRTUAL PAGE into Paper Flow,
    // with corresponding page number and pre-filled or blank,
    // with or without pre-separator.
    this._insertPaper(
      this._paperFlow,
      paper,
      separator,
    );
  }

  _insertIntoContentFlow(pageIndex, separator) {
    const element = this._pages[pageIndex].pageStart;
    // ADD FOOTER and HEADER into Content Flow (as page break),
    // ADD ONLY HEADER into Content Flow before the first page.

    const pageDivider = this._createPageBreaker(pageIndex, separator);
    // This wrapper pageDivider must be inserted into the DOM immediately,
    // because in the process of creating and inserting the footer into the DOM,
    // balancing is going on, and the parent of the spacer
    // must already be in the DOM.
    this._DOM.insertBefore(element, pageDivider);

    separator && this._insertFooterSpacer(pageDivider, this._paper.footerHeight, separator);
    this._insertHeaderSpacer(pageDivider, this._paper.headerHeight);
    this._updatePageStartElementAttrValue(element, pageIndex);
  }

  _createPageBreaker(pageIndex, separator) {
    // PageBreaker isolates all inserted elements
    // to create a new formatting context,
    // and also used to determine which page an object is on.

    // TODO move to DOM:
    const pageDivider = this._node.create(this._pageDivider);
    this._DOM.setAttribute(pageDivider, '[page]', `${pageIndex + 1}`);

    // Non-virtual margins need to be added to the outer wrapper pageDivider,
    // because if the code of the document being printed puts
    // this breaking element into an inline context,
    // the margins will not work correctly
    // (instead of internal elements - header and footer, whose margins are lost
    // in cases like inline formatting of one of the parents).

    // * because of firefox, we added 1pixel of padding for runningSafety in style.js,
    // * and are now subtracting it to compensate.
    // FIXME -1
    (separator && this._paper.footerHeight) && this._DOM.setStyles(pageDivider, { marginTop: this._paper.footerHeight - 1 + 'px' });
    this._paper.headerHeight && this._DOM.setStyles(pageDivider, { marginBottom: this._paper.headerHeight - 1 + 'px' });

    return pageDivider;
  }

  _updatePageStartElementAttrValue(element, pageIndex) {
    //  frontpage on page 1 forces page numbers to be refreshed
    // this._debugMode && console.log(`${pageIndex + 1}`, element, )
    this._hasFrontPage && this._DOM.markPageStartElement(element, `${pageIndex + 1}`);
  }

  _insertPaper(paperFlow, paper, separator) {
    if (separator) {
      // pages that come after the page break
      this._DOM.insertAtEnd(
        paperFlow,
        // this.createPrintPageBreak(), // has no effect
        separator,
        paper,
      );
    } else {
      // first page
      this._DOM.insertAtEnd(
        paperFlow,
        paper,
      );
    }
  }

  // create elements

  _createVirtualPaperGap() {
    return this._node.create(this._virtualPaperGapSelector);
  }

  _createVirtualPaperTopMargin() {
    return this._paper.createVirtualTopMargin()
  }

  _createVirtualPaperBottomMargin() {
    return this._paper.createVirtualBottomMargin()
  }

  _insertFrontpageSpacer(target, bodyHeight) {
    // create spacer element
    const spacer = this._node.create();
    this._DOM.setStyles(spacer, { paddingBottom: bodyHeight + 'px' });
    this._DOM.setAttribute(spacer, '.printFrontpageSpacer');

    // insert filler element into content
    this._DOM.insertAtStart(target, spacer);

    // return ref
    return spacer;
  }

  _insertHeaderSpacer(target, headerHeight) {

    const headerSpacer = this._DOM.createDocumentFragment();

    // In the virtual footer/header we add an empty element
    // with a calculated height instead of the content.
    // We use margins to compensate for possible opposite margins in the content.
    const balancingHeader = this._node.create(this._runningSafetySelector);

    this._DOM.insertAtEnd(
      headerSpacer,
      this._createVirtualPaperTopMargin(),
      balancingHeader,
    )

    // Put into DOM inside the target, in its lower part
    this._DOM.insertAtEnd(target, headerSpacer)
  }

  _insertFooterSpacer(target, footerHeight, paperSeparator) {

    const footerSpacer = this._DOM.createDocumentFragment();

    // Based on contentSeparator (virtual, not printed element, inserted into contentFlow)
    // and paperSeparator (virtual, not printed element, inserted into paperFlow),
    // calculate the height of the necessary compensator to visually fit page breaks
    // in the content in contentFlow and virtual page images on the screen in paperFlow.
    const contentSeparator = this._createVirtualPaperGap();

    // In the virtual footer/header we add an empty element
    // with a calculated height instead of the content.
    // We use margins to compensate for possible opposite margins in the content.

    // In this element we will add a compensator.
    // We create it with a basic compensator,
    // which takes into account now only the footerHeight.
    const balancingFooter = this._node.create(this._runningSafetySelector);

    this._DOM.insertAtEnd(
      footerSpacer,
      balancingFooter,
      this._createVirtualPaperBottomMargin(),
      this._node.create(this._printPageBreakSelector), // PageBreak
      contentSeparator,
    )

    // Put into DOM inside the target, in its upper part
    this._DOM.insertAtStart(target, footerSpacer);

    this._balanceFooter(balancingFooter, contentSeparator, paperSeparator);
  }

  _balanceFooter(balancingFooter, contentSeparator, paperSeparator) {
    // * Must be run after all members have been added to the DOM.
    // Determine what inaccuracy there is visually in the break simulation position,
    // focusing on the difference between the position of the paired elements
    // in Paper Flow and Content Flow, and compensate for it.
    const balancer = this._DOM.getElementRootedTop(paperSeparator, this._root) - this._DOM.getElementRootedTop(contentSeparator, this._root);

    this._DOM.setStyles(balancingFooter, { marginBottom: balancer + 'px' });

    // TODO check if negative on large documents
    this._debugMode && console.assert(balancer >= 0, `balancer is negative: ${balancer} < 0`, contentSeparator);
  }

}
