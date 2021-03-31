export default class Paper {

  constructor({
    DOM,
    template
  }) {

    this.DOM = DOM;

    this.template = template;

    this.paperHeight;
    this.headerHeight;
    this.footerHeight;
    this.bodyHeight;
    this.frontpageFactor;

    this._calculatePaperParams();

  }

  // TODO make createPaper() dependent on templates and parameters:
  // Don't create parts of the page here?

  create(current, total) {
    const body = this.DOM.createPaperBody(this.bodyHeight);
    const header = this.DOM.createPaperHeader(this.template.header);
    const footer = this.DOM.createPaperFooter(this.template.footer);

    return this.DOM.createPaper({
      header,
      body,
      footer,
      current,
      total,
    });
  }

  createFrontpage(current, total) {

    const frontpage = this.DOM.createFrontpageContent(this.template.frontpage, this.frontpageFactor);
    const body = this.DOM.createPaperBody(this.bodyHeight, frontpage);
    const header = this.DOM.createPaperHeader(this.template.header);
    const footer = this.DOM.createPaperFooter(this.template.footer);

    return this.DOM.createPaper({
      header,
      body,
      footer,
      current,
      total,
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
      frontpageTemplate: this.template.frontpage,
      headerTemplate: this.template.header,
      footerTemplate: this.template.footer,
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