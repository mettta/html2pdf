export default function createConfig(params) {

  // ! A4
  const DEFAULT_CONFIG = {
    // print
    printUnits: 'mm',
    width: '210',
    height: '297',
    left: '21',
    right: '21',
    top: '10',
    bottom: '12',
    fontSize: '11pt',
    // html template
    screenUnits: 'px',
    headerMargin: '16',
    footerMargin: '16',
    // virtual
    virtualPagesGap: '16',
  }

  let config = DEFAULT_CONFIG;
  // TODO config
  // if (customPrintTHISConfig) {
  //   conf = {
  //     ...conf,
  //     ...customPrintTHISConfig
  //   }
  // }

  return config;
}