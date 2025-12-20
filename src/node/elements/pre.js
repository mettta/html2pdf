import * as Logging from '../../utils/logging.js';

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
    this._assert = config.consoleAssert ? true : false;
    Object.assign(this, Logging);
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

  _normalizeLinesInPlace(lines) {
    // * Strings array normalization.
    // ** Get the first this._minPreFirstBlockLines elements
    // ** and concatenate them into a string
    const startString = lines.splice(0, this._minPreFirstBlockLines).join('');
    // ** Get the first this._minPreLastBlockLines elements
    // ** and concatenate them into a string
    const endString = lines.splice(-this._minPreLastBlockLines).join('');
    // ** Insert new rows into the array lines
    lines.unshift(startString);
    lines.push(endString);
  }

  _analyzeChildren(children) {
    const has = {
      // br,
      // text,
      // wrappedText,
      // node,
      // other,
    };
    const childrenTypes = [...children].map(child => {
      const type = this._DOM.getNodeType(child);

      if (type === Node.TEXT_NODE) {
        has.text = true;
        return 'text';
      };

      if (type === Node.ELEMENT_NODE) {
        if (this._DOM.getElementTagName(child) === 'BR') {
          has.br = true;
          return 'br';
        };
        if (this._node.isWrappedTextNode(child)) {
          has.wrappedText = true;
          return 'wrappedText';
        };
        has.node = true;
        return 'node';
      }
      has.other = true;
      return 'other';
    });

    return {
      has: has,
      items: childrenTypes
    };
  }

  /**
   * Expected to be dealing with unprocessed PRE child nodes.
   * This means that we do not expect to see service wrappers there (like wrappedText).
   * We may also encounter unfiltered comments.
   */
  split(
    node,
    nodeComputedStyle,
  ) {
    // * ['pre', 'pre-wrap', 'pre-line', 'break-spaces']

    // const _nodeComputedStyle = nodeComputedStyle
    //   ? nodeComputedStyle
    //   : this._DOM.getComputedStyle(node);

    this._debug._ && console.group('%c 🔲 PRE [split]', 'background:orange', {node});
    const endSplitGroup = () => {
      this._debug._ && console.log('%c END 🔲 PRE [split]', CONSOLE_CSS_END_LABEL);
      this._debug._ && console.groupEnd()
    }

    const _children = this._DOM.getChildNodes(node); // * elements, text nodes, comments, etc.
    this._debug._ && console.log('_children:', _children.length, _children);

    if (_children.length == 0) {
      // ??? empty tag => not breakable
      this._debug._ && console.log('%c END _splitPreNode (not breakable)', CONSOLE_CSS_END_LABEL);
      endSplitGroup();
      return []
    }

    let _lines = [];

    const _childrenTypes = this._analyzeChildren(_children);
    this._debug._ && console.log('_childrenTypes:', _childrenTypes.items.length, _childrenTypes);

    this.strictAssert(!_childrenTypes.has.wrappedText, 'Expected to be dealing with unprocessed PRE child nodes, but have wrappedText!', _childrenTypes);
    this.strictAssert(!(_childrenTypes.has.text && _childrenTypes.has.wrappedText), 'PRE children has text and wrappedText simultaneously', _childrenTypes);

    if (_childrenTypes.has.br) {
      // todo: not implemented
      this._debug._ && console.warn('PRE children has BR');
    }

    if (_childrenTypes.has.node) {
      const text =  this._DOM.getInnerHTML(node);
      const lines = this._node.splitTextByLinesGreedy(text);
      _lines.push(...lines);
    } else {
      // * a TEXT node and has only `\n` as a line breaker.
      for (const child of _children) {
        if (this._DOM.isTextNode(child)) {
          const text = this._DOM.getNodeValue(child);
          const lines = this._node.splitTextByLinesGreedy(text);
          _lines.push(...lines);
          continue;
        }
        if (this._node.isWrappedTextNode(child)) {
          const text =  this._DOM.getInnerHTML(child);
          const lines = this._node.splitTextByLinesGreedy(text);
          _lines.push(...lines);
          continue;
        }
        // if (this._DOM.isElementNode(child)) {}
      }
    }

    this._debug._ && console.log('_lines:', _lines);

    if (_lines.length < this._minPreBreakableLines) {
      this._debug._ && console.log('%c END _splitPreNode few lines', CONSOLE_CSS_END_LABEL);
      endSplitGroup();
      return []
    }

    this._normalizeLinesInPlace(_lines);

    // * Modifying DOM
    const linesFromNode = _lines.map(string => {
      const line = this._node.createWithFlagNoBreak();
      this._DOM.setInnerHTML(line, string);
      return line
    });
    this._debug._ && console.log('linesFromNode', linesFromNode);
    this._DOM.replaceNodeContentsWith(node, ...linesFromNode);

    endSplitGroup();
    return linesFromNode
  }


  // old slice method, which cuts the node into pieces, currently not in use
  slice(
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

    const consoleMark = ['%c_SLICE PreNode\n', 'color:white',]
    this._debug._ && console.group('%c_✂️ slice PRE', 'background:cyan', {node, pageBottom, fullPageHeight});
    const endSliceGroup = () => {
      this._debug._ && console.log('%c END ✂️ slice PRE', CONSOLE_CSS_END_LABEL);
      this._debug._ && console.groupEnd()
    };

    // Prepare node parameters

    const toNum = v => (isNaN(parseFloat(v)) ? 0 : Math.ceil(parseFloat(v))); // TODO: make helper
    const nodeMarginTop = toNum(_nodeComputedStyle.marginTop);
    const nodeMarginBottom = toNum(_nodeComputedStyle.marginBottom);
    const nodePaddingTop = toNum(_nodeComputedStyle.paddingTop);
    const nodePaddingBottom = toNum(_nodeComputedStyle.paddingBottom);
    const nodeBorderTopWidth = toNum(_nodeComputedStyle.borderTopWidth);
    const nodeBorderBottomWidth = toNum(_nodeComputedStyle.borderBottomWidth);
    const nodeLineHeight = toNum(_nodeComputedStyle.lineHeight);
    const nodeTop = this._node.getTop(node, root);
    const nodeHeight = this._DOM.getElementOffsetHeight(node);
    // * preWrapper:
    // * Margins are not considered here, since
    // * the upper margin is considered for the first part,
    // * both margins are zeroed for the middle parts,
    // * and the lower margin will be considered in further calculations.
    const preWrapperHeight = nodePaddingTop + nodePaddingBottom + nodeBorderTopWidth + nodeBorderBottomWidth; // + nodeLineHeight;

    // * Let's check the probable number of rows in the simplest case,
    // * as if the element had the style.whiteSpace=='pre'
    // * and the line would occupy exactly one line.
    const minNodeHeight = preWrapperHeight + nodeLineHeight * this._minPreBreakableLines;
    if (nodeHeight < minNodeHeight) {
      this._debug._ && console.log('%c END ✂️ slice (small node)', CONSOLE_CSS_END_LABEL);
      endSliceGroup();
      return []
    }

    const _children = this._DOM.getChildNodes(node);
    if (_children.length == 0) {
      this._debug._ && console.log('%c END ✂️ slice (not breakable)', CONSOLE_CSS_END_LABEL);
      endSliceGroup();
      return []
    } else if (_children.length > 1) {
      // ! if _children.length > 1
      // TODO check if there are NODES except text nodes
      // ! TODO
      // ! TODO
      // ! TODO
      // ! TODO
      // ! TODO
      // ! TODO
      // ! TODO
      // ! TODO
      // ! TODO
      // ! TODO
      // ! TODO
      // ! TODO
      // ! TODO
      this._debug._ && console.log('%c END ✂️ slice TODO!', CONSOLE_CSS_END_LABEL);
      endSliceGroup();
      return []
    } else { // * if _children.length == 1
      // * then it is a TEXT node and has only `\n` as a line breaker
      if (this._DOM.isElementNode(_children[0])) {
        // element node
        // TODO check if there are NODES except text nodes
        const currentElementNode = _children[0];
        this._debug._ && console.warn("is Element Node", currentElementNode)
        // FIXME other cases i.e. node and we need recursion
        this._debug._ && console.log('%c END ✂️ slice ???????', CONSOLE_CSS_END_LABEL);
        endSliceGroup();
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
        this._debug._ && console.log('%c END ✂️ slice few lines', CONSOLE_CSS_END_LABEL);
        endSliceGroup();
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

      // todo: #CutLineAmend
      // There is extra space at the cut lines for a border.
      // Make a decorative border and cut off the original one.
      const serviceCutLineBorder = 0;
      // *** Resetting margins for cut parts => we don't need them here
      const topCutLineAmend = serviceCutLineBorder + nodeBorderTopWidth; //  + nodeMarginTop + nodeBorderTopWidth
      const bottomCutLineAmend = serviceCutLineBorder + nodeBorderBottomWidth; //  + nodeMarginBottom + nodeBorderBottomWidth

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
      let firstPartSpace = pageBottom - nodeTop - bottomCutLineAmend - preWrapperHeight;
      // TODO: firstPartSpace and firstPartSpaceForSPlitting should be different.
      //! For firstPartSpace we need all margins & preWrapperHeight.
      //! For firstPartSpaceForSPlitting we only need selected amendments.


      // * For fullPageSpace,
      // * subtracting preWrapperHeight will leave space for content lines.
      // * However, we reset the cut lines (margins and borders).
      const fullPageSpace = fullPageHeight - preWrapperHeight - topCutLineAmend;



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

        // TODO move to DOM
        if (currentBottom > floater) {
          this._debug._ && console.log(`start a new page: currentBottom (${currentBottom}) > floater(${floater})`, current)
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
        this._debug._ && console.log('%c END ✂️ slice - NO SPLIITERS', CONSOLE_CSS_END_LABEL);
        endSliceGroup();
        return []
      }

      // ******** ELSE:
      // * If there are parts here, and the node will be split, continue.
      // * Render new parts.

      // * We leave the original PRE with part of the lines up to the first splitter (not including it).
      this._debug._ && console.log(
        ...consoleMark,
        'splitters', splitters
      );


      /**
       * #original-as-first strategy for PRE slicing
       *
       * The original `<pre>` node stays in the DOM as the first slice:
       * it keeps every line from the beginning up to (but not including)
       * the first split point so existing references still point to a
       * live element. Each subsequent slice is built via `createSliceWrapper()`,
       * fed with the line range `[splitPoint, nextSplitPoint)`, and the last
       * slice uses `Infinity` as `end` to cover “until the end”. All new wrappers
       * are appended after the original and marked with `markSliceCuts()` so that
       * pagination helpers can reason about their boundaries.
       */
      const newPreElementsArray = splitters.map((splitPoint, index, splitters) => {
        const part = this._node.createSliceWrapper(node);
        const start = splitPoint;
        const end = (index === splitters.length - 1) ? (Infinity) : splitters[index + 1];
        const partEntries = linesFromNode.slice(start, end);
        this._DOM.insertAtEnd(part, ...partEntries);
        return part;
      });


      // * Mark node cut edges
      this._node.markSliceCuts([node, ...newPreElementsArray]);

      this._debug._ && console.log(
        ...consoleMark,
        'newPreElementsArray',
        newPreElementsArray
      );

      // * We need to keep the original node.
      this._DOM.insertAfter(node, ...newPreElementsArray);

      this._debug._ && console.log('%c END ✂️ slice PRE', CONSOLE_CSS_END_LABEL);
      endSliceGroup();

      return [node, ...newPreElementsArray];

    } // END OF * if _children.length == 1

    // TODO the same in splitTextNode - make one code piece

  }

}
