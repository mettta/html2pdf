import SELECTOR from './selector';

export default class DocumentObjectModel {

  constructor(DOM) {
    this.DOM = DOM;
  }

  // STYLES

  insertStyle(printStyles) {
    const head = this.DOM.querySelector('head');
    const style = this.DOM.createElement('style');
    style.append(this.DOM.createTextNode(printStyles));
    style.setAttribute("data-printthis-inserted", '');
    head.append(style);
  }

  // ATTRIBUTES / dataset

  _setAttribute(element, selector) {
    element.setAttribute(selector.substring(1, selector.length - 1), '');
  }

  setPrintIgnore(element) {
    // element.dataset.printIgnore = '';
    this._setAttribute(element, SELECTOR.printIgnore)
  }

  setPrintHide(element) {
    // element.dataset.printHide = '';
    this._setAttribute(element, SELECTOR.printHide)
  }

  wrapWithNeutral(element) {
    if (this.isTextNode(element) && element.isElementContentWhitespace) {
      console.log('%c only whitespace', 'color:red');
      return
    }
    const wrapper = this.DOM.createElement('span');
    this._setAttribute(wrapper, SELECTOR.neutral);
    element.before(wrapper);
    wrapper.append(element);
    return wrapper;
  }

  // todo {class, id, dataset, value} ?
  isPrintEnd(element) {
    // SELECTOR.printEnd
    return element.dataset?.hasOwnProperty('printEnd')
  }

  isForcedPageBreak(element) {
    // SELECTOR.printForcedPageBreak
    return element.dataset?.hasOwnProperty('printForcedPageBreak')
  }

  isNoBreak(element) {
    // SELECTOR.printNoBreak
    return element.dataset?.hasOwnProperty('printNoBreak')
  }

  // CHECK

  getElementTagName(element) {
    return element.tagName;
  }

  isDocumentBody(element) {
    return element.tagName === 'BODY';
  }

  isNotTextNode(element) {
    return !!element.tagName;
  }
  isTextNode(element) {
    return element.nodeType === Node.TEXT_NODE;
  }

  // GET TEMPLATES

  getFooterTemplate() {
    return this.getInnerHTML(SELECTOR.footerTemplate);
  }

  getHeaderTemplate() {
    return this.getInnerHTML(SELECTOR.headerTemplate);
  }

  getFrontpageTemplate() {
    return this.getInnerHTML(SELECTOR.frontpageTemplate);
  }

  clearTemplates(root) {
    // Remove all <template>s, if there are any in the Root.
    const templates = root.querySelectorAll('template');
    templates.forEach((el) => el.remove());
  }

  // helpers

  getParentNode(element) {
    return element.parentNode;
  }

  getChildNodes(element) {
    return element.childNodes;
  }

  getInnerHTML(selector) {

    if (typeof selector === 'string') {
      const source = this.DOM.querySelector(selector);
      if (source) {
        return source.innerHTML;
      }
      return;
    }
    return selector.innerHTML;
  }

  setInnerHTML(selector, html) {

    if (typeof selector === 'string') {
      const source = this.DOM.querySelector(selector);
      if (source) {
        source.innerHTML = html;
      }
      // return;
    }
    selector.innerHTML = html;
  }

  clearInnerHTML(element) {
    element.innerHTML = '';
  }

  // CREATE ELEMENTS

  create(element) {
    if (!element) {
      const el = this.DOM.createElement('div');
      return el;
    }

    const first = element.charAt(0);

    if (first === '.') {
      const cl = element.substring(1);
      const el = this.DOM.createElement('div');
      el.classList.add(cl);
      return el;
    }
    if (first === '#') {
      const id = element.substring(1);
      const el = this.DOM.createElement('div');
      el.id = id;
      return el;
    }
    if (first === '[') {
      const attr = element.substring(1, element.length - 1);
      const el = this.DOM.createElement('div');
      el.setAttribute(attr, '');
      return el;
    }

    const el = this.DOM.createElement(element);
    return el;
  }

