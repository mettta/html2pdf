
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
import NodeSplitter from './nodeSplitter';

export default class HTML2PDF4DOC {
  constructor(params) {
    this.params = params;
    this.selector = SELECTOR;
    this.config;
  }

  render() {

    console.time("HTML2PDF4DOC time");

    this.config = config(this.params);

    const DOM = new DocumentObjectModel({DOM: window.document, debugMode: this.config.debugMode});

    const node = new Node({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
    });

    const splitter = new NodeSplitter({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
    });

    const layout = new Layout({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
      node: node,
    });

    layout.create();
    if (!layout.success) {
      console.error( 'Failed to create layout.\n\nWe have to interrupt the process of creating PDF preview. ');
      return
    }

    const paper = new Paper({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
      node: node,
      layout: layout,
    });

    const pages = new Pages({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
      node: node,
      splitter: splitter,
      layout: layout,
      referenceHeight: paper.bodyHeight,
      referenceWidth: paper.bodyWidth,
    }).calculate();

    new Preview({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
      node: node,
      layout: layout,
      paper: paper,
      pages: pages,
    }).create();

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

    console.timeEnd("HTML2PDF4DOC time");
  }
}
