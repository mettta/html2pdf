
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

    console.time("HTML2PDF4DOC time");
    console.info('HTML2PDF4DOC config:', this.config);

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
      DOM: DOM,
      selector: SELECTOR,
      layout: layout,
      referenceHeight: paper.bodyHeight,
      referenceWidth: paper.bodyWidth,
    }).calculate();

    new Preview({
      config: this.config,
      DOM: DOM,
      selector: SELECTOR,
      layout: layout,
      paper: paper,
      pages: pages,
    }).create();

    new Toc({
      config: this.config,
      DOM: DOM,
      selector: SELECTOR,
      layout: layout,
    }).render();

    console.timeEnd("HTML2PDF4DOC time");
  }
}
