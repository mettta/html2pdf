export default class NodeSplitter {
  constructor({
    config,
    DOM,
    selector
  }) {
    this._config = config;
    this._DOM = DOM;
    this._selector = selector;
  }

  init() {
    this._config.debugMode && console.log('🌵 i am NodeSplitter!')
  }

}
