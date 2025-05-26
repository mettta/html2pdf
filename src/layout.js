import Style from './style.js';

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
    this._contentRoot;

    this._config = config;
    this._debug = config.debugMode ? { ...config.debugConfig.layout } : {};
    this._assert = config.consoleAssert ? true : false;
    this._DOM = DOM;
    this._selector = selector;
    this._node = node;

    // * root selector
    this._customInitialRootSelector = config.initialRoot;
    this._defaultInitialRootSelector = selector.init;
  }

  create() {

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
      this._assert && console.assert(this._DOM.getParentNode(this.root) === this._initialRoot, 'Failed to insert the layout root into the DOM.')
      this._assert && console.assert(this._DOM.getElementOffsetParent(this.paperFlow) === this.root, 'Failed to insert the paperFlow element into the DOM.')
      this._assert && console.assert(this._DOM.getElementOffsetParent(this.contentFlow) === this.root, 'Failed to insert the contentFlow element into the DOM.')
      return
    }

  }

  _getTemplates() {
    this._assert && console.assert(this._selector.frontpageTemplate, 'frontpageTemplate selector is missing');
    this._assert && console.assert(this._selector.headerTemplate, 'headerTemplate selector is missing');
    this._assert && console.assert(this._selector.footerTemplate, 'footerTemplate selector is missing');
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
      this._assert && console.assert(false, 'We expected to find the HEAD and BODY tags.');
    }
  }

  _createLayout() {

    // * Get initial root element.
    this._getInitialRoot();
    if (!this._initialRoot) {
      console.error('Failed to initialize the root element.');
      return
    }
    this._debug._ && console.log('initial root:',this._initialRoot);

    // * Create new layout elements.
    this._createRoot();
    this._createPaperFlow();
    this._createContentFlow();

    // console.time("moveContent");
    this._DOM.moveContent(this._initialRoot, this.contentFlow);
    // console.timeEnd("moveContent");

    // * Put new layout elements into DOM.
    this._DOM.insertAtEnd(this._initialRoot, this.root);
    this._DOM.insertAtEnd(this.root, this.paperFlow, this.contentFlow);

    this._insertContentFlowStartAndEnd(this.contentFlow);

    // * Disable printing the root environment.
    this._ignoreUnprintableEnvironment(this.root);
  }

  _insertContentFlowStartAndEnd(contentFlow) {
    // * add a safeguard elements to the start and end of content flow
    const contentFlowStart = this._node.create(this._selector.contentFlowStart);
    const contentFlowEnd = this._node.create(this._selector.contentFlowEnd);
    this._DOM.insertAtStart(contentFlow, contentFlowStart);
    this._DOM.insertAtEnd(contentFlow, contentFlowEnd);
    return {contentFlowStart, contentFlowEnd}
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
      this._assert && console.assert(false, "misshapen root")
      return
    }

    let parentNode = this._DOM.getParentNode(root);

    this._DOM.setAttribute(parentNode, this._selector.printIgnore);

    this._DOM.getChildNodes(parentNode)
      .forEach((child) => {

        if (child !== root && this._DOM.isElementNode(child)) {
          this._DOM.setAttribute(child, this._selector.printHide);

        } else if (this._node.isSignificantTextNode(child)) {
          // process text nodes
          const textNodeWrapper = this._node.createTextNodeWrapper();
          this._DOM.wrap(child, textNodeWrapper);
          this._DOM.setAttribute(textNodeWrapper, this._selector.printHide);

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
