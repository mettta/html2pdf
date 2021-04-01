const SELECTOR = {
  // root, is taken from DOM
  root: '#printTHIS',

  // TODO move names to config
  // templates, are taken from DOM
  footerTemplate: '#printTHISfooter',
  headerTemplate: '#printTHISheader',
  frontpageTemplate: '#printTHISfrontpage',

  // content from templates
  frontpageContent: '.frontpageContent',
  headerContent: '.headerContent',
  footerContent: '.footerContent',

  // printed parts of paper
  paperBody: '.paperBody',
  paperHeader: '.paperHeader',
  paperFooter: '.paperFooter',

  // virtual parts of paper, only for preview
  virtualPaper: '.virtualPaper',
  virtualPaperTopMargin: '.virtualPaperTopMargin',
  virtualPaperBottomMargin: '.virtualPaperBottomMargin',
  virtualPaperGap: '.virtualPaperGap',

  // layout
  paperFlow: '#paperFlow',
  contentFlow: '#contentFlow',

  // safety
  runningSafety: '.runningSafety',

  // page number
  pageNumberRoot: '[data-page-number-root]',
  pageNumberCurrent: '[data-page-number-current]',
  pageNumberTotal: '[data-page-number-total]',

  // print attributes
  printIgnore: '[data-print-ignore]',
  printHide: '[data-print-hide]',
  printNoBreak: '[data-print-no-break]',

  // printed page break
  printPageBreak: '[data-print-page-break]',
  // processed page break
  printForcedPageBreak: '[data-print-forced-page-break]',

  // service attributes
  printEnd: '[data-print-end]',
  neutral: '[data-neutral]',

};

export default SELECTOR;