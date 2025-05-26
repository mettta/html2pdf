import * as Selectors from './node/selectors.js';
import * as Positioning from './node/positioning.js';
import * as Getters from './node/getters.js';
import * as Creators from './node/creators.js';
import * as Splitters from './node/splitters.js';
import * as Markers from './node/markers.js';
import * as Wrappers from './node/wrappers.js';
import * as Fitters from './node/fitters.js';
import * as Pagebreaks from './node/pagebreaks.js';
import * as Children from './node/children.js';

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
  }

  clearTemplates(root) {
    // Remove all <template>s, if there are any in the Root.
    const templates = this.getAll('template', root);
    templates.forEach((el) => this._DOM.removeNode(el));
  }

  // INSERT SPECIAL NODES

  insertForcedPageBreakBefore(element) {
    const div = this.create(this._selector.printForcedPageBreak);
    this._DOM.insertBefore(element, div);
    return div;
  }

  insertForcedPageBreakAfter(element) {
    const div = this.create(this._selector.printForcedPageBreak);
    this._DOM.insertAfter(element, div);
    return div;
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

}
