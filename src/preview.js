const CONSOLE_CSS_LABEL_PREVIEW = 'border:1px solid #ee00ee;'
                                + 'background:#EEEEEE;'
                                + 'color:#ee00ee;'

export default class Preview {

  // TODO SHOW STATS (with close option)

  constructor({
    debugMode,
    DOM,
    selector,

    pages,
    layout,
    paper,
  }) {

    this.debugMode = debugMode;
    this.DOM = DOM;
    this.selector = selector;

    // selectors
    this.virtualPaperGapSelector = selector?.virtualPaperGap;
    this.runningSafetySelector = selector?.runningSafety;
    this.printPageBreakSelector = selector?.printPageBreak;

    // data
    this.pages = pages;
    this.root = layout.root;
    this.contentFlow = layout.contentFlow;
    this.paperFlow = layout.paperFlow;
    this.paper = paper;

  }

  create() {
    this.debugMode && console.groupCollapsed('%c Preview ', CONSOLE_CSS_LABEL_PREVIEW);
    this._processFirstPage();
    this._processOtherPages();
    this.debugMode && console.groupEnd('%c Preview ', CONSOLE_CSS_LABEL_PREVIEW);

  }

  _processFirstPage() {
    // LET'S MAKE A FIRST PAGE.
    let firstPage;

    if (this.paper.frontpageTemplate) {
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
    this._insertIntoContentFlow(this.pages[0].pageStart);
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
      this._insertIntoContentFlow(this.pages[index].pageStart, paperSeparator);
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

  _insertIntoContentFlow(element, separator) {
    // ADD FOOTER and HEADER into Content Flow (as page break),
    // ADD ONLY HEADER into Content Flow before the first page.
    separator && this._insertFooterSpacer(element, this.paper.footerHeight, separator);
    this._insertHeaderSpacer(element, this.paper.headerHeight);
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
    headerHeight && this.DOM.setStyles(balancingHeader, { marginBottom: headerHeight + 'px' });

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
    footerHeight && this.DOM.setStyles(balancingFooter, { marginTop: footerHeight + 'px' });

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
