// * v.0.1

import _emulateContent from '../_emulateContent.js';

// TODO problem with <OBJECT>:
// Either exclude the object at the generator level,
// or learn how to handle its height after loading the content
// (different behavior in different browsers).
// https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver/observe
const resizeObserver = new ResizeObserver(entries => {
  console.warn(entries);
  for (let entry of entries) {
    console.warn('resizeObserver: ', entry.contentRect.height);
  }
});

// * CONSTANTS

const SELECTORS = {
  // root, is taken from DOM
  root: '#printTHIS',

  // templates, are taken from DOM
  footerTemplate: '#printTHISfooter',
  headerTemplate: '#printTHISheader',
  frontpageTemplate: '#printTHISfrontpage',

  // are created:

  // content from templates
  customHeader: '.customHeader',
  customFooter: '.customFooter',
  customBody: '.customBody',

  // containers for custom content
  frontpage: '#frontpage',
  runningHeader: '.runningHeader',
  runningFooter: '.runningFooter',

  // safety
  runningSafety: '.runningSafety',

  // layout
  paperFlow: '#paperFlow',
  contentFlow: '#contentFlow',

  // virtual, only for preview
  virtualPage: '.virtualPage',
  virtualTopMargin: '.virtualTopMargin',
  virtualBottomMargin: '.virtualBottomMargin',
  virtualPagesGap: '.virtualPagesGap',

  // page number
  pageNumberRoot: '[data-page-number-root]',
  pageNumberCurrent: '[data-page-number-current]',
  pageNumberTotal: '[data-page-number-total]',

  // print attributes
  printIgnore: '[data-print-ignore]',
  printHide: '[data-print-hide]',
  printForcedPageBreak: '[data-print-forced-page-break]',
  printNoBreak: '[data-print-no-break]',

  // service attributes
  printEnd: '[data-print-end]',

};

// * STYLES CONFIG

function createConfig(params) {

  // ! A4
  const DEFAULT_CONFIG = {
    // print
    printUnits: 'mm',
    width: '210',
    height: '297',
    left: '21',
    right: '21',
    top: '10',
    bottom: '12',
    fontSize: '11pt',
    // html template
    screenUnits: 'px',
    headerMargin: '16',
    footerMargin: '16',
    // virtual
    virtualPagesGap: '16',
  }

  let config = DEFAULT_CONFIG;
  // TODO config
  // if (customPrintTHISConfig) {
  //   conf = {
  //     ...conf,
  //     ...customPrintTHISConfig
  //   }
  // }

  return config;
}

