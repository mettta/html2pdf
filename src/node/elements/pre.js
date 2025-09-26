const CONSOLE_CSS_END_LABEL = `background:#999;color:#FFF;padding: 0 4px;`;

export default class Pre {
  constructor({
    config,
    DOM,
    node,
    selector,
  }) {
    // * From config:
    this._debug = config.debugMode ? { ...config.debugConfig.pre } : {};
    // * Private
    this._DOM = DOM;
    this._selector = selector;
    this._node = node;

    // todo
    // 1) move to config
    // Code:
    this._minPreFirstBlockLines = 3;
    this._minPreLastBlockLines = 3;
    this._minPreBreakableLines = this._minPreFirstBlockLines + this._minPreLastBlockLines;

    this._imageReductionRatio = 0.8;

    // TODO make function
    // * From config:
    // - if null is set - the element is not created in createSignpost().
    this._signpostHeight = parseFloat(config.splitLabelHeight) || 0;

  }


  split(
    node,
    pageBottom,
    fullPageHeight,
    root,
    nodeComputedStyle,
  ) {
    // ['pre', 'pre-wrap', 'pre-line', 'break-spaces']

    // * If we call the function in a context where
    // * the computedStyle for a node has already been computed,
    // * it will be passed in the nodeComputedStyle variable.
    const _nodeComputedStyle = nodeComputedStyle
      ? nodeComputedStyle
      : this._DOM.getComputedStyle(node);

    const consoleMark = ['%c_splitPreNode\n', 'color:white',]
    this._debug._ && console.group('%c_splitPreNode', 'background:cyan');
    this._debug._ && console.log(...consoleMark, 'node', node, {pageBottom,fullPageHeight});

    // Prepare node parameters
    const nodeTop = this._node.getTop(node, root);
    const nodeHeight = this._DOM.getElementOffsetHeight(node);
    const nodeLineHeight = this._node.getLineHeight(node);
    // * preWrapper:
    // * Margins are not considered here, since
    // * the upper margin is considered for the first part,
    // * both margins are zeroed for the middle parts,
    // * and the lower margin will be considered in further calculations.
    const preWrapperHeight = this._node.getEmptyNodeHeight(node, '', false);

    // * Let's check the probable number of rows in the simplest case,
    // * as if the element had the style.whiteSpace=='pre'
    // * and the line would occupy exactly one line.
    const minNodeHeight = preWrapperHeight + nodeLineHeight * this._minPreBreakableLines;
    if (nodeHeight < minNodeHeight) {
      this._debug._ && console.log('%c END _splitPreNode (small node)', CONSOLE_CSS_END_LABEL);
      return []
    }

    const _children = this._DOM.getChildNodes(node);
    this._debug._ && console.log('_children:', _children.length, _children);
    if (_children.length == 0) {
      // ??? empty tag => not breakable
      this._debug._ && console.log('%c END _splitPreNode (not breakable)', CONSOLE_CSS_END_LABEL);
      return []
    } else if (_children.length > 1) {
      // ! if _children.length > 1
      // TODO check if there are NODES except text nodes
      // ! TODO
      this._debug._ && console.log('%c END _splitPreNode TODO!', CONSOLE_CSS_END_LABEL);
      return []
    } else { // * if _children.length == 1
      // * then it is a TEXT node and has only `\n` as a line breaker
      if (this._DOM.isElementNode(_children[0])) {
        // element node
        // TODO check if there are NODES except text nodes
        const currentElementNode = _children[0];
        this._debug._ && console.warn("is Element Node", currentElementNode)
        // FIXME other cases i.e. node and we need recursion
        this._debug._ && console.log('%c END _splitPreNode ???????', CONSOLE_CSS_END_LABEL);
        return []
      }
      if (this._node.isWrappedTextNode(_children[0])) {
        // if (textNode.nodeType === 3) // 3 - тип TextNode
        this._debug._ && console.warn(`is TEXT Node: ${_children[0]}`);
        // FIXME other cases i.e. node and we need recursion
      }

      // ? wholeText vs textContent
      const currentNodeText = _children[0].wholeText;

      // * split the text node into lines by \n,
      // * leaving the character \n at the end of the resulting string:
      const stringsFromNodeText = this._node.splitTextByLinesGreedy(currentNodeText);

      if (stringsFromNodeText.length < this._minPreBreakableLines) {
        this._debug._ && console.log('%c END _splitPreNode few lines', CONSOLE_CSS_END_LABEL);
        return []
      }

      // * Strings array normalization.
      // ** Get the first this._minPreFirstBlockLines elements
      // ** and concatenate them into a string
      const startString = stringsFromNodeText.splice(0, this._minPreFirstBlockLines).join('');
      // ** Get the first this._minPreLastBlockLines elements
      // ** and concatenate them into a string
      const endString = stringsFromNodeText.splice(-this._minPreLastBlockLines).join('');
      // ** Insert new rows into the array stringsFromNodeText
      stringsFromNodeText.unshift(startString);
      stringsFromNodeText.push(endString);

      // * Modifying DOM
      const linesFromNode = stringsFromNodeText.map(string => {
        const line = this._node.createWithFlagNoBreak();
        this._DOM.setInnerHTML(line, string);
        return line
      });
      this._debug._ && console.log('linesFromNode', linesFromNode);
      this._DOM.replaceNodeContentsWith(node, ...linesFromNode);

      // * calculate parts

      // TODO: make helper
      const toNum = v => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));

