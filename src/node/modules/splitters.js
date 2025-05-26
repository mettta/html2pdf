// TEXT SPLITTING METHODS

/**
 * @this {Node}
 */
// TODO make Obj with offsetTop and use it later
export function prepareSplittedNode(node) {
  const splittedNode = node;
  const nodeWords = this.splitByWordsGreedy(node);

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

/**
 * @this {Node}
 */
export function splitTextByLinesGreedy(string) {
  const arr = string.split(/(?<=\n)/); // JOINER = '';
  return arr
}

/**
* @this {Node}
*/
export function splitByWordsGreedy(node) { // ? in prepareSplittedNode
  const text = this._DOM.getNodeValue(node) || this._DOM.getInnerHTML(node);
  // SEE Pages: const WORD_JOINER
  const arr = text.split(/(?<=\s|-)/); // WORD_JOINER = '';
  // const arr = node.innerHTML.split(/(?<=\s|-)/); // WORD_JOINER = '';
  // const arr = node.innerHTML.split(/\s+/); // WORD_JOINER = ' ';
  // console.log('🔴', arr)
  return arr
}

/**
* @this {Node}
*/
export function splitByWordsGreedyWithSpacesFilter(node) {
  const text = this._DOM.getNodeValue(node) || this._DOM.getInnerHTML(node);
  // SEE Pages: const WORD_JOINER
  // ** 1 ** add trim() for trailing spaces
  const arr = text.trim().split(/(?<=\s|-)/); // WORD_JOINER = '';
  // const arr = node.innerHTML.trim().split(/(?<=\s|-)/); // WORD_JOINER = '';
  // ** 2 ** filter arr and remove unnecessary spaces (' ') inside text block.
  // ** A meaningful space character has been added to an array element.
  const filteredArr = arr.filter(item => item != ' ');
  // console.log('🔴 filtered word Arr', filteredArr)
  return filteredArr
}
