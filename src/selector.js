const SELECTOR = {
  // root, is taken from DOM
  // ? used in layout & preview & pages
  root: '#printTHIS',

  // TODO move names to config
  // templates, are taken from DOM
  // ? used in paper.js
  footerTemplate: '#printTHISfooter',
  headerTemplate: '#printTHISheader',
  // ? used in paper & preview
  frontpageTemplate: '#printTHISfrontpage',

  // content from templates
  // ? used in paper.js
  frontpageContent: '.frontpageContent',
  headerContent: '.headerContent',
  footerContent: '.footerContent',

  // printed parts of paper
  // ? used in paper.js
  paperBody: '.paperBody',
  paperHeader: '.paperHeader',
  paperFooter: '.paperFooter',

  // virtual parts of paper, only for preview
  // ? used in paper & preview
  virtualPaper: '.virtualPaper',
  virtualPaperTopMargin: '.virtualPaperTopMargin',
  virtualPaperBottomMargin: '.virtualPaperBottomMargin',
  virtualPaperGap: '.virtualPaperGap',

  // layout
  // ? used in layout & preview
  paperFlow: '#paperFlow',
  contentFlow: '#contentFlow',

  // safety
  // ? used in preview
  runningSafety: '.runningSafety',

  // page number
  // ? used in paper.js
  pageNumberRoot: '[data-page-number-root]',
  pageNumberCurrent: '[data-page-number-current]',
  pageNumberTotal: '[data-page-number-total]',

  // print attributes
  // ? used in layout
  printIgnore: '[data-print-ignore]',
  printHide: '[data-print-hide]',
  printNoBreak: '[data-print-no-break]',

  // printed page break
  // ? used in preview
  printPageBreak: '[data-print-page-break]',
  // processed page break
  // ? DOM
  printForcedPageBreak: '[data-print-forced-page-break]',

  // service attributes
  // ? DOM
  neutral: '[data-neutral]',

};

export default SELECTOR;