      // todo: #CutLineAmend
      // There is extra space at the cut lines for a border.
      // Make a decorative border and cut off the original one.
      const borderTopWidth = toNum(_nodeComputedStyle.borderTopWidth);
      const borderBottomWidth = toNum(_nodeComputedStyle.borderBottomWidth);
      const marginTop = toNum(_nodeComputedStyle.marginTop);
      const marginBottom = toNum(_nodeComputedStyle.marginBottom);
      const paddingTop = toNum(_nodeComputedStyle.paddingTop);
      const paddingBottom = toNum(_nodeComputedStyle.paddingBottom);
      const serviceCutLineBorder = 0;
      const topCutLineAmend = - borderTopWidth - marginTop + serviceCutLineBorder;
      const bottomCutLineAmend = - borderBottomWidth - marginBottom + serviceCutLineBorder;

      // ** Prepare parameters for splitters calculation.

      // * preWrapper consists of padding and a border.
      // * They are reset to serviceCutLineBorder (== 0 foe now) for the cut line.

      // * For firstPartSpace
      // * - the top margin is automatically taken into account
      // *   in the layout (outside the offset top of children),
      // * - and the bottom margin is considered in bottomCutLineAmend;
      // * - the top padding is considered ONCE for firstPartSpace for children offset;
      // * - the top border is considered ONCE for firstPartSpace;
      // * - the bottom border is considered in bottomCutLineAmend.
      // * That is why we ignore preWrapperHeight here.
      let firstPartSpace = pageBottom - nodeTop - preWrapperHeight + bottomCutLineAmend; // - preWrapperHeight
      // TODO: firstPartSpace and firstPartSpaceForSPlitting should be different.
      //! For firstPartSpace we need all margins & preWrapperHeight.
      //! For firstPartSpaceForSPlitting we only need selected amendments.


      // * For fullPageSpace,
      // * subtracting preWrapperHeight will leave space for content lines.
      // * However, we reset the cut lines (margins and borders).
      const fullPageSpace = fullPageHeight - preWrapperHeight + topCutLineAmend;

      // TODO: more accurate calculations for spaces are needed
      // --node---
      // * topMargin
      // * topBorder
      // * topPadding
      // * C-O-N-T-E-N-T
      // * bottomPadding
      // * bottomBorder
      // * bottomMargin
      // === parts: ===
      // --FIRST---
      // * topMargin
      // * topBorder
      // * topPadding
      // * C-O-N-T-E-N-T (1)
      // * bottomPadding
      //// bottomBorder
      //// bottomMargin
      // --MIDDLE--
      //// topMargin
      //// topBorder
      // * topPadding
      // * C-O-N-T-E-N-T (2)
      // * bottomPadding
      //// bottomBorder
      //// bottomMargin
      // --LAST--
      //// topMargin
      //// topBorder
      // * topPadding
      // * C-O-N-T-E-N-T (3)
      // * bottomPadding
      // * bottomBorder
      // * bottomMargin

      this._debug._ && console.log({
        pageBottom,
        nodeTop,
        preWrapperHeight,
        topCutLineAmend,
        bottomCutLineAmend,
        fullPageHeight,
      }, {
        firstPartSpace,
        fullPageSpace,
      })

      // * find starts of parts splitters

      let page = 0;
      let splitters = [];
      let floater = firstPartSpace;

      // *** need to make the getTop work with root = node
      const initPosition = _nodeComputedStyle.position;
      if (initPosition != 'relative') {
        this._DOM.setStyles(node, { position: 'relative' });
      }

      for (let index = 0; index < linesFromNode.length; index++) {
        const current = linesFromNode[index];
        const currentBottom = this._node.getBottom(current, node);
        this._debug._ && console.log(index, currentBottom);

        // TODO move to DOM
        if (currentBottom > floater) {
          this._debug._ && console.log(`start a new page: ${currentBottom} > ${floater}`, current)
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
        this._debug._ && console.log('%c END _splitPreNode NO SPLIITERS', CONSOLE_CSS_END_LABEL);
        return []
      }

      // ******** ELSE:
      // * If there are parts here, and the node will be split, continue.
      // * Render new parts.

      // * The last part end is registered automatically.
      splitters.push(null);
      this._debug._ && console.log(
        ...consoleMark,
        'splitters', splitters
      );

      const newPreElementsArray = splitters.map((id, index, splitters) => {
        // Avoid trying to break this node: createWithFlagNoBreak()
        // We can't wrap in createWithFlagNoBreak()
        // because PRE may have margins and that will affect the height of the wrapper.
        // So we will give the PRE itself this property.
        const part = this._DOM.cloneNodeWrapper(node);
        this._node.setFlagNoBreak(part);

        // id = the beginning of the next part
        const start = splitters[index - 1] || 0;
        const end = id || splitters[splitters.length];

        this._DOM.insertAtEnd(part, ...linesFromNode.slice(start, end));

        return part;
      });

      // * Mark nodes as parts
      this._node.markPartNodesWithClass(newPreElementsArray);

      this._debug._ && console.log(
        ...consoleMark,
        'newPreElementsArray',
        newPreElementsArray
      );

      //// this._DOM.insertInsteadOf(node, ...newPreElementsArray);
      // * We need to keep the original node,
      // * we may need it as a parent in this._parseNode().
      this._DOM.replaceNodeContentsWith(node, ...newPreElementsArray);
      // * We "open" the slough node, but leave it.
      this._DOM.setStyles(node, { display: 'contents' });
      this._DOM.setAttribute(node, '[slough-node]', '');
      this._DOM.removeAllClasses(node);

      this._debug._ && console.log('%c END _splitPreNode', CONSOLE_CSS_END_LABEL);
      this._debug._ && console.groupEnd();

      return newPreElementsArray;

    } // END OF * if _children.length == 1

    // TODO the same in splitTextNode - make one code piece

  }

}
