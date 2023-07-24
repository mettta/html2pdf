export default class Paper {

  constructor({
    config,
    DOM,
    selector
  }) {

    this.debugMode = config.debugMode;
    this.DOM = DOM;
    this.selector = selector;

    // selectors
    this.frontpageTemplateSelector = selector?.frontpageTemplate;
    this.headerTemplateSelector = selector?.headerTemplate;
    this.footerTemplateSelector = selector?.footerTemplate;

    this.paperBodySelector = selector?.paperBody || '.paperBody';
    this.paperHeaderSelector = selector?.paperHeader || '.paperHeader';
    this.paperFooterSelector = selector?.paperFooter || '.paperFooter';
    this.headerContentSelector = selector?.headerContent || '.headerContent';
    this.footerContentSelector = selector?.footerContent || '.footerContent';
    this.frontpageContentSelector = selector?.frontpageContent || '.frontpageContent';

    this.virtualPaperSelector = selector?.virtualPaper || '.virtualPaper';
    this.virtualPaperTopMarginSelector = selector?.virtualPaperTopMargin || '.virtualPaperTopMargin';
    this.virtualPaperBottomMarginSelector = selector?.virtualPaperBottomMargin || '.virtualPaperBottomMargin';

    this.pageNumberRootSelector = selector?.pageNumberRoot || undefined;
    this.pageNumberCurrentSelector = selector?.pageNumberCurrent || undefined;
    this.pageNumberTotalSelector = selector?.pageNumberTotal || undefined;

    // set:
    this.frontpageTemplate = this.DOM.getInnerHTML(this.frontpageTemplateSelector);
    this.headerTemplate = this.DOM.getInnerHTML(this.headerTemplateSelector);
    this.footerTemplate = this.DOM.getInnerHTML(this.footerTemplateSelector);

    this.paperHeight;
    this.headerHeight;
    this.footerHeight;
    this.bodyHeight;
    this.bodyWidth;
    this.frontpageFactor;

    this._calculatePaperParams();

  }

  create({ currentPage, totalPages }) {
    const body = this._createPaperBody(this.bodyHeight);
    const header = this._createPaperHeader(this.headerTemplate);
    const footer = this._createPaperFooter(this.footerTemplate);

    return this._createPaper({
      header,
      body,
      footer,
      currentPage,
      totalPages,
    });
  }

  createFrontpage({ currentPage, totalPages }) {

    const frontpage = this._createFrontpageContent(this.frontpageTemplate, this.frontpageFactor);
    const body = this._createPaperBody(this.bodyHeight, frontpage);
    const header = this._createPaperHeader(this.headerTemplate);
    const footer = this._createPaperFooter(this.footerTemplate);

    return this._createPaper({
      header,
      body,
      footer,
      currentPage,
      totalPages,
    });
  }

  createVirtualTopMargin() {
    return this.DOM.create(this.virtualPaperTopMarginSelector);
  }
  createVirtualBottomMargin() {
    return this.DOM.create(this.virtualPaperBottomMarginSelector);
  }

  // TODO make createPaper() dependent on templates and parameters:
  // Don't create parts of the page here?

  _createPaper({
    header,
    body,
    footer,
    currentPage,
    totalPages,
  }) {

    const paper = this.DOM.create(this.virtualPaperSelector);

    this.DOM.insertAtEnd(
      paper,
      this.createVirtualTopMargin(),
      header,
      body,
      footer,
      this.createVirtualBottomMargin(),
    );

    if (currentPage && totalPages) {
      this._setPageNumber(header, currentPage, totalPages);
      this._setPageNumber(footer, currentPage, totalPages);
    }

    return paper;
  }

  _createFrontpageContent(template, factor) {
    const _node = this.DOM.create(this.frontpageContentSelector);
    template && this.DOM.setInnerHTML(_node, template);
    factor && this.DOM.setStyles(_node, { transform: `scale(${factor})` });

    return _node;
  }

  _createPaperBody(height, content) {
    const _node = this.DOM.create(this.paperBodySelector);
    // Lock the height of the paperBody for the content area.
    // This affects the correct printing of the paper layer.
    this.DOM.setStyles(_node, { height: height + 'px' });
    // To create a frontpage, we can pass content here.
    content && this.DOM.insertAtEnd(_node, content);
    return _node;
  }

  _createPaperHeader(template) {
    const _node = this.DOM.create(this.paperHeaderSelector);

    if (template) {
      const content = this.DOM.create(this.headerContentSelector);
      this.DOM.setInnerHTML(content, template);
      this.DOM.insertAtEnd(_node, content);
    }
    return _node;
  }

  _createPaperFooter(template) {
    const _node = this.DOM.create(this.paperFooterSelector);

    if (template) {
      const content = this.DOM.create(this.footerContentSelector);
      this.DOM.setInnerHTML(content, template);
      this.DOM.insertAtEnd(_node, content);
    }
    return _node;
  }

  _setPageNumber(target, current, total) {
    const container = this.pageNumberRootSelector
      ? this.DOM.getElement(this.pageNumberRootSelector, target)
      : this.pageNumberRootSelector;

    if (container) {
      const currentNum = this.DOM.getElement(this.pageNumberCurrentSelector, container);
      const totalNum = this.DOM.getElement(this.pageNumberTotalSelector, container);
      this.DOM.setInnerHTML(currentNum, current);
      this.DOM.setInnerHTML(totalNum, total);
    }
  }

  _calculatePaperParams() {

    // CREATE TEST PAPER ELEMENTS
    const bodyElement = this._createPaperBody();
    const frontpageElement = this._createFrontpageContent(this.frontpageTemplate);
    const headerElement = this._createPaperHeader(this.headerTemplate);
    const footerElement = this._createPaperFooter(this.footerTemplate);

    const testPaper = this._createPaper({
      header: headerElement,
      body: bodyElement,
      footer: footerElement,
    });

    // CREATE TEMP CONTAINER
    const workbench = this.DOM.create('#workbench')
    this.DOM.setStyles(
      workbench,
      {
        position: 'absolute',
        left: '-3000px',
      }
    );
    this.DOM.insertAtEnd(workbench, testPaper);
    this.DOM.insertAtStart(this.DOM.body, workbench);

    // get heights for an blank page
    const paperHeight = this.DOM.getElementBCR(testPaper).height;
    const headerHeight = this.DOM.getElementHeight(headerElement) || 0;
    const footerHeight = this.DOM.getElementHeight(footerElement) || 0;
    const bodyHeight = this.DOM.getElementHeight(bodyElement);
    const bodyWidth = this.DOM.getElementWidth(bodyElement);

    // add frontpage text
    this.DOM.insertAtStart(bodyElement, frontpageElement);
    // get height for the frontpage content
    const filledBodyHeight = this.DOM.getElementHeight(bodyElement);

    const frontpageFactor = (filledBodyHeight > bodyHeight)
      ? bodyHeight / filledBodyHeight
      : 1;

    // REMOVE TEMP CONTAINER
    this.DOM.removeNode(workbench);

    // --------

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
    this.bodyWidth = bodyWidth;
    this.frontpageFactor = frontpageFactor;
  }
}
