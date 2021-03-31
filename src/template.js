export default class Template {

  constructor(DOM) {

    this.DOM = DOM;

    this.frontpage = this._getFrontpageTemplate();
    this.header = this._getHeaderTemplate();
    this.footer = this._getFooterTemplate();
  }

  _getFrontpageTemplate() {
    return this.DOM.getFrontpageTemplate();
  }
  _getFooterTemplate() {
    return this.DOM.getFooterTemplate();
  }
  _getHeaderTemplate() {
    return this.DOM.getHeaderTemplate();
  }
}