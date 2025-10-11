export default class TableLike {
  constructor({
    config,
    DOM,
    node,
    selector,
  }) {

    // * From config:
    this._debug = config.debugMode ? { ...config.debugConfig.tableLike } : {};
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

  split(node, pageBottom, fullPageHeight, root, nodeComputedStyle,) {
    // FF has page breaks has no effect inside internal table elements.
    // So such a node will have to be split like a table.

    // todo improve partitioning:
    // now we split by rows,
    // without regard to the content or height of the rows

    // * If we call the function in a context where
    // * the computedStyle for a node has already been computed,
    // * it will be passed in the nodeComputedStyle variable.
    const _nodeComputedStyle = nodeComputedStyle
      ? nodeComputedStyle
      : this._DOM.getComputedStyle(node);

    this._debug._ && console.log('root', root);

    const sortOfLines = this._node.getPreparedChildren(node);

    const nodeTop = this._node.getTop(node, root);
    const nodeWrapperHeight = this._node.getEmptyNodeHeightByProbe(node);

    // ** Prepare parameters for splitters calculation
    const firstPartSpace = pageBottom - nodeTop - nodeWrapperHeight;
    const fullPageSpace = fullPageHeight - nodeWrapperHeight;

    let distributedRows = sortOfLines; // todo?

    // todo common way to split (pre?) // 1042

    // * find starts of parts splitters

    let page = 0;
    let splitters = [];
    let floater = firstPartSpace;

    // *** need to make the getTop work with root = node
    const initPosition = _nodeComputedStyle.position;
    if (initPosition != 'relative') {
      this._DOM.setStyles(node, { position: 'relative' });
    }

    for (let index = 0; index < distributedRows.length; index++) {
      const current = distributedRows[index];
      const currentBottom = this._node.getBottom(current, node);

      // TODO move to DOM
      if (currentBottom > floater) {
        // * start a new part at [index]
        index && splitters.push(index);
        // ? start a new page
        index && (page += 1);
        // * move the floater down:
        // ** if this is the very first element,
        // ** we just assume that the first part can take up the whole page.
        floater = index ? this._node.getTop(current, node) + fullPageSpace : fullPageSpace;
      } // end for
    }

    // *** need to revert back to the original positioning of the node
    this._DOM.setStyles(node, { position: initPosition });

    if(!splitters.length) {
      // ** if there is no partitioning, we return an empty array
      // ** and the original node will be taken in its entirety.
      this._debug._ && console.log('splitters.length', splitters.length)
      return []
    }

    // ******** ELSE:
    // * If there are parts here, and the node will be split, continue.
    // * Render new parts.

    // * The last part end is registered automatically.
    splitters.push(null);

    const newPreElementsArray = splitters.map((id, index, splitters) => {
      // Avoid trying to break this node: createWithFlagNoBreak()
      // We can't wrap in createWithFlagNoBreak()
      // because PRE may have margins and that will affect the height of the wrapper.
      // So we will give the PRE itself this property.
      const part = this._DOM.cloneNodeWrapper(node);
      this._node.setFlagNoBreak(part);
      // TODO make the same with other split nodes
      this._node.unmarkPageStartElement(part);

      // id = the beginning of the next part
      const start = splitters[index - 1] || 0;
      const end = id || splitters[splitters.length];

      this._DOM.insertAtEnd(part, ...distributedRows.slice(start, end));

      return part;
    });

    // * Mark nodes as parts
    this._node.markSliceCuts(newPreElementsArray);

    // * We need to keep the original node,
    // * we may need it as a parent in this._parseNode().
    this._DOM.replaceNodeContentsWith(node, ...newPreElementsArray);
    // * We "open" the slough node, but leave it.
    this._DOM.removeAllClasses(node);
    // this._DOM.removeAllAttributes(node);
    this._DOM.removeAllStyles(node);
    this._DOM.setStyles(node, { display:'contents' });
    this._DOM.setAttribute(node, '[slough-node]', '')

    return newPreElementsArray;


    // return this._node.getPreparedChildren(node);
  }


}
