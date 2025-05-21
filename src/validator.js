export default class Validator {
  constructor({
    config,
    DOM,
    selector,
    node,
    layout,
  }) {
    this._config = config;
    this._selector = selector;
    this._DOM = DOM;
    this._node = node;
    this._layout = layout;
    this._root = layout.root;

    this._assert = config.consoleAssert ? true : false;
  }

  init() {
    this._config.debugMode && console.log('🐙 i am Validator!');

    const paperGapSelector = `${this._selector.paperFlow} ${this._selector.virtualPaperGap}`;
    const pageGapSelector = `${this._selector.contentFlow} ${this._selector.virtualPaperGap}`;
    const paperGapElements = [...this._DOM.getAllElements(paperGapSelector)];
    const pageGapElements = [...this._DOM.getAllElements(pageGapSelector)];
    const paperGaps = paperGapElements.map(paperGap => this._node.getTop(paperGap));
    const pageGaps = pageGapElements.map(pageGap => this._node.getTop(pageGap, this._root));

    const brokenDividers = paperGaps.reduce((accumulator, currentValue, index) => {
      if (currentValue !== pageGaps[index]) {
        accumulator.push(index + 1)
      };
      return accumulator
    }, []);

    this._assert && console.assert(!brokenDividers.length, 'Problems with preview generation on the following pages: ', brokenDividers)

  }
}
