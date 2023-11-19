export default class Toc {

  // TODO SHOW STATS (with close option)

  constructor({
    config,
    DOM,
    selector,
    layout,
  }) {
    this.config = config;
    this.debugMode = config.debugMode;
    this.selector = selector;
    this.DOM = DOM;
    this.layout = layout;

    this.contentFlow = layout.contentFlow;
    this.root = layout.root;

    this.pageMarkerSelector = selector.pageMarker;
    this.tocPageNumberSelector = selector.tocPageNumber;

    // local
    this.debugToggler = {
      _: false,
    }
  }

  render() {
    this.config.debugMode && console.time("Processing TOC");

    this.debugMode && this.debugToggler._ && console.log(`
📑 TOC: I am here!

tocPageNumberSelector:
 • ${this.tocPageNumberSelector}
pageMarkerSelector:
 • ${this.pageMarkerSelector}
      `);

    const tocPageNumberBoxes = this.DOM.findAllSelectorsInside(this.contentFlow, this.tocPageNumberSelector);
    this.debugMode && this.debugToggler._ && console.log('📑 tocPageNumberBoxes', tocPageNumberBoxes.length);

    if (!tocPageNumberBoxes.length) {
      this.debugMode && this.debugToggler._ && console.log('📑 no valid toc');
      return
    }

    // 1) collect a dictionary of 'Page markers'
    //    to which their 'pageTop' positions are mapped as keys
    // 2) collect a dictionary of 'Boxes for numbers',
    //    which have their 'targetTop' positions as keys
    // 3) merge the dictionaries.

    const dataFromPagesMarkers = this.DOM.findAllSelectorsInside(this.contentFlow, this.pageMarkerSelector)
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
      const pageTop = this.DOM.getElementRootedTop(marker, this.root) - 1;

      const pageNum = this.DOM.getAttribute(marker, '[page]');
      acc[pageTop] = pageNum;
      return acc;
    }, {});
    this.debugMode && this.debugToggler._ && console.log('📑 dataFromPagesMarkers', dataFromPagesMarkers);

    const dataFromTOC = tocPageNumberBoxes.reduce((acc, box) => {
      const id = this.DOM.getDataId(box);
      const target = this.DOM.getElementById(id);
      const targetTop = this.DOM.getElementRootedTop(target, this.root);
      acc[targetTop] = {
        box: box,
        id: id,
        targetTop: targetTop,
      };
      return acc;
    }, {});
    this.debugMode && this.debugToggler._ && console.log('📑 dataFromTOC', dataFromTOC);

    const tocObject = {
      ...dataFromPagesMarkers,
      ...dataFromTOC
    };

    let pageAcc = 0;

    this.debugMode && this.debugToggler._ && console.groupCollapsed('Processing obj');
    for (const key in tocObject) {
      const value = tocObject[key];
      this.debugMode && this.debugToggler._ && console.log(`Processing ${key}: ${value}`);

      if (typeof value === 'string') {
        pageAcc = value;
      } else {
        value.page = pageAcc;
        this.DOM.setInnerHTML(value.box, pageAcc)
      }
    }
    this.debugMode && this.debugToggler._ && console.groupEnd('Processing obj');

    this.debugMode && this.debugToggler._ && console.log('📑 tocObject', tocObject);

    this.config.debugMode && console.timeEnd("Processing TOC");
  }
}
