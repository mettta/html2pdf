
import config from './config';
import SELECTOR from './selector';
import Style from './style';
import DocumentObjectModel from './DOM';
import Layout from './layout';
import Pages from './pages';
import Paper from './paper';
import Preview from './preview';
import Toc from './toc';

export default class HTML2PDF4DOC {
  constructor(params) {
    this.params = params;
    this.config = this._config();
  }

  _config() {
    return {
      // Parameters affect the base config,
      ...config(this.params),
      // and then also redefine the base config.
      ...this.params
    }
  }

  render() {

    this.config.debugMode && console.time("printTHIS");

    // TODO
    // this.config.debugMode && 
    console.info(this.config);

    const DOM = new DocumentObjectModel({DOM: window.document, debugMode: this.config.debugMode});
    DOM.insertStyle(new Style(this.config).create());

    const layout = new Layout({
      config: this.config,
      DOM: DOM,
      selector: SELECTOR
    });

    const paper = new Paper({
      config: this.config,
      DOM: DOM,
      selector: SELECTOR
    });

    layout.create();

    const pages = new Pages({
      config: this.config,
      DOM,
      layout: layout,
      referenceHeight: paper.bodyHeight,
      referenceWidth: paper.bodyWidth,
    }).calculate();

    new Toc({
      config: this.config,
      DOM: DOM,
      selector: SELECTOR,
      pages: pages,
    }).render();

    new Preview({
      config: this.config,
      DOM,
      selector: SELECTOR,
      layout: layout,
      paper: paper,
      pages: pages,
    }).create();

    this.config.debugMode && console.timeEnd("printTHIS");
  }
}
