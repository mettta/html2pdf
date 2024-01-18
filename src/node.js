export default class Node {
  constructor({
    config,
    DOM,
    selector
  }) {
    this._config = config;
  }

  init() {
    this._config.debugMode && console.log('🍄 i am Node!')
  }
}
