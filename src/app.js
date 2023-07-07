
import config from './config';
import SELECTOR from './selector';
import Style from './style';
import DocumentObjectModel from './DOM';
import Layout from './layout';
import Pages from './pages';
import Paper from './paper';
import Preview from './preview';

export default class HTML2PDF4DOC {
  constructor(params) {
    this.params = params;
    this.debugMode = this.config().debugMode;
  }

  config() {
    return {
      // Parameters affect the base config,
      ...config(this.params),
      // and then also redefine the base config.
      ...this.params
    }
  }

  render() {

    this.debugMode && console.time("printTHIS");

    const DOM = new DocumentObjectModel({DOM: window.document, debugMode: this.debugMode});
    DOM.insertStyle(new Style(this.config()).create());

    const layout = new Layout({
      debugMode: this.debugMode,
      DOM: DOM,
      selector: SELECTOR
    });

    const paper = new Paper({
      debugMode: this.debugMode,
      DOM: DOM,
      selector: SELECTOR
    });

    layout.create();

    const pages = new Pages({
      debugMode: this.debugMode,
      DOM,
      layout: layout,
      referenceHeight: paper.bodyHeight,
      referenceWidth: paper.bodyWidth,
    }).calculate();

    new Preview({
      debugMode: this.debugMode,
      DOM,
      selector: SELECTOR,
      layout: layout,
      paper: paper,
      pages: pages,
    }).create();

    this.debugMode && console.timeEnd("printTHIS");
  }
}
