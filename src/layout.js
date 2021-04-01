export default class Layout {

  constructor(DOM) {

    this.DOM = DOM;

    this.root = this._initRoot();
    this.paperFlow = this._createPaperFlow();
    this.contentFlow = this._createContentFlow();

  }

  // todo
  // сохранять изначальный элемент, на который был добавлен тег root,
  // чтобы его верстка не пострадала.

  create() {
    // clean up the Root before append.
    this.DOM.clearInnerHTML(this.root);
    this.DOM.createLayout(this.root, this.paperFlow, this.contentFlow);
    this._ignorePrintingEnvironment(this.root);
  }

  _initRoot() {
    return this.DOM.getRoot();
  }

  _createPaperFlow() {
    return this.DOM.createPaperFlow();
  }

  _createContentFlow() {
    const contentFlow = this.DOM.createContentFlow();

    // Copy the content from Root into contentFlow,
    this.DOM.setInnerHTML(contentFlow, this.DOM.getInnerHTML(this.root));
    // remove all <template>s, if there are any in the Root,
    this.DOM.clearTemplates(contentFlow);
    // add an empty div as a safeguard element to the end of content flow,
    this.DOM.markPrintEnd(contentFlow);

    return contentFlow;
  }

  _ignorePrintingEnvironment(root) {
    let parentNode = this.DOM.getParentNode(root);

    this.DOM.setPrintIgnore(parentNode);

    this.DOM.getChildNodes(parentNode)
      .forEach((child) => {

        if (child !== root && this.DOM.isElementNode(child)) {
          this.DOM.setPrintHide(child);

        } else if (this.DOM.isSignificantTextNode(child)) {
          // process text nodes
          this.DOM.setPrintHide(this.DOM.wrapTextNode(child));

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