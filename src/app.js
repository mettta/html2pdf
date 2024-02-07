
import config from './config';
import SELECTOR from './selector';
import DocumentObjectModel from './DOM';
import Layout from './layout';
import Node from './node';
import Pages from './pages';
import Paper from './paper';
import Preview from './preview';
import Toc from './toc';
import Validator from './validator';

const CONSOLE_CSS_LABEL = `color:Gray;border:1px solid;`

export default class HTML2PDF4DOC {
  constructor(params) {
    this.params = params;
    this.selector = SELECTOR;
    this.config;
  }

  render() {

    console.time("HTML2PDF4DOC time");

    console.groupCollapsed('%c config ', CONSOLE_CSS_LABEL + 'color:LightGray');
    this.config = config(this.params);
    console.groupEnd();

    const DOM = new DocumentObjectModel({DOM: window.document, debugMode: this.config.debugMode});

    const node = new Node({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
    });

    this.config.debugMode && console.groupCollapsed('%c Layout ', CONSOLE_CSS_LABEL);
    const layout = new Layout({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
      node: node,
    });
    layout.create();
    this.config.debugMode && console.groupEnd();

    if (!layout.success) {
      console.error( 'Failed to create layout.\n\nWe have to interrupt the process of creating PDF preview. ');
      return
    };

    const paper = new Paper({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
      node: node,
      layout: layout,
    });

    this.config.debugMode && console.group('%c Pages ', CONSOLE_CSS_LABEL); // Collapsed
    const pages = new Pages({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
      node: node,
      layout: layout,
      referenceHeight: paper.bodyHeight,
      referenceWidth: paper.bodyWidth,
    }).calculate();
    this.config.debugMode && console.groupEnd();

    this.config.debugMode && console.groupCollapsed('%c Preview ', CONSOLE_CSS_LABEL);
    new Preview({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
      node: node,
      layout: layout,
      paper: paper,
      pages: pages,
    }).create();
    this.config.debugMode && console.groupEnd();

    new Toc({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
      node: node,
      layout: layout,
    }).render();

    new Validator({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
      layout: layout,
    }).init();

    // FIXME
    DOM.setAttribute(layout.root, '[success]');

    console.timeEnd("HTML2PDF4DOC time");
  }
}
