const CONSOLE_CSS_END_LABEL = `background:#999;color:#FFF;padding: 0 4px;`;

export default class Grid {
  constructor({
    config,
    DOM,
    node,
    selector,
  }) {
    // * From config:
    this._debug = config.debugMode ? { ...config.debugConfig.grid } : {};

    // * Private
    this._DOM = DOM;
    this._selector = selector;
    this._node = node;

    // todo
    // 1) move to config
    // Paragraph:
    this._minLeftLines = 2;
    this._minDanglingLines = 2;
    this._minBreakableLines = this._minLeftLines + this._minDanglingLines;
    // Table:
    // # can be a single row with long content
    this._minLeftRows = 1; // ! min 1!
    this._minDanglingRows = 1;  // ! min 1!
    this._minBreakableRows = 1; // this._minLeftRows + this._minDanglingRows;
    // Code:
    this._minPreFirstBlockLines = 3;
    this._minPreLastBlockLines = 3;
    this._minPreBreakableLines = this._minPreFirstBlockLines + this._minPreLastBlockLines;
    // Grid:
    this._minBreakableGridRows = 4;

    this._imageReductionRatio = 0.8;

    // TODO make function
    // * From config:
    // - if null is set - the element is not created in createSignpost().
    this._signpostHeight = parseFloat(config.splitLabelHeight) || 0;


  }

