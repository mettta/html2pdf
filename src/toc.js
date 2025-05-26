export default class Toc {

  constructor({
    config,
    DOM,
    selector,
    node,
    layout,
  }) {

    // * From config:
    this._debugMode = config.debugMode;
    this._debug = config.debugMode ? { ...config.debugConfig.toc } : {};

    this._DOM = DOM;
    this._node = node;
    this._tocPageNumberSelector = config.tocPageNumberSelector;
    this._root = layout.root;
    this._contentFlow = layout.contentFlow;
    this._pageDividerSelector = selector.pageDivider;
  }

  render() {
    this._debugMode && console.time("Processing TOC");

    this._debug._ && console.log(`
📑 TOC: I am here!

tocPageNumberSelector:
 • ${this._tocPageNumberSelector}
 pageDividerSelector:
 • ${this._pageDividerSelector}
      `);

    const tocPageNumberBoxes = this._DOM.getAll(this._tocPageNumberSelector, this._contentFlow);
    this._debug._ && console.log('📑 tocPageNumberBoxes', tocPageNumberBoxes.length);

    if (!tocPageNumberBoxes.length) {
      this._debug._ && console.log('📑 no valid toc');
      return
    }

    // 1) collect a dictionary of 'Page markers'
    //    to which their 'pageTop' positions are mapped as keys
    // 2) collect a dictionary of 'Boxes for numbers',
    //    which have their 'targetTop' positions as keys
    // 3) merge the dictionaries.

    const dataFromPagesMarkers = this._DOM.getAll(this._pageDividerSelector, this._contentFlow)
    .reduce((acc, marker, index) => {
      // * The conditions for the following code snippet are as follows:
      // - It should be executed after the preview is rendered.
      // - The presence of a Table of Contents (TOC) on the first pages ensures
      //   that no target element with targetTop=0 is considered.
      // * Consequently, we can:
      // - Decrease all 'pageTop' values for Page markers by a few pixels.
      //   This avoids an exact match with the 'targetTop' of targets when merging
      //   two dictionaries with keys => 'pageTop|targetTop'.
      //   *** By pushing the beginning of the page upwards, we ensure that
      //   *** this marker will not match any content element of the pages.
      // - Ignore the first value where pageTop==0 since we don't expect
      //   to see target elements with such a top (due to the presence of a TOC).

      // * That's how we get the {-1 : 1} object,
      // * which means page 1 has a negative top.
      // * We ignore it, as described above.
      const pageTop = this._node.getTop(marker, this._root) - 1;

      const pageNum = this._DOM.getAttribute(marker, '[page]');
      acc[pageTop] = pageNum;
      return acc;
    }, {});
    this._debug._ && console.log('📑 dataFromPagesMarkers', dataFromPagesMarkers);

    const dataFromTOC = tocPageNumberBoxes.reduce((acc, box) => {
      const id = this._DOM.getDataId(box);
      const target = this._DOM.getElementById(id);
      const targetTop = this._node.getTop(target, this._root);
      acc[targetTop] = {
        box: box,
        id: id,
        targetTop: targetTop,
      };
      return acc;
    }, {});
    this._debug._ && console.log('📑 dataFromTOC', dataFromTOC);

    const tocObject = {
      ...dataFromPagesMarkers,
      ...dataFromTOC
    };

    let pageAcc = 0;

    this._debug._ && console.groupCollapsed('Processing obj');
    for (const key in tocObject) {
      const value = tocObject[key];
      this._debug._ && console.log(`Processing ${key}: ${value}`);

      if (typeof value === 'string') {
        pageAcc = value;
      } else {
        value.page = pageAcc;
        this._DOM.setInnerHTML(value.box, pageAcc)
      }
    }
    this._debug._ && console.groupEnd('Processing obj');

    this._debug._ && console.log('📑 tocObject', tocObject);

    this._debugMode && console.timeEnd("Processing TOC");
  }
}
