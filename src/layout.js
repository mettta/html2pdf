export default class Layout {

  constructor(DOM) {

    this.DOM = DOM;

    this.root = this._initRoot();
    this.paperFlow = this._createPaperFlow();
    this.contentFlow = this._createContentFlow();

  }

  create() {
    this._ignorePrintingEnvironment(this.root);
    // clean up the Root before append.
    this.DOM.clearInnerHTML(this.root);
    this.DOM.createLayout(this.root, this.paperFlow, this.contentFlow);
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

    this._makeArrayOfNotTextChildNodes(parentNode)
      .forEach((child) => {
        if (child === root) {
          return
        } else {
          this.DOM.setPrintHide(child);
        }
      })

    if (this.DOM.isDocumentBody(parentNode)) {
      return;
    } else {
      this._ignorePrintingEnvironment(parentNode);
    }
  }

  _makeArrayOfNotTextChildNodes(element) {
    // Check that the element is a tag and not '#text'.
    // https://developer.mozilla.org/ru/docs/Web/API/Node/nodeName
    let children = this.DOM.getChildNodes(element);
    return [...children].filter(item => this.DOM.isNotTextNode(item));
  }

}