  createPrintEnd() {
    return this.create(SELECTOR.printEnd);
  }

  createPrintPageBreak() {
    return this.create(SELECTOR.printPageBreak);
  }

  createPrintNoBreak() {
    return this.create(SELECTOR.printNoBreak);
  }

  createRunningSafety() {
    return this.create(SELECTOR.runningSafety);
  }

  // PAPER

  createVirtualPaperGap() {
    return this.create(SELECTOR.virtualPaperGap);
  }

  createPaper({
    header,
    body,
    footer,
    current,
    total,
  }) {
    const paper = this._createVirtualPaper();

    paper.append(
      this._createVirtualPaperTopMargin(),
      header,
      body,
      footer,
      this._createVirtualPaperBottomMargin(),
    );

    if (current && total) {
      this._setPageNumber(header, current, total);
      this._setPageNumber(footer, current, total);
    }

    return paper;
  }

  _setPageNumber(target, current, total) {
    const container = target.querySelector(SELECTOR.pageNumberRoot);
    if (container) {
      container.querySelector(SELECTOR.pageNumberCurrent).innerHTML = current;
      container.querySelector(SELECTOR.pageNumberTotal).innerHTML = total;
    }
  }

  createFrontpageContent(template, factor) {
    const _node = this.create(SELECTOR.frontpageContent);
    template && (_node.innerHTML = template);
    if (factor) {
      _node.style.transform = `scale(${factor})`;
    }
    return _node;
  }

  // TODO calculate Paper body content  on insertion,
  // allow to insert any content, not only pre-prepared content

  createPaperBody(height, content) {
    const _node = this.create(SELECTOR.paperBody);
    // Lock the height of the paperBody for the content area.
    // This affects the correct printing of the paper layer.
    height && (_node.style.height = height + 'px');
    // To create a frontpage, we can pass content here.
    content && (_node.append(content));
    return _node;
  }

  createPaperHeader(template) {
    const _node = this.create(SELECTOR.paperHeader);

    if (template) {
      const content = this.create(SELECTOR.headerContent);
      content.innerHTML = template;
      _node.append(content)
    }
    return _node;
  }

  createPaperFooter(template) {
    const _node = this.create(SELECTOR.paperFooter);

    if (template) {
      const content = this.create(SELECTOR.footerContent);
      content.innerHTML = template;
      _node.append(content)
    }
    return _node;
  }

  calculatePaperParams({
    frontpageTemplate,
    headerTemplate,
    footerTemplate,
  }) {

    // CREATE TEST PAPER ELEMENTS
    const body = this.createPaperBody();
    const frontpage = this.createFrontpageContent(frontpageTemplate);
    const header = this.createPaperHeader(headerTemplate);
    const footer = this.createPaperFooter(footerTemplate);

    // CREATE TEST PAPER
    const paper = this.createPaper({
      header,
      body,
      footer,
    });
    // TODO?
    // const paper = this._createVirtualPaper();
    // paper.append(
    //   this._createVirtualPaperTopMargin(),
    //   header,
    //   body,
    //   footer,
    //   this._createVirtualPaperBottomMargin(),
    // );


    // CREATE TEMP CONTAINER
    const workbench = this.create('#workbench');
    workbench.style = `
      position:absolute;
      left: -3000px;
      `;
    workbench.append(paper);
    this.DOM.body.prepend(workbench);

    // get heights for an blank page
    const paperHeight = paper.getBoundingClientRect().height;
    const headerHeight = header?.offsetHeight || 0;
    const footerHeight = footer?.offsetHeight || 0;
    const bodyHeight = body.offsetHeight;

    // add frontpage text
    body.append(frontpage);
    // get height for the frontpage content
    const filledBodyHeight = body.offsetHeight;

    const frontpageFactor = (filledBodyHeight > bodyHeight)
      ? bodyHeight / filledBodyHeight
      : 1;

    // REMOVE TEMP CONTAINER
    workbench.remove();

    return {
      paperHeight,
      headerHeight,
      footerHeight,
      bodyHeight,
      frontpageFactor
    }
  }

