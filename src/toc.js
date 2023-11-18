export default class Toc {

  // TODO SHOW STATS (with close option)

  constructor({
    config,
    DOM,
    selector,

    pages,
  }) {
    this.config = config;
    this.debugMode = config.debugMode;
    this.DOM = DOM;
    this.pages = pages;

    // * Can be overridden in the config in this way:
    // data-toc-page-selector='some_selector'
    this.tocPageSelector = config.tocPageSelector || selector.tocPage;

    // local
    this.debugToggler = {
      _: true,
    }
  }

  render() {
    this.debugToggler && console.log('📃 TOC: I am here!');
    this.debugToggler && console.log('📃', this.tocPageSelector);
    this.debugToggler && console.log('📑 pages', this.pages);
  }

  _renderNumbers() {

  }
}
