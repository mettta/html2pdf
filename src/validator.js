export default class Validator {
  constructor({
    config,
    DOM,
    selector
  }) {
    this._selector = selector;
    this._DOM = DOM;
  }

  init() {
    console.log('🐙 i am Validator!');

    const paperGapSelector = `${this._selector.paperFlow} ${this._selector.virtualPaperGap}`;
    const pageGapSelector = `${this._selector.contentFlow} ${this._selector.virtualPaperGap}`;
    const paperGaps = [...this._DOM.getAllElements(paperGapSelector)].map(gap => gap.offsetTop);
    const pageGaps = [...this._DOM.getAllElements(pageGapSelector)].map(gap => gap.offsetTop);

    const brokenDividers = paperGaps.reduce((accumulator, currentValue, index) => {
      if (currentValue !== pageGaps[index]) {
        accumulator.push(index + 1)
      };
      return accumulator
    }, []);

    console.assert(!brokenDividers.length, 'Problems with preview generation on the following pages: ', brokenDividers)

  }
}
