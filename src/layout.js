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
    // init result flag
    this.success = false;

    // public
    this.root;
    this.paperFlow;
    this.contentFlow;

    // private
    this._initialRoot;

    this._config = config;
    this._debugMode = config.debugMode;
    this._DOM = DOM;

    this._styleSelector = selector.style;
    this._initSelector = selector.init;
    this._rootSelector = selector.root;
    this._paperFlowSelector = selector.paperFlow;
    this._contentFlowSelector = selector.contentFlow;
    this._printIgnoreElementSelector = selector.printIgnore;
    this._printHideElementSelector = selector.printHide;
  }

  create() {
    this._debugMode && console.group('%c Layout ', CONSOLE_CSS_LABEL_LAYOUT);

    this._insertStyle();
    if (!this._DOM.getElement(`style${this._styleSelector}`)) {
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

  _insertStyle() {
    const head = this._DOM.getElement('head');
    const body = this._DOM.body;

    if (!head && !body) {
      console.error('Check the structure of your document. We didn`t find HEAD and BODY tags. HTML2PDF4DOC expects valid HTML.');
      return
    };

    const styleElement = this._DOM.create('style', new Style(this._config).create());
    if (styleElement) {
      this._DOM.setAttribute(styleElement, this._styleSelector, '');
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
      // Copy the content from initialRoot into contentFlow,
      this._DOM.setInnerHTML(contentFlow, printedContent);
      // remove all <template>s, if there are any in the initialRoot,
      this._DOM.clearTemplates(contentFlow);
      // add an empty div as a safeguard element to the end of content flow,
      this._DOM.insertAtEnd(contentFlow, this._DOM.create('[data-content-flow-end]'));
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
    // todo: set initial_root via config

    let initialRoot = this._DOM.getElement(this._initSelector);

    if (!initialRoot) {
      if (!this._DOM.body) {
        console.error('We expected to find the BODY tag.');
        return
      }
      initialRoot = this._DOM.body;
      console.warn(`Add ${this._rootSelector} to the root element of the area you want to print. ${this._rootSelector} is now automatically added to the BODY tag.`);
    }

    this._initialRoot = initialRoot;
    return initialRoot;
  }

  _createRoot() {
    const root = this._DOM.create(this._rootSelector);

    this.root = root;
    return root;
  }

  _createPaperFlow() {
    const paperFlow = this._DOM.create(this._paperFlowSelector);

    this.paperFlow = paperFlow;
    return paperFlow;
  }

  _createContentFlow() {
    const contentFlow = this._DOM.create(this._contentFlowSelector);

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

    this._DOM.setAttribute(parentNode, this._printIgnoreElementSelector);

    this._DOM.getChildNodes(parentNode)
      .forEach((child) => {

        if (child !== root && this._DOM.isElementNode(child)) {
          this._DOM.setAttribute(child, this._printHideElementSelector);

        } else if (this._DOM.isSignificantTextNode(child)) {
          // process text nodes
          this._DOM.setAttribute(this._DOM.wrapTextNode(child), this._printHideElementSelector);

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
