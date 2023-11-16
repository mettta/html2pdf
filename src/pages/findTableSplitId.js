export default function findTableSplitId(
  {
    node,
    nodeEntries,
    nodeHeight,
    firstPartHeight,
    fullPagePartHeight,
    firefoxAmendment,
    minLeftRows,
    minDanglingRows,
    DOM,
    debugMode = false,
  }
) {
  debugMode && console.group('%c *** ', 'background:yellow');

  const topsArr = [
    ...nodeEntries.rows.map(
      row => DOM.getElementRootedTop(row, node) + firefoxAmendment
    ),
    DOM.getElementRootedTop(nodeEntries.tfoot, node) || nodeHeight
  ];

  debugMode && console.log('• topsArr', topsArr);

  let splitsIds = [];
  let currentPageBottom = firstPartHeight;

  for (let index = 0; index < topsArr.length; index++) {

    if (topsArr[index] > currentPageBottom) {

      // TODO split long TR

      if (index > minLeftRows) {
        // * avoid < minLeftRows rows on first page
        // *** If a table row starts in the next part,
        // *** register the previous one as the beginning of the next part.
        splitsIds.push(index - 1);
      }

      currentPageBottom = topsArr[index - 1] + fullPagePartHeight;

      // check if next fits

    }
  }

  debugMode && console.log('splitsIds', splitsIds);

  if (!splitsIds.length) {
    debugMode && console.groupEnd('%c *** ');
    return []
  }

  // * avoid < minDanglingRows rows on last page
  const maxSplittingId = (topsArr.length - 1) - minDanglingRows;
  if (splitsIds[splitsIds.length - 1] > maxSplittingId) {
    splitsIds[splitsIds.length - 1] = maxSplittingId;
  }

  debugMode && console.groupEnd('%c *** ');
  return splitsIds
}

// let splitsIds = findTableSplitId({
//   node,
//   nodeEntries,
//   nodeHeight,
//   firstPartHeight,
//   fullPagePartHeight,
//   firefoxAmendment: captionFirefoxAmendment,
//   minLeftRows: this.minLeftRows,
//   minDanglingRows: this.minDanglingRows,
//   debugMode: this.debugMode,
//   DOM: this.DOM,
// });