function generatePrintStyles(config) {
  // Make sure that the print margins (set for @page)
  // are NO LARGER than the corresponding indents
  // used for the the printable area,
  // to avoid overfilling the printable area and the mismatch
  // between preview and the flow processed by paged media.
  // Here it is reduced by 1 pixel for safety:
  return `

  @page {
    size: A4;
    /* 2 values: width then height */
    size: ${config.width + config.printUnits} ${config.height + config.printUnits};

    margin-left: ${config.left - 1 + config.printUnits};
    margin-right: ${config.right - 1 + config.printUnits};
    margin-top: ${config.top - 0 + config.printUnits};
    margin-bottom: ${config.bottom - 2 + config.printUnits};
  }

  ${SELECTORS.root} {
    /* reset user styles */
    display: block;

    /* for proper printable flow positioning */
    position: relative;

    /* to compensate for possible BG in the parent node */
    background: transparent;
    z-index: 1;

    /* set print styles: affects previews */
    margin: 0 auto;
    width: ${config.width - config.left - config.right}${config.printUnits};
    font-size: ${config.fontSize};

    /* protection against unpredictability of margins */
    padding-top: .1px;
  }

  ${SELECTORS.virtualPage} {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: minmax(min-content, max-content) 1fr minmax(min-content, max-content);
    place-items: stretch stretch;
    place-content: stretch stretch;
    width: ${config.width - config.left - config.right}${config.printUnits};
    height: ${config.height}${config.printUnits};
    font-size: ${config.fontSize};
  }

  ${SELECTORS.virtualPage}::before {
    position: absolute;
    content: '';
    width: ${config.width}${config.printUnits};
    height: ${config.height}${config.printUnits};
    left: -${config.left}${config.printUnits};
    background-color: #fff;
    box-shadow: rgba(0, 0, 0, 0.1) 2px 2px 12px 0px;
    z-index: -1;
  }

  ${SELECTORS.customHeader}:not(:empty) {
    padding-bottom: ${config.headerMargin}${config.screenUnits};
  }

  ${SELECTORS.customFooter}:not(:empty) {
    padding-top: ${config.footerMargin}${config.screenUnits};
  }

  ${SELECTORS.paperFlow} {
    position: absolute;
    width: 100%;
    z-index: -1;
    padding-bottom: ${config.virtualPagesGap * 2 + config.screenUnits};
  }

  ${SELECTORS.runningSafety} {
    padding: .1px;
  }

  ${SELECTORS.virtualTopMargin} {
    height: ${config.top}${config.printUnits};
  }

  ${SELECTORS.virtualBottomMargin} {
    height: ${config.bottom}${config.printUnits};
  }

  ${SELECTORS.virtualPagesGap} {
    padding-top: ${config.virtualPagesGap}${config.screenUnits};
    background: #ff000020;
  }

  ${SELECTORS.contentFlow} ${SELECTORS.runningHeader} {
    background: #00ffff20;
  }
  ${SELECTORS.contentFlow} ${SELECTORS.runningFooter} {
    background: #00ffff20;
  }
  ${SELECTORS.runningHeader} {
    background: #ffee0020;
  }
  ${SELECTORS.runningFooter} {
    background: #ffee0020;
  }

  @media print {
    ${SELECTORS.printIgnore},
    ${SELECTORS.virtualPage} {
      display: contents;
    }

    ${SELECTORS.virtualPage}::before,
    ${SELECTORS.printHide},
    ${SELECTORS.virtualTopMargin},
    ${SELECTORS.virtualBottomMargin},
    ${SELECTORS.virtualPagesGap} {
      display: none;
    }

    ${SELECTORS.runningFooter} {
      break-after: page;
    }

    ${SELECTORS.printForcedPageBreak} {
      /* JUST MANUAL! */
      /* break-after: page; */
    }

    ${SELECTORS.printNoBreak} {
      break-inside: avoid-page;
    }
  }
`
};

function insertPrintStyles(printStyles) {
  const head = document.querySelector('head');
  const style = document.createElement('style');
  style.append(document.createTextNode(printStyles));
  style.setAttribute("data-printthis-inserted", '');
  head.append(style);
}

function ignorePrintingEnvironment(element) {
  let parentNode = element.parentNode;
  parentNode.dataset.printIgnore = '';

  makeArrayOfNotTextChildNodes(parentNode)
    .forEach((child) => {
      if (child === element) {
        return
      } else {
        // TODO SELECTORS
        child.dataset.printHide = '';
      }
    })

  if (parentNode.tagName === 'BODY') {
    return;
  } else {
    ignorePrintingEnvironment(parentNode);
  }
}

// * HELPERS

function makeArrayOfNotTextChildNodes(element) {
  // Check that the element is a tag and not '#text'.
  // https://developer.mozilla.org/ru/docs/Web/API/Node/nodeName
  let children = element.childNodes;
  return [...children].filter(item => item.tagName);
}

function isPrintEnd(element) {
  return element.dataset?.hasOwnProperty('printEnd')
}

function isForcedPageBreak(element) {
  return element.dataset?.hasOwnProperty('printForcedPageBreak')
}

function isNoBreak(element) {
  return element.dataset?.hasOwnProperty('printNoBreak')
}

function isSignificantChild(child) {
  const tag = child.tagName;

  // TODO isSignificantChild
  return (tag !== 'A' && tag !== 'TT' && child.offsetHeight > 0);
}

