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

    noHangingSelector: false,
    forcedPageBreakSelector: false,
    noBreakSelector: false,

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
