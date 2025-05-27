// UNUSED METHOD FROM PAGES

// import calculateSplitters from './calculateSplitters.js';
// import findSplitId from './findSplitId.js';

// // import splitArrayBySplitFlag from './splitArrayBySplitFlag.js';

// } else if (this._node.isWrappedTextNode(node)) {
//   console.info(...consoleMark,
//     '💚 TextNode', node);
//   // TODO: Compare performance of _splitComplexTextBlockIntoLines and _splitTextNode!
//   // temporarily use the less productive function.

//   // children = this._splitTextNode(node, firstPageBottom, fullPageHeight) || [];

// TODO split text with BR
// TODO split text with A (long, split) etc.

_splitTextNode(node, pageBottom, fullPageHeight) {

  // Prepare node parameters
  const nodeTop = this._node.getTop(node, this._root);
  const nodeHeight = this._DOM.getElementOffsetHeight(node);
  const nodeLineHeight = this._node.getLineHeight(node);

  // Prepare parameters for splitters calculation
  const availableSpace = pageBottom - nodeTop;

  const nodeLines = ~~(nodeHeight / nodeLineHeight);
  const pageLines = ~~(fullPageHeight / nodeLineHeight);
  const firstPartLines = ~~(availableSpace / nodeLineHeight);

  // calculate approximate splitters
  const approximateSplitters = calculateSplitters({
    nodeLines: nodeLines,
    pageLines: pageLines,
    firstPartLines: firstPartLines,
    // const
    minBreakableLines: this._minBreakableLines,
    minLeftLines: this._minLeftLines,
    minDanglingLines: this._minDanglingLines,
  });

  // this._debugMode && console.log('approximateSplitters', approximateSplitters);

  if (approximateSplitters.length < 2) {
    // this._debugMode && console.log(' ... do not break', node);
    return []
  }

  // Split this node:

  const {
    splittedNode,
    nodeWords,
    nodeWordItems,
  } = ___prepareSplittedNode(node);

  // CALCULATE exact split IDs
  const exactSplitters = approximateSplitters.map(
    ({ endLine, splitter }) =>
      splitter
        ? findSplitId({
          arr: nodeWordItems,
          floater: splitter,
          topRef: endLine * nodeLineHeight,
          getElementTop: this._DOM.getElementRelativeTop, // we are inside the 'absolute' test node
          root: this._root
        })
        : null
  );

  const splitsArr = exactSplitters.map((id, index, exactSplitters) => {
    // Avoid trying to break this node: createWithFlagNoBreak()
    const part = this._node.createWithFlagNoBreak();

    const start = exactSplitters[index - 1] || 0;
    const end = id || exactSplitters[exactSplitters.length];

    this._DOM.setInnerHTML(part, nodeWords.slice(start, end).join(WORD_JOINER) + WORD_JOINER);

    return part;
  });

  this._DOM.insertInsteadOf(splittedNode, ...splitsArr);

  return splitsArr;

  // todo
  // последняя единственная строка - как проверять?
  // смотреть, если эта НОДА - единственный или последний потомок своего родителя

};

// backup from Node

// TODO make Obj with offsetTop and use it later
function ___prepareSplittedNode(node) {
  const splittedNode = node;
  const nodeWords = this.splitTextByWordsGreedy(node);

  const nodeWordItems = nodeWords.map((item) => {
    const span = this._DOM.createElement('span');
    this._DOM.setInnerHTML(span, item + ' ');
    return span;
  })

  const testNode = this.createTestNodeFrom(node);
  this._DOM.insertAtEnd(testNode, ...nodeWordItems);
  this._DOM.insertAtEnd(node, testNode);

  return {
    splittedNode,
    nodeWords,
    nodeWordItems,
  }
}
