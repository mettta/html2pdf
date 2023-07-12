const CONSOLE_CSS_LABEL_LAYOUT = 'border:1px solid #8888CC;'
                               + 'background:#EEEEEE;'
                               + 'color:#8888CC;'

export default class Layout {

  constructor({
    config,
    DOM,
    selector
  }) {

    this.debugMode = config.debugMode;

    this.DOM = DOM;
    this.selector = selector;
    // selectors
    this.rootSelector = selector?.root;
    this.paperFlowSelector = selector?.paperFlow;
    this.contentFlowSelector = selector?.contentFlow;
    this.printIgnoreElementSelector = selector?.printIgnore;
    this.printHideElementSelector = selector?.printHide;

    this.root = this._initRoot();
    this.paperFlow = this._createPaperFlow();
    this.contentFlow = this._createContentFlow();

  }

  // todo
  // сохранять изначальный элемент, на который был добавлен тег root,
  // чтобы его верстка не пострадала.

  create() {
    this.debugMode && console.groupCollapsed('%c Layout ', CONSOLE_CSS_LABEL_LAYOUT);

    // clean up the Root before append.
    this.DOM.setInnerHTML(this.root, '');

    // createLayout
    this.DOM.insertAtEnd(this.root, this.paperFlow, this.contentFlow)

    // disable printing the root environment
    if (this.root !== this.DOM.body) {
      this._ignorePrintingEnvironment(this.root);
    }

    this.debugMode && console.groupEnd('%c Layout ', CONSOLE_CSS_LABEL_LAYOUT);
  }

  _initRoot() {
    // Prepare root element
    let root = this.DOM.getElement(this.rootSelector);
    this.debugMode && console.log('%c Layout: init root ', CONSOLE_CSS_LABEL_LAYOUT, root);
    if (!root) {
      root = this.DOM.body;
      this.DOM.setAttribute(root, this.rootSelector)
      console.warn(`Add ${this.rootSelector} to the root element of the area you want to print. ${this.rootSelector} is now automatically added to the BODY tag.`);
    }
    return root;
  }

  _createPaperFlow() {
    // return this.DOM.createPaperFlow();
    return this.DOM.create(this.paperFlowSelector);
  }

  _createContentFlow() {
    const contentFlow = this.DOM.create(this.contentFlowSelector);

    const printedContent = this.DOM.getInnerHTML(this.root);
    const significantPrintedContent = (printedContent.trim().length > 0) ? true : false;

    if (significantPrintedContent) {
      // Copy the content from Root into contentFlow,
      this.DOM.setInnerHTML(contentFlow, printedContent);
      // remove all <template>s, if there are any in the Root,
      this.DOM.clearTemplates(contentFlow);
      // add an empty div as a safeguard element to the end of content flow,
      this.DOM.insertAtEnd(contentFlow, this.DOM.create('[data-content-flow-end]'));
    } else {
      console.warn(`It looks like you don't have any printable content.`);
    }

    return contentFlow;
  }

  _ignorePrintingEnvironment(root) {
    let parentNode = this.DOM.getParentNode(root);

    // this.DOM.setPrintIgnore(parentNode);
    this.DOM.setAttribute(parentNode, this.printIgnoreElementSelector);

    this.DOM.getChildNodes(parentNode)
      .forEach((child) => {

        if (child !== root && this.DOM.isElementNode(child)) {
          // this.DOM.setPrintHide(child);
          this.DOM.setAttribute(child, this.printHideElementSelector);

        } else if (this.DOM.isSignificantTextNode(child)) {
          // process text nodes
          // this.DOM.setPrintHide(this.DOM.wrapTextNode(child));
          this.DOM.setAttribute(this.DOM.wrapTextNode(child), this.printHideElementSelector);

        } else {
          return
        }
      });

    if (this.DOM.isDocumentBody(parentNode)) {
      return;
    } else {
      this._ignorePrintingEnvironment(parentNode);
    };
  }
}
