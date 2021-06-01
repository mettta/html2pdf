export default class Layout {

  constructor({
    DOM,
    selector
  }) {

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
    // clean up the Root before append.
    this.DOM.setInnerHTML(this.root, '');

    // createLayout
    this.DOM.insertAtEnd(this.root, this.paperFlow, this.contentFlow)

    // disable printing the root environment
    this._ignorePrintingEnvironment(this.root);
  }

  _initRoot() {
    // return this.DOM.getRoot();

    // Prepare root element
    const root = this.DOM.getElement(this.rootSelector) || this.DOM.body;
    if (!root) {
      // TODO warn
      console.warn(`Add ${this.rootSelector} to the root element of the area you want to print`);
    }

    return root;
  }

  _createPaperFlow() {
    // return this.DOM.createPaperFlow();
    return this.DOM.create(this.paperFlowSelector);
  }

  _createContentFlow() {
    const contentFlow = this.DOM.create(this.contentFlowSelector);

    // Copy the content from Root into contentFlow,
    this.DOM.setInnerHTML(contentFlow, this.DOM.getInnerHTML(this.root));
    // remove all <template>s, if there are any in the Root,
    this.DOM.clearTemplates(contentFlow);
    // add an empty div as a safeguard element to the end of content flow,
    this.DOM.insertAtEnd(contentFlow, this.DOM.create('[data-content-flow-end]'));

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