function isUnbreakable(element) {
  // ? IF currentElement is specific,
  // process as a whole:
  const tag = element.tagName;

  // BUG WITH OBJECT: in FF is ignored, in Chrome get wrong height
  // if (tag === 'OBJECT') {
  //   console.log('i am object');
  //   resizeObserver.observe(currentElement)
  // }

  const takeAsWhole = (tag === 'IMG' || tag === 'TABLE' || isNoBreak(element) || tag === 'OBJECT');

  return takeAsWhole;
}

function getChildren(element) {
  // Check childern:
  // TODO variants
  // TODO last child
  // TODO first Li
  let childrenArr = [];
  const tag = element.tagName;
  if (tag === 'LI') {
    childrenArr = [...element.childNodes]
      .filter(child => child.tagName === 'UL' || child.tagName === 'OL');
  } else if (tag === 'DL') {
    childrenArr = [...element.childNodes]
      .filter(child => child.tagName === 'DD');
  } else {
    // If my nodeName is #text, my height is always undefined
    childrenArr = [...element.childNodes]
      .filter(child => isForcedPageBreak(child) || isPrintEnd(child) || isSignificantChild(child));
  }

  return childrenArr;
}

function create(element) {
  if (!element) {
    const el = document.createElement('div');
    return el;
  }

  const first = element.charAt(0);

  if (first === '.') {
    const cl = element.substring(1);
    const el = document.createElement('div');
    el.classList.add(cl);
    return el;
  }
  if (first === '#') {
    const id = element.substring(1);
    const el = document.createElement('div');
    el.id = id;
    return el;
  }
  if (first === '[') {
    const attr = element.substring(1, element.length - 1);
    const el = document.createElement('div');
    el.setAttribute(attr, '');
    return el;
  }

  const el = document.createElement(element);
  return el;
}

function insertForcedPageBreak() {
  const pageBreakElement = create(SELECTORS.printForcedPageBreak);
  return pageBreakElement;
}

function setPageNumber(target, current, total) {
  const contaiter = target.querySelector(SELECTORS.pageNumberRoot);
  if (contaiter) {
    contaiter.querySelector(SELECTORS.pageNumberCurrent).innerHTML = current;
    contaiter.querySelector(SELECTORS.pageNumberTotal).innerHTML = total;
  }
}

// * PREPARE TEMPLATES

function prepareRootElement(selector) {
  // Prepare root element
  const root = document.querySelector(selector);
  if (!root) {
    console.warn(`Add ${selector} to the root element of the area you want to print`);
    return;
  }
  return root;
}

function prepareFrontpage(pageContentHeight) {
  const source = document.querySelector(SELECTORS.frontpageTemplate);

  if (source) {
    const _frontpageTemplateClone = source.content
      ? source.content.cloneNode(true) : source.cloneNode(true);

    const frontpage = create(SELECTORS.frontpage);
    frontpage.append(_frontpageTemplateClone);
    frontpage.style.height = pageContentHeight + 'px';
    frontpage.dataset.printNoBreak = '';
    return frontpage;
  }
  return;
}

function prepareCustomHeader() {
  const source = document.querySelector(SELECTORS.headerTemplate);

  if (source) {
    const _headerTemplate = source.content
      ? source.content.cloneNode(true) : source.cloneNode(true);

    const customHeader = create(SELECTORS.customHeader);
    customHeader.append(_headerTemplate);

    return customHeader;
  }
  return;
}

function prepareCustomFooter() {
  const source = document.querySelector(SELECTORS.footerTemplate);

  if (source) {
    const _footerTemplate = source.content
      ? source.content.cloneNode(true) : source.cloneNode(true);

    const customFooter = create(SELECTORS.customFooter);
    customFooter.append(_footerTemplate);

    return customFooter;
  }
  return;
}

// * CREATE LAYOUT ELEMENST

