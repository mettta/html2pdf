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

    pages,
    layout,
    paper,
  }) {

    this.config = config;
    this.debugMode = config.debugMode;
    this.DOM = DOM;
    this.selector = selector;

    // selectors
    this.virtualPaperGapSelector = selector?.virtualPaperGap;
    this.runningSafetySelector = selector?.runningSafety;
    this.printPageBreakSelector = selector?.printPageBreak;
    this.pageMarker = selector?.pageMarker;

    // selectors used for the mask
    this.virtualPaper = selector?.virtualPaper;
    this.virtualPaperTopMargin = selector?.virtualPaperTopMargin;
    this.paperBody = selector?.paperBody;

    // data
    this.pages = pages;
    this.root = layout.root;
    this.contentFlow = layout.contentFlow;
    this.paperFlow = layout.paperFlow;
    this.paper = paper;

    this.hasFrontPage = !!this.paper.frontpageTemplate;

  }

  create() {
    this.debugMode && console.groupCollapsed('%c Preview ', CONSOLE_CSS_LABEL_PREVIEW);
    this._processFirstPage();
    this._processOtherPages();
    (this.config.mask === 'true') && this._addMask();
    this.debugMode && console.groupEnd('%c Preview ', CONSOLE_CSS_LABEL_PREVIEW);

  }

  _addMask() {
    // The height of the paper is converted from millimeters to pixels.
    // The 'height' of the HTML element will be an integer, which is inaccurate.
    // In fact, it most likely contains a fractional part, and inaccuracy is accumulated.
    // Therefore, let's calculate the average value on the whole set of pages.
    const papers = [...this.paperFlow.querySelectorAll(this.virtualPaper)];
    const maskHeight = this.DOM.getElementTop(papers.at(-1)) / (papers.length - 1);

    // The height of the topMargin is converted from millimeters to pixels.
    // The 'height' of the HTML element will be an integer, which is inaccurate.
    // But we use this shift only 1 time, so the error is insignificant.
    const topMargin = this.DOM.getElementHeight(
      this.paperFlow.querySelector(this.virtualPaperTopMargin)
    );

    const bodyHeight = this.DOM.getElementHeight(
      this.paperFlow.querySelector(this.paperBody)
    );

    addCSSMask({
      targetElement: this.contentFlow,
      maskHeight: maskHeight,
      maskWindow: bodyHeight,
      maskTopPosition: topMargin,
    })
  }

  _processFirstPage() {
    // LET'S MAKE A FIRST PAGE.
    let firstPage;

    if (this.hasFrontPage) {
      // IF FRONTPAGE,

      // insert Frontpage Spacer into Content Flow,
      // get a reference to the inserted element,
      const frontpage = this._insertFrontpageSpacer(this.contentFlow, this.paper.bodyHeight);

      // register the added Frontpage Spacer in pages array,
      // thereby increasing the number of pages by 1.
      this.pages.unshift({ // todo unshift performance?
        pageStart: frontpage
      });
      // Create a paper with the added frontpage template
      firstPage = this.paper.createFrontpage({
        currentPage: 1,
        totalPages: this.pages.length
      });
    } else {
      // Create a blank paper
      firstPage = this.paper.create({
        currentPage: 1,
        totalPages: this.pages.length
      });
    }

    // insert first page without pre-separator
    this._insertIntoPaperFlow(firstPage)
    // ADD ONLY HEADER into Content Flow before the first page.
    this._insertIntoContentFlow(0);
  }

  _processOtherPages() {
    // And now add all the remaining pages, except for the first one.
    for (let index = 1; index < this.pages.length; index++) {

      const paper = this.paper.create({
        currentPage: index + 1,
        totalPages: this.pages.length
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
      this.paperFlow,
      paper,
      separator,
    );
  }

  _insertIntoContentFlow(pageIndex, separator) {
    const element = this.pages[pageIndex].pageStart;
    // ADD FOOTER and HEADER into Content Flow (as page break),
    // ADD ONLY HEADER into Content Flow before the first page.
    // PageMarker is used to determine which page an object is on.
    separator && this._insertFooterSpacer(element, this.paper.footerHeight, separator);
    this._insertPageStartMarker(element, pageIndex);
    this._insertHeaderSpacer(element, this.paper.headerHeight);
    this._updatePageStartElementAttrValue(element, pageIndex);
  }

  _insertPageStartMarker(target, pageIndex) {
    // TODO move to DOM:
    const pageMarker = this.DOM.create(this.pageMarker);
    this.DOM.setAttribute(pageMarker, '[page]', `${pageIndex + 1}`)
    this.DOM.insertBefore(target, pageMarker)
  }

  _updatePageStartElementAttrValue(element, pageIndex) {
    // makes sense if there is a frontpage
    // that is not registered in the page array,
    // and there is no element that starts it,
    // so it needs to increase by 1 the numbering for starting elements:
    this.hasFrontPage && this.DOM.markPageStartElement(element, `${pageIndex + 2}`);
  }

  _insertPaper(paperFlow, paper, separator) {
    if (separator) {
      // pages that come after the page break
      this.DOM.insertAtEnd(
        paperFlow,
        // this.createPrintPageBreak(), // has no effect
        separator,
        paper,
      );
    } else {
      // first page
      this.DOM.insertAtEnd(
        paperFlow,
        paper,
      );
    }
  }

  // create elements

  _createVirtualPaperGap() {
    return this.DOM.create(this.virtualPaperGapSelector);
  }

  _createVirtualPaperTopMargin() {
    return this.paper.createVirtualTopMargin()
  }

  _createVirtualPaperBottomMargin() {
    return this.paper.createVirtualBottomMargin()
  }

  _insertFrontpageSpacer(target, bodyHeight) {
    // create spacer element
    const spacer = this.DOM.create();
    this.DOM.setStyles(spacer, { paddingBottom: bodyHeight + 'px' });
    this.DOM.setAttribute(spacer, '.printFrontpageSpacer');

    // insert filler element into content
    this.DOM.insertAtStart(target, spacer);

    // return ref
    return spacer;
  }

  _insertHeaderSpacer(target, headerHeight) {

    // In the virtual footer/header we add an empty element
    // with a calculated height instead of the content.
    // We use margins to compensate for possible opposite margins in the content.
    const balancingHeader = this.DOM.create(this.runningSafetySelector);
    // * because of firefox, we added 1pixel of padding for runningSafety in style.js,
    // * and are now subtracting it to compensate (in marginBottom).
    headerHeight && this.DOM.setStyles(balancingHeader, { marginBottom: headerHeight - 1 + 'px' });

    const headerSpacer = this.DOM.createDocumentFragment();
    this.DOM.insertAtEnd(
      headerSpacer,
      this._createVirtualPaperTopMargin(),
      balancingHeader,
    )

    // Put into DOM
    this.DOM.insertBefore(target, headerSpacer)
  }

  _insertFooterSpacer(target, footerHeight, paperSeparator) {

    // In the virtual footer/header we add an empty element
    // with a calculated height instead of the content.
    // We use margins to compensate for possible opposite margins in the content.

    // In this element we will add a compensator.
    // We create it with a basic compensator,
    // which takes into account now only the footerHeight.
    const balancingFooter = this.DOM.create(this.runningSafetySelector);
    // * because of firefox, we added 1pixel of padding for runningSafety in style.js,
    // * and are now subtracting it to compensate (in marginTop).
    footerHeight && this.DOM.setStyles(balancingFooter, { marginTop: footerHeight - 1 + 'px' });

    // Based on contentSeparator (virtual, not printed element, inserted into contentFlow)
    // and paperSeparator (virtual, not printed element, inserted into paperFlow),
    // calculate the height of the necessary compensator to visually fit page breaks
    // in the content in contentFlow and virtual page images on the screen in paperFlow.
    const contentSeparator = this._createVirtualPaperGap();

    const footerSpacer = this.DOM.createDocumentFragment();
    this.DOM.insertAtEnd(
      footerSpacer,
      balancingFooter,
      this._createVirtualPaperBottomMargin(),
      this.DOM.create(this.printPageBreakSelector), // PageBreak
      contentSeparator,
    )

    // Put into DOM
    this.DOM.insertBefore(target, footerSpacer)

    // Determine what inaccuracy there is visually in the break simulation position,
    // and compensate for it.
    const balancer = this.DOM.getElementRootedTop(paperSeparator, this.root) - this.DOM.getElementRootedTop(contentSeparator, this.root);
    this.DOM.setStyles(balancingFooter, { marginBottom: balancer + 'px' });

    // TODO check if negative on large documents
    this.debugMode && console.log('%c balancer ', CONSOLE_CSS_LABEL_PREVIEW, balancer);
  }

}
