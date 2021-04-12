// topsArr and table structure:
// -- ID = 0 [ first row top ]
//    table row content
// -- ID = 1 [ second row top ]
//    table row content
// -> ID = 2 [ third row top ]
//    table row content
// -- ID = 3 [ forth row top ]
//    table row content
//     ...
//     ...
// -- ID = topsArr.length - 4 [ last-2 row top ]
//    table row content
// -> ID = topsArr.length - 3 [ last-1 row top ]
//    table row content
// -- ID = topsArr.length - 2 [ last row top ]
//    table row content
// -- ID = topsArr.length - 1 [ bottom of the table ]

export default function calculateTableSplits({
  topsArr,
  firstPartHeight,
  fullPagePartHeight,
  // const
  minLeftRows,
  minDanglingRows,
}) {

  console.log('firstPartHeight', firstPartHeight);

  let splits = [];
  let currentPageBottom = firstPartHeight;

  for (let index = 0; index < topsArr.length; index++) {

    if (topsArr[index] > currentPageBottom) {

      if (index > minLeftRows) {
        // avoid < minLeftRows rows on first page
        splits.push(index - 1);
      }

      currentPageBottom += fullPagePartHeight;
    }
  }

  // avoid < minDanglingRows rows on last page
  const maxSplittingId = (topsArr.length - 1) - minDanglingRows;
  if (splits[splits.length - 1] > maxSplittingId) {
    splits[splits.length - 1] = maxSplittingId;
  }

  return splits;
}
