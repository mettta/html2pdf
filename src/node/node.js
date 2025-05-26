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
