import Style from './style';

const CONSOLE_CSS_LABEL_LAYOUT = 'border:1px solid #8888CC;'
                               + 'background:#EEEEEE;'
                               + 'color:#8888CC;'

export default class Layout {

  constructor({
    config,
    DOM,
    selector
  }) {

    this.config = config;
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

    // init result flag
    this.success = false;

  }

  // todo
  // сохранять изначальный элемент, на который был добавлен тег root,
  // чтобы его верстка не пострадала.

  create() {
    this.debugMode && console.group('%c Layout ', CONSOLE_CSS_LABEL_LAYOUT);

    const isStylesInserted = this._insertStyles();
    if (!isStylesInserted) {
      console.error('Failed to add print styles.');
      return
    }

    // clean up the Root before append.
    this.DOM.setInnerHTML(this.root, '');

    // createLayout
    this.DOM.insertAtEnd(this.root, this.paperFlow, this.contentFlow)

    // disable printing the root environment
    if (this.root !== this.DOM.body) {
      this._ignorePrintingEnvironment(this.root);
    }

    // * success!
    this.success = true;

    this.debugMode && console.groupEnd('%c Layout ', CONSOLE_CSS_LABEL_LAYOUT);
  }

  _insertStyles() {
    const head = this.DOM.getElement('head');
    const body = this.DOM.body;

    if (!head && !body) {
      console.error('Check the structure of your document. We didn`t find HEAD and BODY tags. HTML2PDF4DOC expects valid HTML.');
      return
    };

    const styleElement = this.DOM.create('style', new Style(this.config).create());
    if (styleElement) {
      styleElement.setAttribute("HTML2PDF-style", '');
    } else {
      console.error('Failed to create print styles');
      return
    }

    if (head) {
      this.DOM.insertAtEnd(head, styleElement);
      return true
    } else if (body) {
      this.DOM.insertBefore(body, styleElement);
      return true
    } else {
      console.assert(false, 'We expected to find the HEAD and BODY tags.');
      return false
    }
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

    this.DOM.setAttribute(parentNode, this.printIgnoreElementSelector);

    this.DOM.getChildNodes(parentNode)
      .forEach((child) => {

        if (child !== root && this.DOM.isElementNode(child)) {
          this.DOM.setAttribute(child, this.printHideElementSelector);

        } else if (this.DOM.isSignificantTextNode(child)) {
          // process text nodes
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
