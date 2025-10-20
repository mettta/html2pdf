export default class Paper {

  constructor({
    config,
    DOM,
    node,
    selector,
    layout,
  }) {
    // * From config:
    this._debug = config.debugMode ? { ...config.debugConfig.paper } : {};

    // * private
    this._DOM = DOM;
    this._selector = selector;
    this._node = node;

    // templates
    this._frontpageTemplate = layout.frontpageTemplate;
    this._headerTemplate = layout.headerTemplate;
    this._footerTemplate = layout.footerTemplate;

    // selectors
    this._paperBodySelector = selector?.paperBody || '.paperBody';
    this._paperHeaderSelector = selector?.paperHeader || '.paperHeader';
    this._paperFooterSelector = selector?.paperFooter || '.paperFooter';
    this._headerContentSelector = selector?.headerContent || '.headerContent';
    this._footerContentSelector = selector?.footerContent || '.footerContent';
    this._frontpageElementSelector = selector?.frontpageElement || '.frontpageElement';
    this._frontpageContentSelector = selector?.frontpageContent || '.frontpageContent';

    this._virtualPaperSelector = selector?.virtualPaper || '.virtualPaper';
    this._virtualPaperTopMarginSelector = selector?.virtualPaperTopMargin || '.virtualPaperTopMargin';
    this._virtualPaperBottomMarginSelector = selector?.virtualPaperBottomMargin || '.virtualPaperBottomMargin';

    this._pageNumberRootSelector = selector?.pageNumberRoot || undefined;
    this._pageNumberCurrentSelector = selector?.pageNumberCurrent || undefined;
    this._pageNumberTotalSelector = selector?.pageNumberTotal || undefined;

    // * private page params
    this._paperHeight;
    this._frontpageFactor;

    // * public page params
    this.headerHeight;
    this.footerHeight;
    this.bodyHeight;
    this.bodyWidth;

    this._calculatePaperParams();
  }

  create({ pageNumber, pageCount }) {
    const body = this._createPaperBody(this.bodyHeight);
    const header = this._createPaperHeader(this._headerTemplate);
    const footer = this._createPaperFooter(this._footerTemplate);

    return this._createPaper({
      header,
      body,
      footer,
      pageNumber,
      pageCount,
    });
  }

  createFrontpage() {
    if (!this._frontpageTemplate) {
      this._debug && console.warn('[paper • createFrontpage()] called without a template');
      return
    }

    const frontpageElement = this._node.create(this._frontpageElementSelector);
    const frontpageContent = this._createFrontpageContent(this._frontpageTemplate, this._frontpageFactor);
    this._DOM.setStyles(frontpageElement, { height: this.bodyHeight + 'px' });
    this._DOM.insertAtStart(frontpageElement, frontpageContent);
    return frontpageElement;
  }

  createVirtualTopMargin() {
    return this._node.create(this._virtualPaperTopMarginSelector);
  }
  createVirtualBottomMargin() {
    return this._node.create(this._virtualPaperBottomMarginSelector);
  }

  // TODO make createPaper() dependent on templates and parameters:
  // Don't create parts of the page here?

  _createPaper({
    header,
    body,
    footer,
    pageNumber,
    pageCount,
  }) {

    const paper = this._node.create(this._virtualPaperSelector);

    this._DOM.insertAtEnd(
      paper,
      this.createVirtualTopMargin(),
      header,
      body,
      footer,
      this.createVirtualBottomMargin(),
    );

    if (pageNumber && pageCount) {
      this._setPageNumber(header, pageNumber, pageCount);
      this._setPageNumber(footer, pageNumber, pageCount);
    }

    return paper;
  }

  _createFrontpageContent(template, factor) {
    const _node = this._node.create(this._frontpageContentSelector);
    template && this._DOM.setInnerHTML(_node, template);
    factor && this._DOM.setStyles(_node, { transform: `scale(${factor})` });

    return _node;
  }

  _createPaperBody(height, content) {
    const _node = this._node.create(this._paperBodySelector);
    // Lock the height of the paperBody for the content area.
    // This affects the correct printing of the paper layer.
    this._DOM.setStyles(_node, { height: height + 'px' });
    // To create a frontpage, we can pass content here.
    content && this._DOM.insertAtEnd(_node, content);
    return _node;
  }

  _createPaperHeader(template) {
    const _node = this._node.create(this._paperHeaderSelector);

    if (template) {
      const content = this._node.create(this._headerContentSelector);
      this._DOM.setInnerHTML(content, template);
      this._DOM.insertAtEnd(_node, content);
    }
    return _node;
  }

  _createPaperFooter(template) {
    const _node = this._node.create(this._paperFooterSelector);

    if (template) {
      const content = this._node.create(this._footerContentSelector);
      this._DOM.setInnerHTML(content, template);
      this._DOM.insertAtEnd(_node, content);
    }
    return _node;
  }

  _setPageNumber(target, current, total) {
    const container = this._pageNumberRootSelector
      ? this._DOM.getElement(this._pageNumberRootSelector, target)
      : this._pageNumberRootSelector;

    if (container) {
      const currentNum = this._DOM.getElement(this._pageNumberCurrentSelector, container);
      const totalNum = this._DOM.getElement(this._pageNumberTotalSelector, container);
      this._DOM.setInnerHTML(currentNum, current);
      this._DOM.setInnerHTML(totalNum, total);
    }
  }

  _calculatePaperParams() {

    // CREATE TEST PAPER ELEMENTS
    const bodyElement = this._createPaperBody();
    const frontpageElement = this._createFrontpageContent(this._frontpageTemplate);
    const headerElement = this._createPaperHeader(this._headerTemplate);
    const footerElement = this._createPaperFooter(this._footerTemplate);

    const testPaper = this._createPaper({
      header: headerElement,
      body: bodyElement,
      footer: footerElement,
    });

    // CREATE TEMP CONTAINER
    const workbench = this._node.create('#workbench')
    this._DOM.setStyles(
      workbench,
      {
        position: 'absolute',
        left: '-3000px',
      }
    );
    this._DOM.insertAtEnd(workbench, testPaper);
    this._DOM.insertAtStart(this._DOM.body, workbench);

    // get heights for an blank page
    const paperHeight = this._DOM.getElementBCR(testPaper).height;
    const headerHeight = this._DOM.getElementOffsetHeight(headerElement) || 0;
    const footerHeight = this._DOM.getElementOffsetHeight(footerElement) || 0;
    const bodyHeight = this._DOM.getElementOffsetHeight(bodyElement);
    const bodyWidth = this._DOM.getElementOffsetWidth(bodyElement);

    // add frontpage text
    this._DOM.insertAtStart(bodyElement, frontpageElement);
    // get height for the frontpage content
    const filledBodyHeight = this._DOM.getElementOffsetHeight(bodyElement);

    const frontpageFactor = (filledBodyHeight > bodyHeight)
      ? bodyHeight / filledBodyHeight
      : 1;

    // REMOVE TEMP CONTAINER
    this._DOM.removeNode(workbench);

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

    this._paperHeight = paperHeight;
    this.headerHeight = headerHeight;
    this.footerHeight = footerHeight;
    this.bodyHeight = bodyHeight;
    this.bodyWidth = bodyWidth;
    this._frontpageFactor = frontpageFactor;
  }
}
