export default function findSplitId({ arr, floater, topRef, getElementTop, root }) {

  const lookRight = (currId, currTop) => {
    const rightId = currId + 1;
    const right = arr[rightId];
    const rightTop = getElementTop(right, root);

    // if the current word and the next one are on different lines,
    // and the next one is on the correct line,
    // then it starts the correct line
    if (currTop < rightTop && rightTop >= topRef) {
      return rightId;
    }

    // otherwise we move to the right
    return lookRight(rightId, rightTop);
  }

  const lookLeft = (currId, currTop) => {
    const leftId = currId - 1;
    const left = arr[leftId];
    const leftTop = getElementTop(left, root);

    // if the current word and the previous one are on different lines,
    // and the current one is on the correct line,
    // then it starts the correct line
    if (leftTop < currTop && currTop >= topRef) {
      return currId
    }

    // otherwise we move to the left
    return lookLeft(leftId, leftTop);
  }

  const tryId = ~~(arr.length * floater);
  const tryTop = getElementTop(arr[tryId], root);

  if (tryTop < topRef) {
    // IF we are to the left of the breaking point (i.e. above)
    return lookRight(tryId, tryTop)
  } else {
    // IF we are to the right of the break point (i.e. below)
    return lookLeft(tryId, tryTop)
  }
}
