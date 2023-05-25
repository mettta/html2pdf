export default function createConfig(params) {

  // ? used in style.js
  let config = {
    // print
    printUnits: 'mm',
    printLeftMargin: '21',
    printRightMargin: '21',
    printTopMargin: '12',
    printBottomMargin: '12',
    printFontSize: '11pt', // todo 16+
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
