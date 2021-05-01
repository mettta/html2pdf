export default class Paper {

  constructor(DOM) {

    this.DOM = DOM;

    this.frontpageTemplate = this.DOM.getFrontpageTemplate();
    this.headerTemplate = this.DOM.getHeaderTemplate();
    this.footerTemplate = this.DOM.getFooterTemplate();

    this.paperHeight;
    this.headerHeight;
    this.footerHeight;
    this.bodyHeight;
    this.frontpageFactor;

    this._calculatePaperParams();

  }

  // TODO make createPaper() dependent on templates and parameters:
  // Don't create parts of the page here?

  create({ currentPage, totalPages }) {
    const body = this.DOM.createPaperBody(this.bodyHeight);
    const header = this.DOM.createPaperHeader(this.headerTemplate);
    const footer = this.DOM.createPaperFooter(this.footerTemplate);

    return this.DOM.createPaper({
      header,
      body,
      footer,
      currentPage,
      totalPages,
    });
  }

  createFrontpage({ currentPage, totalPages }) {

    const frontpage = this.DOM.createFrontpageContent(this.frontpageTemplate, this.frontpageFactor);
    const body = this.DOM.createPaperBody(this.bodyHeight, frontpage);
    const header = this.DOM.createPaperHeader(this.headerTemplate);
    const footer = this.DOM.createPaperFooter(this.footerTemplate);

    return this.DOM.createPaper({
      header,
      body,
      footer,
      currentPage,
      totalPages,
    });
  }

  _calculatePaperParams() {

    const {
      paperHeight,
      headerHeight,
      footerHeight,
      bodyHeight,
      frontpageFactor,
    } = this.DOM.calculatePaperParams({
      frontpageTemplate: this.frontpageTemplate,
      headerTemplate: this.headerTemplate,
      footerTemplate: this.footerTemplate,
    })

    if (headerHeight > paperHeight * 0.2) {
      console.warn('It seems that your custom header is too high')
    }
    if (footerHeight > paperHeight * 0.15) {
      console.warn('It seems that your custom footer is too high')
    }
    if (frontpageFactor < 1) {
      console.warn('It seems that your frontpage content is too large. We made it smaller to fit on the page. Check out how it looks! It might make sense to fix this with styles or reduce the text amount.')
    }

    this.paperHeight = paperHeight;
    this.headerHeight = headerHeight;
    this.footerHeight = footerHeight;
    this.bodyHeight = bodyHeight;
    this.frontpageFactor = frontpageFactor;

  }
}