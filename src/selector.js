const SELECTOR = {
  // root, is taken from DOM
  // ? used in layout & preview & pages
  root: '[html2pdf]',

  // TODO move names to config
  // templates, are taken from DOM
  // ? used in paper.js
  footerTemplate: '[html2pdf-footer]',
  headerTemplate: '[html2pdf-header]',
  // ? used in paper & preview
  frontpageTemplate: '[html2pdf-frontpage]',

  // content from templates
  // ? used in paper.js
  frontpageContent: 'html2pdf-frontpage',
  headerContent: 'html2pdf-header',
  footerContent: 'html2pdf-footer',

  // printed parts of paper
  // ? used in paper.js
  paperBody: 'html2pdf-paper-body',
  paperHeader: 'html2pdf-paper-header',
  paperFooter: 'html2pdf-paper-footer',

  // virtual parts of paper, only for preview
  // ? used in paper & preview
  virtualPaper: 'html2pdf-paper',
  virtualPaperTopMargin: 'html2pdf-paper-margin-top',
  virtualPaperBottomMargin: 'html2pdf-paper-margin-bottom',
  virtualPaperGap: 'html2pdf-paper-gap',

  // layout
  // ? used in layout & preview
  paperFlow: '#paperFlow',
  contentFlow: '#contentFlow',

  // safety
  // ? used in preview
  runningSafety: '.runningSafety',

  // page number
  // ? used in paper.js
  pageNumberRoot: '[html2pdf-page-number]',
  pageNumberCurrent: '[html2pdf-page-number-current]',
  pageNumberTotal: '[html2pdf-page-number-total]',

  // print attributes
  // ? used in layout
  printIgnore: '[html2pdf-print-ignore]',
  printHide: '[html2pdf-print-hide]',

  // printed page break
  // ? used in preview
  printPageBreak: '[html2pdf-print-page-break]',
  // processed page break
  // ? DOM
  printForcedPageBreak: 'html2pdf-print-forced-page-break',
  // page break ban
  printNoBreak: '[html2pdf-print-no-break]',

  // service attributes
  // ? DOM
  neutral: '[data-neutral]',
  complexTextBlock: 'html2pdf-complex-text-block',

};

export default SELECTOR;
