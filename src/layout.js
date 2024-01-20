import Style from './style';

const CONSOLE_CSS_LABEL_LAYOUT = 'border:1px solid #8888CC;'
                               + 'background:#EEEEEE;'
                               + 'color:#8888CC;'

export default class Layout {

  constructor({
    config,
    DOM,
    node,
    selector
  }) {
    // init result flag
    this.success = false;

    // * public
    this.root;
    this.paperFlow;
    this.contentFlow;
    this.frontpageTemplate;
    this.headerTemplate;
    this.footerTemplate;

    // * private
    this._initialRoot;

    this._config = config;
    this._debugMode = config.debugMode;
    this._DOM = DOM;
    this._selector = selector;
    this._node = node;

    // * root selector
    this._customInitialRootSelector = config.initialRoot;
    this._defaultInitialRootSelector = selector.init;
  }

  create() {
    this._debugMode && console.group('%c Layout ', CONSOLE_CSS_LABEL_LAYOUT);

    this._getTemplates();

    this._insertStyle();
    if (!this._DOM.getElement(`style${this._selector.style}`)) {
      console.error('Failed to add print styles into the DOM.');
      return
    }

    this._createLayout();

    if (
      true
      // ? Are all the elements of the layout created and in the DOM?
      && this._DOM.getParentNode(this.root) === this._initialRoot
      && this._DOM.getElementOffsetParent(this.paperFlow) === this.root
      && this._DOM.getElementOffsetParent(this.contentFlow) === this.root
    ) {
      // * success!
      this.success = true;
    } else {
      console.assert(this._DOM.getParentNode(this.root) === this._initialRoot, 'Failed to insert the layout root into the DOM.')
      console.assert(this._DOM.getElementOffsetParent(this.paperFlow) === this.root, 'Failed to insert the paperFlow element into the DOM.')
      console.assert(this._DOM.getElementOffsetParent(this.contentFlow) === this.root, 'Failed to insert the contentFlow element into the DOM.')
      return
    }

    this._debugMode && console.groupEnd();
  }

  _getTemplates() {
    console.assert(this._selector.frontpageTemplate, 'frontpageTemplate selector is missing');
    console.assert(this._selector.headerTemplate, 'headerTemplate selector is missing');
    console.assert(this._selector.footerTemplate, 'footerTemplate selector is missing');
    this.frontpageTemplate = this._DOM.getInnerHTML(this._selector.frontpageTemplate);
    this.headerTemplate = this._DOM.getInnerHTML(this._selector.headerTemplate);
    this.footerTemplate = this._DOM.getInnerHTML(this._selector.footerTemplate);
  }

  _insertStyle() {
    const head = this._DOM.getElement('head');
    const body = this._DOM.body;

    if (!head && !body) {
      console.error('Check the structure of your document. We didn`t find HEAD and BODY tags. HTML2PDF4DOC expects valid HTML.');
      return
    };

    const styleElement = this._node.create('style', new Style(this._config).create());
    if (styleElement) {
      this._DOM.setAttribute(styleElement, this._selector.style, '');
    } else {
      console.error('Failed to create print styles');
      return
    }

    if (head) {
      this._DOM.insertAtEnd(head, styleElement);
    } else if (body) {
      this._DOM.insertBefore(body, styleElement);
    } else {
      console.assert(false, 'We expected to find the HEAD and BODY tags.');
    }
  }

  _createLayout() {

    // * Get initial root element.
    const initialRoot = this._getInitialRoot();
    if (!this._initialRoot) {
      console.error('Failed to initialize the root element.');
      return
    }
    this._debugMode && console.log(
      '%c initial root ',
      CONSOLE_CSS_LABEL_LAYOUT,
      this._initialRoot
    );

    // * Create new layout elements.
    const root = this._createRoot();
    const paperFlow = this._createPaperFlow();
    const contentFlow = this._createContentFlow();

    // * Move content to be printed in the contentFlow.
    const printedContent = this._DOM.getInnerHTML(initialRoot);
    const significantPrintedContent = (printedContent.trim().length > 0) ? true : false;
    if (significantPrintedContent) {
      // * Copy the content from initialRoot into contentFlow,
      this._DOM.setInnerHTML(contentFlow, printedContent);
      // * remove all <template>s, if there are any in the initialRoot,
      // this._DOM.clearTemplates(contentFlow);
      // * add an empty div as a safeguard element to the end of content flow,
      this._DOM.insertAtEnd(contentFlow, this._node.create('[data-content-flow-end]'));
    } else {
      console.warn(`It looks like you don't have any printable content.`);
    }
    // clean up the initial Root before append new layout elements.
    this._DOM.setInnerHTML(initialRoot, '');
    // put new layout elements into DOM
    this._DOM.insertAtEnd(initialRoot, root);
    this._DOM.insertAtEnd(root, paperFlow, contentFlow);

    // disable printing the root environment
    this._ignoreUnprintableEnvironment(root);
  }

  _getInitialRoot() {
    let initialRoot = this._customInitialRootSelector
    ? this._DOM.getElement(this._customInitialRootSelector)
    : this._DOM.getElement(this._defaultInitialRootSelector);

    if (!initialRoot) {
      if (!this._DOM.body) {
        console.error('We expected to find the BODY tag.');
        return
      }
      initialRoot = this._DOM.body;
      console.warn(`The printable area is currently unspecified and encompasses the entire contents of the BODY tag. To restrict the printed content to a specific area, include ${this._defaultInitialRootSelector} in the root element of the desired printing area.`);
    }

    this._initialRoot = initialRoot;
    return initialRoot;
  }

  _createRoot() {
    const root = this._node.create(this._selector.root);

    this.root = root;
    return root;
  }

  _createPaperFlow() {
    const paperFlow = this._node.create(this._selector.paperFlow);

    this.paperFlow = paperFlow;
    return paperFlow;
  }

  _createContentFlow() {
    const contentFlow = this._node.create(this._selector.contentFlow);

    this.contentFlow = contentFlow;
    return contentFlow;
  }

  _ignoreUnprintableEnvironment(root) {
    if (root === this._DOM.body) {
      // ! now this is impossible, because a new root is created, and always has a parent
      console.assert(false, "misshapen root")
      return
    }

    let parentNode = this._DOM.getParentNode(root);

    this._DOM.setAttribute(parentNode, this._selector.printIgnore);

    this._DOM.getChildNodes(parentNode)
      .forEach((child) => {

        if (child !== root && this._DOM.isElementNode(child)) {
          this._DOM.setAttribute(child, this._selector.printHide);

        } else if (this._DOM.isSignificantTextNode(child)) {
          // process text nodes
          this._DOM.setAttribute(this._node.wrapTextNode(child), this._selector.printHide);

        } else {
          return
        }
      });

    if (this._DOM.isDocumentBody(parentNode)) {
      return;
    } else {
      this._ignoreUnprintableEnvironment(parentNode);
    };
  }
}
