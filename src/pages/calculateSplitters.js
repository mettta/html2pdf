export default function calculateSplitters({
  pageLines,
  nodeLines,
  firstPartLines,
  // const
  minBreakableLines,
  minLeftLines,
  minDanglingLines,
}) {

  let splitters = [];

  // check for the minimum number of lines allowed for the break
  if (nodeLines < minBreakableLines) {
    // return without a break
    return []
  }

  // check for the minimum number of lines left on the previous page
  if (firstPartLines < minLeftLines) {
    // make the first part equal to a full page,
    // i.e. we move the first part to the next page
    firstPartLines = pageLines;
  }

  function trySplit(part = 0) {
    const currentEndLine = pageLines * part + firstPartLines;
    const currentPartLines = part ? currentEndLine - pageLines * (part - 1) : firstPartLines;

    // IF the node is larger than a page
    if (nodeLines > currentEndLine) {

      // register a node break,
      splitters = [
        ...splitters,
        {
          endLine: currentEndLine,
          splitter: currentEndLine / nodeLines,
          partLines: currentPartLines,
        }
      ];

      // continue on the rest of the node
      trySplit(part + 1);

      return

    } // ELSE - LAST PART

    const lastPartLines = nodeLines - (currentEndLine - pageLines);

    // register the last part,
    // it has no specific break,
    // and further will be counted as "take the rest"
    splitters = [
      ...splitters,
      {
        endLine: null,
        splitter: null,
        partLines: lastPartLines,
      }
    ];

    return
  }

  trySplit();

  // If there is a dangling line,
  // correcting the last two parts:
  const penultimate = splitters.length - 2;
  const ultimate = splitters.length - 1;
  if (splitters[ultimate].partLines < minDanglingLines) {

    const movedLines = minDanglingLines - splitters[ultimate].partLines;

    const correctedEndLine = splitters[penultimate].endLine - movedLines;
    const correctedSplitter = correctedEndLine / nodeLines;

    // reassign:
    splitters[penultimate] = {
      endLine: correctedEndLine,
      splitter: correctedSplitter,
      partLines: splitters[penultimate].partLines - movedLines,
    }
    splitters[ultimate].partLines = splitters[ultimate].partLines + movedLines
  }

  return splitters;
}

