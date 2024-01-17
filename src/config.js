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
    printUnits: 'mm',
    printLeftMargin: '21',
    printRightMargin: '21',
    printTopMargin: '12',
    printBottomMargin: '12',
    printFontSize: '12pt', // todo 16+ // 1:18px 2:36px 3:54px
    // html template
    screenUnits: 'px',
    headerMargin: '16',
    footerMargin: '16',
    // virtual
    virtualPagesGap: '16',
  }

  const A4 = {
    printWidth: '210', // todo <170
    printHeight: '297', // todo ~400
  }

  const A5 = {
    printWidth: '148.5', // todo <170
    printHeight: '210', // todo ~400
  }

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

  return config;
}