  split(node, pageBottom, fullPageHeight, root) {
    // * Split simple grids,
    // * consider that templating is used, but there is no content in complex areas.
    // * If something unclear is encountered - do not split at all.
    // TODO (shall we scale?).

    this._debug._ && console.group('%c_splitGridNode', 'background:#00FFFF');

    const children = this._node.getPreparedChildren(node);

    const nodeComputedStyle = this._DOM.getComputedStyle(node);
    const initialInlinePosition = node.style.position;
    const needsTempPosition = nodeComputedStyle.position === 'static';
    const restorePosition = () => {
      if (!needsTempPosition) return;
      if (initialInlinePosition) {
        this._DOM.setStyles(node, { position: initialInlinePosition });
      } else {
        node.style.removeProperty('position');
      }
    };

    if (!children.length) {
      restorePosition();
      this._debug._ && console.groupEnd();
      return [];
    }

    if (needsTempPosition) {
      // In some layouts grid stays `position: static`; force a relative context so
      // offset-based getters work (otherwise offsets are taken from body and rows
      // start looking like a single chunk).
      this._DOM.setStyles(node, { position: 'relative' });
    }

    const ROW_TOP_STEP = 0.5; // tolerate sub-pixel jitter when detecting row breaks
    const rowGroups = [];
    const rowTops = [];

    children.forEach((child) => {
      const top = this._node.getTop(child, node);
      const lastTop = rowTops.length ? rowTops[rowTops.length - 1] : null;
      if (!rowGroups.length || Math.abs(top - lastTop) > ROW_TOP_STEP) {
        rowGroups.push([child]);
        rowTops.push(top);
        return;
      }
      // Rely on vertical position only: we support linear, monotonic grids for now.
      rowGroups[rowGroups.length - 1].push(child);
    });

    const gridNodeRows = rowGroups.length;
    const gridNodeHeight = this._DOM.getElementOffsetHeight(node);

    // ** If there are enough rows for the split to be readable,
    // ** and the node is not too big (because of the content),
    // ** then we will split it.
    // TODO: make the same condition for all like-table:
    if (gridNodeRows < this._minBreakableGridRows && gridNodeHeight < fullPageHeight) {
      // ** Otherwise, we don't split it.
      this._debug._ && console.log(`%c END DONT _splitGridNode`, CONSOLE_CSS_END_LABEL);
      restorePosition();
      this._debug._ && console.groupEnd();
      return []
    }

    // ** We want to know the top point of each row
    // ** to calculate the parts to split.
    // ** After sorting, we can use [0] as the smallest element for this purpose.
    // [ [top, top, top], [top, top, top], [top, top, top] ] =>
    // [ [min-top, top, max-top], [min-top, top, max-top], [min-top, top, max-top] ] =>
    // [min-top, min-top, min-top]
    const gridPseudoRowsTopPoints = [...rowTops, gridNodeHeight];


    this._debug._ && console.log(
      'gridPseudoRowsTopPoints', gridPseudoRowsTopPoints
    );

    // ** Calculate the possible parts.
    // TODO: same as the table

    // ** Prepare node parameters
    const nodeTop = this._node.getTop(node, root);
    const nodeWrapperHeight = this._node.getEmptyNodeHeight(node);
    const firstPartHeight = pageBottom
      - nodeTop
      // - this._signpostHeight
      - nodeWrapperHeight;
    const fullPagePartHeight = fullPageHeight
      // - 2 * this._signpostHeight
      - nodeWrapperHeight;

    this._debug._ && console.log(
      '\n • firstPartHeight', firstPartHeight,
      '\n • fullPagePartHeight', fullPagePartHeight
    );

    // TODO 1267 -  как в таблице

    // * Calculate grid Splits Ids

    const topsArr = gridPseudoRowsTopPoints;

    let splitsIds = [];
    let currentPageBottom = firstPartHeight;

    for (let index = 0; index < topsArr.length; index++) {

      if (topsArr[index] > currentPageBottom) {

        // TODO split long TR
        // когда много диаграмм, или очень длинный текст

        if (index > this._minLeftRows) {
          // * avoid < minLeftRows rows on first page
          // *** If a table row starts in the next part,
          // *** register the previous one as the beginning of the next part.
          splitsIds.push(index - 1);
        }

        currentPageBottom = topsArr[index - 1] + fullPagePartHeight;

        // check if next fits

      }
    };

    this._debug._ && console.log('splitsIds', splitsIds);

    const insertGridSplit = (startId, endId) => {
      // * The function is called later.
      // TODO Put it in a separate method: THIS AND TABLE

      this._debug._ && console.log(`=> insertGridSplit(${startId}, ${endId})`);

      // const partEntries = nodeEntries.rows.slice(startId, endId);
      const partEntries = rowGroups
        .slice(startId, endId)
        .flat();
      this._debug._ && console.log(`partEntries`, partEntries);

      // const part = this._node.createWithFlagNoBreak();
      // ! Do not wrap nodes so as not to break styles.
      // TODO - Check for other uses of createWithFlagNoBreak to see if the wrapper can be avoided.

      const part = this._DOM.cloneNodeWrapper(node);
      this._node.copyNodeWidth(part, node);
      this._node.setFlagNoBreak(part);
      node.before(part);

      if (startId) {
        // if is not first part
        // this._DOM.insertAtEnd(part, this._node.createSignpost('(table continued)', this._signpostHeight));

        // TODO: insertions between parts will not disturb the original layout & CSS.
        // Therefore, it is possible to insert an element after and before the parts
        // and specify that the node is being broken.
      }

      // в таблице другое
      // this._DOM.insertAtEnd(
      //   part,
      //   this._node.createTable({
      //     wrapper: nodeWrapper,
      //     caption: this._DOM.cloneNode(nodeEntries.caption),
      //     thead: this._DOM.cloneNode(nodeEntries.thead),
      //     // tfoot,
      //     tbody: partEntries,
      //   }),
      //   this._node.createSignpost('(table continues on the next page)', this._signpostHeight)
      // );
      // this._DOM.insertAtEnd(part, nodeWrapper);
      this._DOM.insertAtEnd(part, ...partEntries);

      return part
    };


    const splits = [...splitsIds.map((value, index, array) => insertGridSplit(array[index - 1] || 0, value)), node]

    this._debug._ && console.log(
      'splits', splits
    );

    // create LAST PART
    // TODO ??? is that really needed?
    // const lastPart = this._node.createWithFlagNoBreak();
    // node.before(lastPart);
    // this._DOM.insertAtEnd(
    //   lastPart,
    //   // this._node.createSignpost('(table continued)', this._signpostHeight),
    //   node
    // );

    // parts handling
    splits.forEach((part, index) => this._DOM.setAttribute(part, '[part]', `${index}`));
    // LAST PART handling
    this._node.setFlagNoBreak(node);

    restorePosition();

    this._debug._ && console.log(`%c END _splitGridNode`, CONSOLE_CSS_END_LABEL);
    this._debug._ && console.groupEnd()

    return splits
  }

}
