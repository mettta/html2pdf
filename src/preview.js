export default class Preview {

  // TODO SHOW STATS (with close option)

  constructor({
    DOM,
    pages,
    contentFlow,
    paperFlow,
    paper,

  }) {

    this.DOM = DOM;
    this.pages = pages;
    this.contentFlow = contentFlow;
    this.paperFlow = paperFlow;
    this.paper = paper;

  }

  create() {

    if (this.paper.frontpageTemplate) {
      // IF FRONTPAGE,
      // insert spacing element into content,
      // get a reference to the inserted element,
      const frontpageRef = this.DOM.insertFrontpageSpacer(this.contentFlow, this.paper.bodyHeight);

      // register spacing element and an additional page.
      this.pages[0].pageEnd = frontpageRef;
      this.pages.unshift({
        pageStart: frontpageRef,
        isFrontpage: true
      });
    }

    // Total number of pages,
    // including frontpage, if it was added above.
    const total = this.pages.length;

    this.pages.map((item, index) => {

      const currentPageNumber = index + 1;

      const {
        pageEnd,
        pageStart,
        isFrontpage,
      } = item;

      const currentPaper = isFrontpage
        ? this.paper.createFrontpage(currentPageNumber, total)
        : this.paper.create(currentPageNumber, total);

      if (pageEnd) {
        // If it is a page break and not the first header,
        // ADD VIRTUAL PAGE with pre-separator.
        const currentPaperSeparator = this.DOM.createVirtualPaperGap();

        this.DOM.insertPaper(
          this.paperFlow,
          currentPaper,
          currentPaperSeparator,
        );

        // ADD FOOTER and HEADER into Content Flow (as page break)
        this.DOM.insertFooterSpacer(pageStart, this.paper.footerHeight, currentPaperSeparator);
        this.DOM.insertHeaderSpacer(pageStart, this.paper.headerHeight);

      } else {
        // If it is the first header,
        // ADD VIRTUAL PAGE without pre-separator.
        this.DOM.insertPaper(
          this.paperFlow,
          currentPaper,
          // without separator
        );

        // ADD HEADER into Content Flow
        this.DOM.insertHeaderSpacer(pageStart, this.paper.headerHeight);
      }
    })
  }
}