function createRunningHeader(customHeader) {
  const runningHeader = create(SELECTORS.runningHeader);
  runningHeader.append(
    create(SELECTORS.virtualTopMargin)
  );
  // if custom header,
  // add content to the header that will be printed.
  customHeader && runningHeader.append(customHeader);
  return runningHeader
}

function createRunningFooter(customFooter) {
  const runningFooter = create(SELECTORS.runningFooter);
  runningFooter.append(
    create(SELECTORS.virtualBottomMargin)
  );
  // if custom footer,
  // add content to the footer that will be printed.
  customFooter && runningFooter.prepend(customFooter);
  return runningFooter
}

function createBalancingHeader(headerContentHeight) {
  // In the virtual footer/header we add an empty element
  // with a calculated height instead of the content.
  // We use margins to compensate for possible opposite margins in the content.
  const balancingHeader = create(SELECTORS.runningSafety);
  balancingHeader.style.marginBottom = headerContentHeight + 'px';
  return balancingHeader;
}

function createBalancingFooter(footerContentHeight) {
  // In the virtual footer/header we add an empty element
  // with a calculated height instead of the content.
  // We use margins to compensate for possible opposite margins in the content.
  const balancingFooter = create(SELECTORS.runningSafety);
  balancingFooter.style.marginTop = footerContentHeight + 'px';
  return balancingFooter;
}

function createVirtualPageGap() {
  const _separator = create(SELECTORS.virtualPagesGap);
  return _separator;
}

function createVirtualPage() {

  // if custom footer and/or header,
  const customHeader = prepareCustomHeader();
  const customFooter = prepareCustomFooter();
  // add content to the footers that will be printed.
  const runningHeader = createRunningHeader(customHeader);
  const runningFooter = createRunningFooter(customFooter);

  const customBody = create(SELECTORS.customBody);

  const virtualPage = create(SELECTORS.virtualPage);
  virtualPage.append(runningHeader, customBody, runningFooter);

  return virtualPage;
}

function createPaper(virtualPage, current, total) {
  const _paper = create('.paper');
  const _separator = createVirtualPageGap();
  _paper.append(
    _separator,
    virtualPage.cloneNode(true),
  );
  setPageNumber(_paper, current, total);
  return {
    paper: _paper,
    separator: _separator
  };
}

function createLayout({
  printTHIS,
  pageContentHeight,
}) {
  // Prepare the content from printTHIS,
  // and if there is a frontpage,
  // and put them back into the printTHIS.

  // First we take away the frontpage template,
  // in case it was placed inside the printTHIS:
  const frontpage = prepareFrontpage(pageContentHeight);

  // Remove all <template>s, if there are any in the printTHIS.
  const templates = printTHIS.querySelectorAll('template');
  templates.forEach((el) => el.remove());

  // Create Content FLOW,
  const contentFlow = create(SELECTORS.contentFlow);
  // copy the content from printTHIS into it,
  contentFlow.innerHTML = printTHIS.innerHTML;
  // add a custom frontpage if needed,
  frontpage && contentFlow.prepend(frontpage, insertForcedPageBreak());
  // ! frontpage && contentFlow.prepend(frontpage);
  // add an empty div as a safeguard element to the end of content flow,
  contentFlow.append(create(SELECTORS.printEnd));
  // clean up the printTHIS.
  printTHIS.innerHTML = '';
  // Create papers FLOW,
  const paperFlow = create(SELECTORS.paperFlow);
  // and insert them both into printTHIS.
  printTHIS.append(paperFlow, contentFlow);

  return {
    contentFlow,
    paperFlow
  }
}

// * CALCULATIONS

