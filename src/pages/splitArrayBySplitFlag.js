// * Splits nested structures by the split flag,
// * keeping parent objects nested,
// * similar to how HTML tags work.

export default function splitArrayBySplitFlag(inputArray) {

  // {
  //   id,
  //   element,
  //   children: [],
  //   split: true | false/undefined,
  // }

  console.log('💝 inputArray', inputArray)

  // * init:
  const result = [];
  let resultBookmark = result; // current container
  let wrapper = [];
  let wrapperBookmark = wrapper; // innermost wrapper

  // * functions:
  function processObject(obj, index, array) {
    const hasChildren = obj.children.length > 0;
    const hasSplitFlag = obj.split;
    const id = obj.id;

    if(hasSplitFlag) {
      // start new array
      const newWrappers = createTreeFromFlatArray(wrapper);
    }

    if(hasChildren) {
      result.push(obj);
      resultBookmark = obj;
      wrapper.push(obj);
    }



    // if (obj.split) {
    //   if (currentResultArray.length > 0) {
    //     result.push(currentResultArray);
    //     currentResultArray = [];
    //   }
    //   result.push([{ ...obj }]);
    // } else {
    //   const newObj = { ...obj };
    //   if (newObj.children) {
    //     newObj.children = newObj.children.map(childObj => processObject(childObj, []));
    //   }
    //   currentResultArray.push(newObj);
    // }
    // return currentResultArray;
  }


  // for (let i = 0; i < children.length; i++) {

  // }



  return result;
}

function createTreeFromFlatArray(array) {
  const tree = [];
  let last = tree;

  for(let i = 0; i < array.length; i++) {
    const element = array[i];
    last.children = [element];
    last = element;
  }

  return tree
}
