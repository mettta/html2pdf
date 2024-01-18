import SELECTOR from './selector';

export default function createConfig(params) {

  // ? used in style.js
  let config = {
    // * Debug mode is set in the user configuration.
    // * In the case of connecting the script in HTML without configuration
    // * in order to display messages in the browser console,
    // * this option can be set to true:
    debugMode: false,
    // ** The preloader is only debugged when enabled via user configuration.

    // Register option to print for informational purposes:
    preloader: false,
    preloaderTarget: false,
    preloaderBackground: false,

    mask: false,

    // * The initialRoot can be overridden in the configuration settings.
    // * The default value is set in App.js.
    // * The selector '[html2pdf]' is a constant from SELECTOR (selector.js).
    // * Uncommenting it will have no effect.
    // * This comment is provided for better code navigation.
    // * Left for code navigation purposes.
    // initialRoot: '[html2pdf]', // TODO: make the config dependent on SELECTOR

    noHangingSelectors: false,
    forcedPageBreakSelectors: false,
    pageBreakBeforeSelectors: false,
    pageBreakAfterSelectors: false,
    noBreakSelectors: false,

    // toc
    tocPageNumberSelector: 'html2pdf-toc-page-number', // TODO: make the config dependent on SELECTOR

    // print
    printLeftMargin: '21mm',
    printRightMargin: '21mm',
    printTopMargin: '12mm',
    printBottomMargin: '12mm',
    printFontSize: '12pt', // todo 16+ // 1:18px 2:36px 3:54px
    // print A4 default
    printWidth: '210mm', // todo <170
    printHeight: '297mm', // todo ~400
    // html template
    headerMargin: '16px',
    footerMargin: '16px',
    // virtual
    virtualPagesGap: '16px',
  }

  const A4 = {
    printWidth: '210mm', // todo <170
    printHeight: '297mm', // todo ~400
  }

  const A5 = {
    printWidth: '148.5mm', // todo <170
    printHeight: '210mm', // todo ~400
  }

  // * Can be specified by a shorthand entry,
  // * and then can be partially or completely overridden
  // * by specifying printWidth and printHeight.
  // TODO
  // ? landscape | portrait
  switch (params.printPaperSize) {
    case 'A5':
    case 'a5':
      config = {
        ...config,
        ...A5
      };
      break;
    case 'A4':
    case 'a4':
    default:
      config = {
        ...config,
        ...A4
      };
  }

  // * Apply the defaults and custom configuration
  // * extracted from the script attributes from the DOM.
  config = {
    // Parameters affect the base config,
    ...config,

    // definition of the selector for the default printable area
    // as specified in the SELECTOR,
    initialRoot: SELECTOR.init,
    tocPageNumberSelector:SELECTOR.tocPageNumber,

    // and then also redefine the base config.
    ...params
  }

  return config;
}
