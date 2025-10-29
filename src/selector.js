const SELECTOR = {
  // * root, is taken from DOM
  init: '[html2pdf]',

  // * Layout
  root: 'html2pdf-root',
  paperFlow: 'html2pdf-paper-flow',
  contentFlow: 'html2pdf-content-flow',
  overlayFlow: 'html2pdf-overlay-flow',

  // pageDivider is used to determine which page an object is on,
  // and contains elements that separate the pages in the content flow.
  // *** service page separator:
  pageDivider: 'html2pdf-page',
  // *** page-beginning element:
  pageStartMarker: '[html2pdf-page-start]',
  pageEndMarker: '[html2pdf-page-end]',

  // *** content-flow inner markers:
  contentFlowStart: 'html2pdf-content-flow-start',
  contentFlowEnd: 'html2pdf-content-flow-end',

  // * STYLE element
  style: '[html2pdf-style]',

  // * TEMPLATES
  // *** are taken from DOM:
  frontpageTemplate: '[html2pdf-frontpage]',
  headerTemplate: '[html2pdf-header]',
  footerTemplate: '[html2pdf-footer]',
  // *** elements with content from templates:
  frontpageElement: 'html2pdf-frontpage',
  frontpageContent: 'html2pdf-frontpage-content',
  headerContent: 'html2pdf-header',
  footerContent: 'html2pdf-footer',
  // *** page numbers:
  pageNumberRoot: '[html2pdf-page-number]',
  pageNumberCurrent: '[html2pdf-page-number-current]',
  pageNumberTotal: '[html2pdf-page-number-total]',

  // * printed parts of page
  pageChrome: 'html2pdf-page-chrome',
  pageBodySpacer: 'html2pdf-page-body-spacer',
  pageHeader: 'html2pdf-page-header',
  pageFooter: 'html2pdf-page-footer',
  printPageBreak: 'html2pdf-print-page-break',
  runningSafety: 'html2pdf-print-running',

  // * virtual parts of paper, only for preview
  virtualPaper: 'html2pdf-virtual-paper',
  virtualPaperTopMargin: 'html2pdf-virtual-paper-margin-top',
  virtualPaperBottomMargin: 'html2pdf-virtual-paper-margin-bottom',
  virtualPaperGap: 'html2pdf-virtual-paper-gap',

  // * Print attributes
  // * (are set on existing elements without affecting their appearance)
  // ** environment
  printIgnore: '[html2pdf-print-ignore]',
  printHide: '[html2pdf-print-hide]',

  // * Service elements (are created in the process):
  neutral: 'html2pdf-neutral',
  word: 'html2pdf-word',
  textNode: 'html2pdf-text-node',
  textLine: 'html2pdf-text-line',
  textGroup: 'html2pdf-text-group',
  complexTextBlock: 'html2pdf-complex-text-block',
  printForcedPageBreak: 'html2pdf-print-forced-page-break',
  // * Service flags (are created in the process):
  split: '[html2pdf-split]',
  processed: '[html2pdf-processed]',

  // * FLAGS (have no styles):
  flagNoBreak: '[html2pdf-flag-no-break]',
  flagNoHanging: '[html2pdf-flag-no-hanging]',
  flagSlice: '[html2pdf-flag-slice]',

  // *** SPECIAL
  topCutPart: '.html2pdf-top-cut',
  bottomCutPart: '.html2pdf-bottom-cut',
  cleanTopCut: '.html2pdf-clean-top-cut',
  cleanBottomCut: '.html2pdf-clean-bottom-cut',

  // * TOC
  tocPageNumber: 'html2pdf-toc-page-number'

};

export default SELECTOR;