  _createVirtualPaper() {
    return this.create(SELECTOR.virtualPaper);
  }

  _createVirtualPaperTopMargin() {
    return this.create(SELECTOR.virtualPaperTopMargin);
  }

  _createVirtualPaperBottomMargin() {
    return this.create(SELECTOR.virtualPaperBottomMargin);
  }

  // LAYOUT

  getRoot() {
    // Prepare root element
    const root = this.DOM.querySelector(SELECTOR.root) || this.DOM.body;
    if (!root) {
      // TODO warn
      console.warn(`Add ${SELECTOR.root} to the root element of the area you want to print`);
    }

    return root;
  }

  createPaperFlow() {
    return this.create(SELECTOR.paperFlow);
  }

  createContentFlow() {
    return this.create(SELECTOR.contentFlow);
  }

  markPrintEnd(contentFlow) {
    contentFlow.append(this.createPrintEnd());
  }

  createLayout(root, paperFlow, contentFlow) {
    root.append(paperFlow, contentFlow);
  }

  // PAGES


  getElementHeight(element) {
    return element.offsetHeight;
  }

  getElementTop(element) {
    return element.offsetTop;
  }

  getElementBottom(element) {
    return element.offsetTop + element.offsetHeight;
  }

  // PREVIEW

  insertFooterSpacer(target, footerHeight, paperSeparator) {

    // In the virtual footer/header we add an empty element
    // with a calculated height instead of the content.
    // We use margins to compensate for possible opposite margins in the content.

    // In this element we will add a compensator.
    // We create it with a basic compensator,
    // which takes into account now only the footerHeight.
    const balancingFooter = this.createRunningSafety();
    footerHeight && (balancingFooter.style.marginTop = footerHeight + 'px');

    // Based on contentSeparator (virtual, not printed element, inserted into contentFlow)
    // and paperSeparator (virtual, not printed element, inserted into paperFlow),
    // calculate the height of the necessary compensator to visually fit page breaks
    // in the content in contentFlow and virtual page images on the screen in paperFlow.
    const contentSeparator = this.createVirtualPaperGap();

    const footerSpacer = document.createDocumentFragment();
    footerSpacer.append(
      balancingFooter,
      this._createVirtualPaperBottomMargin(),
      this.createPrintPageBreak(),
      contentSeparator,
    );

    // Put into DOM
    target.before(
      footerSpacer,
    );

    // Determine what inaccuracy there is visually in the break simulation position,
    // and compensate for it.
    const balancer = paperSeparator.offsetTop - contentSeparator.offsetTop;
    balancingFooter.style.marginBottom = balancer + 'px';

    // TODO check if negative on large documents
    // console.log(balancer);
  }

  insertHeaderSpacer(target, headerHeight) {

    // In the virtual footer/header we add an empty element
    // with a calculated height instead of the content.
    // We use margins to compensate for possible opposite margins in the content.
    const balancingHeader = this.createRunningSafety();
    headerHeight && (balancingHeader.style.marginBottom = headerHeight + 'px');

    const headerSpacer = document.createDocumentFragment();
    headerSpacer.append(
      this._createVirtualPaperTopMargin(),
      balancingHeader,
    );

    // Put into DOM
    target.before(
      headerSpacer,
    );
  }

  insertFrontpageSpacer(target, bodyHeight) {
    // create spacer element
    const spacer = this.create();
    spacer.style.paddingBottom = bodyHeight + 'px';

    // insert filler element into content
    target.prepend(spacer);

    // return ref
    return spacer;
  }

  insertPaper(paperFlow, paper, separator) {
    if (separator) {
      // pages that come after the page break
      paperFlow.append(
        // this.createPrintPageBreak(), // has no effect
        separator,
        paper,
      );
    } else {
      // first page
      paperFlow.append(
        paper,
      );
    }
  }

}
