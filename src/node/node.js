import * as Selectors from './modules/selectors.js';
import * as Positioning from './modules/positioning.js';
import * as Getters from './modules/getters.js';
import * as Creators from './modules/creators.js';
import * as Splitters from './modules/splitters.js';
import * as Markers from './modules/markers.js';
import * as Wrappers from './modules/wrappers.js';
import * as Fitters from './modules/fitters.js';
import * as Pagebreaks from './modules/pagebreaks.js';
import * as Children from './modules/children.js';
import * as Slicers from './modules/slicers.js';
import Paragraph from './elements/paragraph.js';
import Table from './elements/table.js';
import TableLike from './elements/tableLike.js';
import Grid from './elements/grid.js';
import Pre from './elements/pre.js';


export default class Node {
  constructor({
    config,
    DOM,
    selector
  }) {
    this._config = config;
    this._DOM = DOM;
    this._selector = selector;
    // * From config:
    this._debug = config.debugMode ? { ...config.debugConfig.node } : {};
    this._assert = config.consoleAssert ? true : false;
    this._markupDebugMode = this._config.markupDebugMode;

    Object.assign(this, Selectors);
    Object.assign(this, Positioning);
    Object.assign(this, Getters);
    Object.assign(this, Creators);
    Object.assign(this, Splitters);
    Object.assign(this, Markers);
    Object.assign(this, Wrappers);
    Object.assign(this, Fitters);
    Object.assign(this, Pagebreaks);
    Object.assign(this, Children);
    Object.assign(this, Slicers);

    this._paragraph = new Paragraph({
      config: this._config,
      DOM: this._DOM,
      selector: this._selector,
      node: this,
    });
    this._pre = new Pre({
      config: this._config,
      DOM: this._DOM,
      selector: this._selector,
      node: this,
    });
    this._table = new Table({
      config: this._config,
      DOM: this._DOM,
      selector: this._selector,
      node: this,
    });
    this._grid = new Grid({
      config: this._config,
      DOM: this._DOM,
      selector: this._selector,
      node: this,
    });
    this._tableLike = new TableLike({
      config: this._config,
      DOM: this._DOM,
      selector: this._selector,
      node: this,
    });
  }

  clearTemplates(root) {
    // Remove all <template>s, if there are any in the Root.
    const templates = this._DOM.getAll('template', root);
    templates.forEach((el) => this._DOM.removeNode(el));
  }

  // **********

  notSolved(element) {
    // TODO !!!
    // помещать такой объект просто на отдельную страницу
    // проверить, если объект больше - как печатаются номера и разрывы
    const tag = this._DOM.getElementTagName(element);
    // return (tag === 'OBJECT')
    return false
  }

  // 🔧 Service:

  // TODO: move this function to shared (for node/paragraph/table...)
  _end(string) {
    const CONSOLE_CSS_END_LABEL = `background:#eee;color:#888;padding: 0 1px 0 0;`; //  font-size:smaller

    this._debug._ && console.log(`%c ▲ ${string} `, CONSOLE_CSS_END_LABEL);
    this._debug._ && console.groupEnd();
  }

}