function calculateHeights(virtualPage) {

  // CREATE TEMP CONTAINER
  const workbench = create('#workbench');
  workbench.style = `
    position:absolute;
    left: -3000px;
    `;
  workbench.append(virtualPage);
  document.body.prepend(workbench);

  const customHeader = virtualPage.querySelector(SELECTORS.customHeader);
  const customFooter = virtualPage.querySelector(SELECTORS.customFooter);
  const customBody = virtualPage.querySelector(SELECTORS.customBody);

  //calculate
  const headerContentHeight = customHeader?.offsetHeight || 0;
  const footerContentHeight = customFooter?.offsetHeight || 0;
  const pageContentHeight = customBody.offsetHeight;
  const virtualPageHeight = virtualPage.getBoundingClientRect().height;

  // Lock the height of the customBody for the content area.
  // It will take effect further when cloning the virtualPage.
  customBody.style.height = pageContentHeight + 'px';

  // REMOVE TEMP CONTAINER
  workbench.remove();

  return {
    headerContentHeight,
    footerContentHeight,
    pageContentHeight,
    virtualPageHeight,
  }
}

// * PAGES CALCULATION

function calculatePages({
  contentFlow,
  pageContentHeight
}) {

  let pages = [];

  // IF contentFlow is less than one page,

  if (contentFlow.offsetHeight < pageContentHeight) {
    // register a single page
    pages.push({
      nextPageStart: contentFlow,
    });
    return pages;
  }

  // ELSE:

  const content = getChildren(contentFlow);

  console.log(content);

  // TODO put this into main calculations?
  // FIRST ELEMENT: register the beginning of the first page.
  pages.push({
    // previousPageEnd: previousPageEnd,
    nextPageStart: content[0],
    _start: true,
  });

  parseNodes({
    array: content
  });

  function parseNodes({
    array,
    previous,
    next
  }) {

    // console.count('----- > parseNodes');

    for (let i = 0; i < array.length; i++) {

      parseNode({
        previousElement: array[i - 1] || previous,
        currentElement: array[i],
        nextElement: array[i + 1] || next,
      });

    }
  }

  function parseNode({
    previousElement,
    currentElement,
    nextElement,
  }) {


    // THE END:
    if (!nextElement) {
      return
    }

    // console.count('parseNode');

    // TODO EDIT COMMENT
    // We want to see if we need to go through the children of the element,
    // or we can put it in one piece on the page.
    // Both the element and his children(!) can have margins that affect the flow,
    // that we can't control without going over children.
    // So we can't count on the height of the element.
    // This is why we check the available space on the page for the next element
    // by checking the top position of the previous one,
    // that is ALREADY affected by potential margins!

    // TODO check if the margin of the previous one is larger, and vice versa.

    // Now we have a pair: the previous one and the one following it.


    // check if there were forced page breaks, which additionally shift the beginning of the pages.



    // If there is no header, the top margin of the nextPageStart on the page is not compensated,
    // and overfilling of the print sheet may occur.
    // Therefore, we need to take into account in the page content calculation
    // the margin of the nextPageStart as well, so its offsetTop is not suitable.
    // That's why we take the BOTTOM of the previousPageEnd.
    const lastElem = pages[pages.length - 1].previousPageEnd;
    // const flowCutPoint = pages[pages.length - 1]?.nextPageStart.offsetTop || 0;
    const flowCutPoint = lastElem ? lastElem.offsetTop + lastElem.offsetHeight : 0;
    const newPageBottom = flowCutPoint + pageContentHeight;

    // ? isForcedPageBreak
    if (isForcedPageBreak(currentElement)) {
      pages.push({
        previousPageEnd: previousElement,
        nextPageStart: nextElement,
        pageBreak: currentElement,
      });
      return
    }

    // ? IF currentElement does not fit
    // in the remaining space on the page,
    // loop the children:
    if (nextElement.offsetTop > newPageBottom) {

      const children = isUnbreakable(currentElement) ? [] : getChildren(currentElement);

      if (children.length) {
        // ? Process children if exist:
        parseNodes({
          array: children,
          previous: previousElement,
          next: nextElement
        })
      } else {
        // ? If no children, move element to the next page:
        pages.push({
          previousPageEnd: previousElement,
          nextPageStart: currentElement,
        });
      }

    }
    // ? IF currentElement fits, continue.
  }

  return pages;
}

