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

    this._processFirstPage();
    this._processOtherPages();

  }

  _processFirstPage() {
    // LET'S MAKE A FIRST PAGE.
    let firstPage;

    if (this.paper.frontpageTemplate) {
      // IF FRONTPAGE,

      // insert Frontpage Spacer into Content Flow,
      // get a reference to the inserted element,
      const frontpage = this.DOM.insertFrontpageSpacer(this.contentFlow, this.paper.bodyHeight);

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
      const paperSeparator = this.DOM.createVirtualPaperGap();

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
    this.DOM.insertPaper(
      this.paperFlow,
      paper,
      separator,
    );
  }

  _insertIntoContentFlow(element, separator) {
    // ADD FOOTER and HEADER into Content Flow (as page break),
    // ADD ONLY HEADER into Content Flow before the first page.
    separator && this.DOM.insertFooterSpacer(element, this.paper.footerHeight, separator);
    this.DOM.insertHeaderSpacer(element, this.paper.headerHeight);
  }
}