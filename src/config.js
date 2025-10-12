import SELECTOR from './selector.js';

export default function createConfig(params) {

  // * Normalize string booleans in config object
  // * (e.g. "true" → true)
  params = convertStringBools(params);

  // ? used in style.js
  let config = {
    // * Debug mode is set in the user configuration.
    // * In the case of connecting the script in HTML without configuration
    // * in order to display messages in the browser console,
    // * this option can be set to true:
    debugMode: false,
    // ** The preloader is only debugged when enabled via user configuration.

    // * Assert messages are enabled in the user settings by the parameter
    // * data-console-assert="true".
    // * By default is disabled.
    consoleAssert: false,

    // * Visual flags on processed DOM elements (affects performance)
    // * are enabled in user settings using the parameter
    // * data-markup-debug-mode=“true”.
    // * Disabled by default.
    markupDebugMode: false,

    // Register option to print for informational purposes:
    preloader: false,
    preloaderTarget: '',
    preloaderBackground: '',

    mask: true,

    // * The initialRoot can be overridden in the configuration settings.
    // * The default value is set in App.js.
    // * The selector '[html2pdf]' is a constant from SELECTOR (selector.js).
    // * Uncommenting it will have no effect.
    // * This comment is provided for better code navigation.
    // * Left for code navigation purposes.
    // initialRoot: '[html2pdf]', // TODO: make the config dependent on SELECTOR

    noHangingSelectors: '',
    forcedPageBreakSelectors: '',
    pageBreakBeforeSelectors: '',
    pageBreakAfterSelectors: '',
    noBreakSelectors: '',

    // toc
    tocPageNumberSelector: 'html2pdf-toc-page-number', // TODO: make the config dependent on SELECTOR

    // print
    printLeftMargin: '21mm',
    printRightMargin: '21mm',
    printTopMargin: '12mm',
    printBottomMargin: '12mm',
    printFontSize: '12pt', // todo 16+ // 1:18px 2:36px 3:54px
    // misk
    paperColor: 'white',
    // print A4 default
    printWidth: '210mm', // todo <170
    printHeight: '297mm', // todo ~400
    // html template
    headerMargin: '16px',
    footerMargin: '16px',
    // virtual
    virtualPagesGap: '16px',

    // * service elements:
    splitLabelHeight: '24px'
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

  console.info('[HTML2PDF4DOC] Config:', config);

  // * Convert units to pixels
  const measurement = {
    printLeftMargin: config.printLeftMargin,
    printRightMargin: config.printRightMargin,
    printTopMargin: config.printTopMargin,
    printBottomMargin: config.printBottomMargin,
    printFontSize: config.printFontSize,
    printWidth: config.printWidth,
    printHeight: config.printHeight,
    headerMargin: config.headerMargin,
    footerMargin: config.footerMargin,
    virtualPagesGap: config.virtualPagesGap,
  }

  const test = document.createElement('div');
  test.style = `
  position:absolute;
  z-index:1000;
  left: 200%;
  `;
  document.body.append(test);

  Object.entries(measurement)
    .forEach(([key, value]) => {
      test.style.width = value;
      measurement[key] = `${Math.trunc(test.getBoundingClientRect().width)}px`;
    });
  test.remove();

  // * Update config with recalculated measurement
  config = {
    ...config,
    ...measurement
  };

  // * Add default page-breaking selectors selectors
  // * for to nicely divide the elements of a document:
  config.noHangingSelectors = config.noHangingSelectors + ' H1 H2 H3 H4 H5 H6';
  config.forcedPageBreakSelectors = config.forcedPageBreakSelectors + ' ' + SELECTOR.printForcedPageBreak;
  // config.pageBreakBeforeSelectors = '';
  // config.pageBreakAfterSelectors = '';
  // config.noBreakSelectors = '';

  config.debugMode && console.info('Config with converted units:', config);

  return config;
}

/**
 * Returns a copy of the object where string values
 * that clearly represent boolean values ("true", "false", "1", "0", "")
 * are converted to true or false.
 *
 * Conversion rules:
 *   - "true", "1" (case-insensitive) → true
 *   - "false", "0", "" (case-insensitive) → false
 *   - all other values (including numbers and other strings) are left unchanged
 *   - the original object is not modified
 *
 * @param {Object} obj — the input object
 * @returns {Object} — a new object with normalized boolean values
 */
function convertStringBools(obj) {
  const result = { ...obj };

  for (const key in result) {
    const value = result[key];

    if (typeof value === "string") {
      const lowered = value.toLowerCase();

      if (lowered === "true" || lowered === "1") {
        result[key] = true;
      } else if (lowered === "false" || lowered === "0" || lowered === "") {
        result[key] = false;
      }
    }
  }

  return result;
}