// * PREVIEW GENERATION

function processLayout({
  pages,
  contentFlow,
  paperFlow,
  virtualPage,
  headerContentHeight,
  footerContentHeight,
  virtualPageHeight,
}) {

  // Total number of pages.
  const total = pages.length;

  // TODO edit comment:
  // Before inserting page breaks into the content and calculating balancers,
  // add an element to compensate for the separator before the first virtual page.
  // This will affect the top position of all the following content elements in the preview.
  // contentFlow.prepend(createVirtualPageGap());

  pages.map((item, index) => {

    // ADD VIRTUAL PAGE

    const {
      paper,
      separator
    } = createPaper(virtualPage, index + 1, total);

    paperFlow.append(paper);

    // add the separator as referencePoint to the next page
    // (index < total - 1) && (pages[index + 1].referencePoint = separator);
    pages[index].referencePoint = separator;
    pages[index].paper = paper;

    // ADD CONTENT BREAKs

    const {
      previousPageEnd,
      nextPageStart,
      referencePoint,
    } = item;

    if (previousPageEnd) {
      // If it is a page break and not the first header.

      // Based on _separator (virtual, not printed element, inserted into contentFlow)
      // and referencePoint (virtual, not printed element, inserted into paperFlow),
      // calculate the height of the necessary compensator to visually fit page breaks
      // in the content in contentFlow and virtual page images on the screen in paperFlow.
      const _separator = createVirtualPageGap();
      pages[index]._separator = _separator;
      // In this element we will add a compensator.
      // We create it with a basic compensator,
      // which takes into account now only the footerContentHeight.
      const _balancedFooter = createBalancingFooter(footerContentHeight);

      // Put all the parts of the break simulation on the page.
      nextPageStart.before(
        _balancedFooter,
        createRunningFooter(),
        _separator,
        createRunningHeader(),
        createBalancingHeader(headerContentHeight),
      );

      // Determine what inaccuracy there is visually in the break simulation position,
      // and compensate for it.
      const balancer = referencePoint.offsetTop - _separator.offsetTop;
      _balancedFooter.style.marginBottom = balancer + 'px';

      // TODO check if negative on large documents
      console.log(balancer);

      // Do not do this when creating the first header.
    } else {
      nextPageStart.before(
        createRunningHeader(),
        createBalancingHeader(headerContentHeight),
      )
    }
  })
}

// * PUT IT ALL TOGETHER

function printTHIS(printedRoot) {

  console.time("printTHIS");

  const config = createConfig();
  insertPrintStyles(generatePrintStyles(config));

  const printTHIS = printedRoot;
  ignorePrintingEnvironment(printTHIS);

  const virtualPage = createVirtualPage();

  const {
    pageContentHeight,
    headerContentHeight,
    footerContentHeight,
    virtualPageHeight,
  } = calculateHeights(virtualPage);

  console.log('contentHeight: ', pageContentHeight);
  console.log('headerContentHeight: ', headerContentHeight);
  console.log('footerContentHeight: ', footerContentHeight);

  const {
    contentFlow,
    paperFlow,
  } = createLayout({
    printTHIS: printTHIS,
    pageContentHeight: pageContentHeight,
  });


  // TODO position:relative
  // do not use offset, use boundaries

  const pages = calculatePages({ contentFlow, pageContentHeight });

  console.log('pages: \n', pages);

  processLayout({
    config,
    pages,
    contentFlow,
    paperFlow,
    virtualPage,
    headerContentHeight,
    footerContentHeight,
    virtualPageHeight,
  });

  console.timeEnd("printTHIS");

};

// * FIRE

window.addEventListener("load", function (event) {

  _emulateContent();

  // TODO add comment about config

  const printedRoot = prepareRootElement(SELECTORS.root);

  // TODO start on load all <OBJECT>
  // resizeObserver.observe(printedRoot);

  printedRoot && printTHIS(printedRoot);

});
