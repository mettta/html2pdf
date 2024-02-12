
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
import Preloader from './preloader';
import Preprocess from './preprocess';

const CONSOLE_CSS_LABEL = `color:Gray;border:1px solid;`

export default class HTML2PDF4DOC {
  constructor(params) {
    this.params = params;
    this.debugMode = params.debugMode;
    this.preloader = params.preloader;
    this.selector = SELECTOR;
    this.config;
  }

  async render() {
    console.time("⏱️ HTML2PDF4DOC time");

    this.debugMode && console.log('🏁 document.readyState', document.readyState)

    document.addEventListener("readystatechange", (event) => {
      this.debugMode && console.log('🏁 readystatechange', document.readyState)
    });

    // * ⏰ window.addEventListener("DOMContentLoaded")

    this.debugMode && console.time("⏱️ await DOMContentLoaded time");
    await new Promise(resolve => {
      window.addEventListener("DOMContentLoaded", (event) => {
        this.debugMode && console.log("⏰ EVENT: DOMContentLoaded");
        resolve();
      });
    });
    this.debugMode && console.timeEnd("⏱️ await DOMContentLoaded time");

    this.debugMode && console.time("⏱️ create Preloader time");
    const preloader = new Preloader(this.params);
    if (this.preloader === 'true') {
      preloader.create();
    }
    this.debugMode && console.timeEnd("⏱️ create Preloader time");

    // * process config
    this.debugMode && console.time("⏱️ Config time");
    this.debugMode && console.groupCollapsed('%c config ', CONSOLE_CSS_LABEL + 'color:LightGray');
    this.config = config(this.params);
    this.debugMode && console.groupEnd();
    this.debugMode && console.timeEnd("⏱️ Config time");

    // * prepare helpers

    this.debugMode && console.time("⏱️ DOM helpers init time");
    const DOM = new DocumentObjectModel({
      DOM: window.document,
      debugMode: this.debugMode
    });
    this.debugMode && console.timeEnd("⏱️ DOM helpers init time");

    this.debugMode && console.time("⏱️ node helpers init time");
    const node = new Node({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
    });
    this.debugMode && console.timeEnd("⏱️ node helpers init time");

    // * ⏰ window.addEventListener("load")

    this.debugMode && console.time("⏱️ await window load time");
    await new Promise(resolve => {
      window.addEventListener("load", (event) => {
        this.debugMode && console.log("⏰ EVENT: window load");
        resolve();
      });
    });
    this.debugMode && console.timeEnd("⏱️ await window load time");

    // * prepare layout (DOM manipulation)

    this.debugMode && console.time("⏱️ Layout time");
    this.debugMode && console.groupCollapsed('%c Layout ', CONSOLE_CSS_LABEL);
    const layout = new Layout({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
      node: node,
    });
    layout.create();
    this.debugMode && console.groupEnd();
    this.debugMode && console.timeEnd("⏱️ Layout time");
    if (!layout.success) {
      this.debugMode && console.error('Failed to create layout.\n\nWe have to interrupt the process of creating PDF preview.');
      return
    } else {
      // this.debugMode && console.log('🚩 layout.success:', layout.success);
    }

    // * calculate and prepare 'paper'
    this.debugMode && console.info('%c calculate Paper params ', CONSOLE_CSS_LABEL);
    this.debugMode && console.time("⏱️ Paper time");
    const paper = new Paper({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
      node: node,
      layout: layout,
    });
    this.debugMode && console.timeEnd("⏱️ Paper time");
    if (!paper || !paper.bodyHeight || !paper.bodyWidth) {
      this.debugMode && console.error('Failed to create paper calculations.\n\nWe have to interrupt the process of creating PDF preview.');
      return
    } else {
      // this.debugMode && console.log('🚩 paper.bodyHeight:', paper.bodyHeight);
    }

    this.debugMode && console.time("⏱️ Preprocess time");
    this.debugMode && console.groupCollapsed('%c Preprocess ', CONSOLE_CSS_LABEL);
    await new Preprocess(this.config).run();
    this.debugMode && console.groupEnd();
    this.debugMode && console.timeEnd("⏱️ Preprocess time");

    // * calculate pages (DOM manipulation)

    this.debugMode && console.time("⏱️ Pages time");
    this.debugMode && console.groupCollapsed('%c Pages ', CONSOLE_CSS_LABEL); // Collapsed
    const pages = new Pages({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
      node: node,
      layout: layout,
      referenceHeight: paper.bodyHeight,
      referenceWidth: paper.bodyWidth,
    }).calculate();
    this.debugMode && console.groupEnd();
    this.debugMode && console.timeEnd("⏱️ Pages time");

    // * render preview (DOM manipulation)

    this.debugMode && console.time("⏱️ Preview time");
    this.debugMode && console.groupCollapsed('%c Preview ', CONSOLE_CSS_LABEL);
    new Preview({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
      node: node,
      layout: layout,
      paper: paper,
      pages: pages,
    }).create();
    this.debugMode && console.groupEnd();
    this.debugMode && console.timeEnd("⏱️ Preview time");

    // * render TOC page numbers

    this.debugMode && console.time("⏱️ Toc time");
    new Toc({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
      node: node,
      layout: layout,
    }).render();
    this.debugMode && console.timeEnd("⏱️ Toc time");

    // * perform validations

    this.debugMode && console.time("⏱️ Validator time");
    new Validator({
      config: this.config,
      DOM: DOM,
      selector: this.selector,
      layout: layout,
    }).init();
    this.debugMode && console.timeEnd("⏱️ Validator time");

    // * set the attribute that means that rendering is completed successfully
    // FIXME
    DOM.setAttribute(layout.root, '[success]');

    // ? CONDITION
    // ! preloader.remove();

    preloader.remove();
    console.timeEnd("⏱️ HTML2PDF4DOC time");
  }
}
