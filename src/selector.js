const CURRENT_PREFIX = 'html2pdf4doc';
const LEGACY_PREFIX = 'html2pdf';

/**
 * Builds a backward‑compatible selector for DOM queries.
 * If the input selector contains the current prefix `html2pdf4doc`,
 * it generates a legacy variant by replacing it with `html2pdf` and
 * returns a comma‑separated selector list: "current,legacy".
 * This lets querySelector/All match both new and old markup without
 * altering the rest of the selector; if no `html2pdf4doc` is present,
 * it returns the selector unchanged.
 */
export function withLegacySelector(selector) {
  if (typeof selector !== 'string') return selector;
  if (!selector.includes(CURRENT_PREFIX)) return selector;
  const legacySelector = selector.replaceAll(CURRENT_PREFIX, LEGACY_PREFIX);
  if (legacySelector === selector) return selector;
  return `${selector},${legacySelector}`;
}

const SELECTOR = {
  // * root, is taken from DOM
  init: '[html2pdf4doc]',

  // * Layout
  root: 'html2pdf4doc-root',
  paperFlow: 'html2pdf4doc-paper-flow',
  contentFlow: 'html2pdf4doc-content-flow',
  overlayFlow: 'html2pdf4doc-overlay-flow',

  // pageDivider is used to determine which page an object is on,
  // and contains elements that separate the pages in the content flow.
  // *** service page separator:
  pageDivider: 'html2pdf4doc-page',
  // *** page-beginning element:
  pageStartMarker: '[html2pdf4doc-page-start]',
  pageEndMarker: '[html2pdf4doc-page-end]',
  pageMarker: '[html2pdf4doc-page]',

  // *** content-flow inner markers:
  contentFlowStart: 'html2pdf4doc-content-flow-start',
  contentFlowEnd: 'html2pdf4doc-content-flow-end',

  // * STYLE element
  style: '[html2pdf4doc-style]',

  // * TEMPLATES
  // *** are taken from DOM:
  frontpageTemplate: '[html2pdf4doc-frontpage]',
  headerTemplate: '[html2pdf4doc-header]',
  footerTemplate: '[html2pdf4doc-footer]',
  // *** elements with content from templates:
  frontpageElement: 'html2pdf4doc-frontpage',
  frontpageContent: 'html2pdf4doc-frontpage-content',
  headerContent: 'html2pdf4doc-header',
  footerContent: 'html2pdf4doc-footer',
  // *** page numbers:
  pageNumberRoot: '[html2pdf4doc-page-number]',
  pageNumberCurrent: '[html2pdf4doc-page-number-current]',
  pageNumberTotal: '[html2pdf4doc-page-number-total]',

  // * printed parts of page
  pageChrome: 'html2pdf4doc-page-chrome',
  pageBodySpacer: 'html2pdf4doc-page-body-spacer',
  pageHeader: 'html2pdf4doc-page-header',
  pageFooter: 'html2pdf4doc-page-footer',
  printPageBreak: 'html2pdf4doc-print-page-break',
  runningSafety: 'html2pdf4doc-print-running',

  // * virtual parts of paper, only for preview
  virtualPaper: 'html2pdf4doc-virtual-paper',
  virtualPaperTopMargin: 'html2pdf4doc-virtual-paper-margin-top',
  virtualPaperBottomMargin: 'html2pdf4doc-virtual-paper-margin-bottom',
  virtualPaperGap: 'html2pdf4doc-virtual-paper-gap',

  // * Print attributes
  // * (are set on existing elements without affecting their appearance)
  // ** environment
  printIgnore: '[html2pdf4doc-print-ignore]',
  printHide: '[html2pdf4doc-print-hide]',

  // * Service elements (are created in the process):
  neutral: 'html2pdf4doc-neutral',
  word: 'html2pdf4doc-word',
  textNode: 'html2pdf4doc-text-node',
  textLine: 'html2pdf4doc-text-line',
  textGroup: 'html2pdf4doc-text-group',
  complexTextBlock: 'html2pdf4doc-complex-text-block',
  printForcedPageBreak: 'html2pdf4doc-print-forced-page-break',
  // * Service flags (are created in the process):
  split: '[html2pdf4doc-split]',
  processed: '[html2pdf4doc-processed]',

  // * FLAGS (have no styles):
  flagNoBreak: '[html2pdf4doc-flag-no-break]',
  flagNoHanging: '[html2pdf4doc-flag-no-hanging]',
  flagSlice: '[html2pdf4doc-flag-slice]',

  // *** SPECIAL
  topCutPart: '.html2pdf4doc-top-cut',
  bottomCutPart: '.html2pdf4doc-bottom-cut',
  cleanTopCut: '.html2pdf4doc-clean-top-cut',
  cleanBottomCut: '.html2pdf4doc-clean-bottom-cut',

  // * TOC
  tocPageNumber: 'html2pdf4doc-toc-page-number'

};

export default SELECTOR;
