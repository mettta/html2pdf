/**
 * @this {Node}
 */
export function getPreparedChildren(element) {
  if (this.isComplexTextBlock(element)) {
    return [...this._DOM.getChildren(element)];
  } else {
    let childrenArr = [...this._DOM.getChildNodes(element)]
      .reduce((acc, item) => {
        if (this.isSTYLE(item)) {
          return acc;
        }

        if (this.isSignificantTextNode(item)) {
          acc.push(this.wrapTextNode(item));
          return acc;
        }

        if (!this._DOM.getElementOffsetParent(item)) {
          const ch = this.getPreparedChildren(item);
          ch.length > 0 && acc.push(...ch);
          return acc;
        }

        if (this._DOM.isElementNode(item)) {
          acc.push(item);
          return acc;
        }
      }, []);

    if (_isVerticalFlowDisrupted.call(this, childrenArr)) {
      childrenArr = _processInlineChildren.call(this, childrenArr);
    }

    return childrenArr;
  }
}

// 🔒 private

/**
 * @this {Node}
 */
function _isVerticalFlowDisrupted(arrayOfElements) {
  return arrayOfElements.some(

    (current, currentIndex, array) => {
      const currentElement = current;
      const nextElement = array[currentIndex + 1];

      if (!nextElement) {
        return false
      };
      const isTrue = this._DOM.getElementOffsetBottom(currentElement) > this._DOM.getElementOffsetTop(nextElement);
      return isTrue;
    }
  )
}

/**
* @this {Node}
*/
function _processInlineChildren(children) {

  let complexTextBlock = null;
  const newChildren = [];

  children.forEach(child => {
    if (this.isInline(this._DOM.getComputedStyle(child))) {
      if (!complexTextBlock) {
        // the first inline child
        complexTextBlock = this.createComplexTextBlock();
        this.wrapNode(child, complexTextBlock);
        newChildren.push(complexTextBlock);
      }
      // not the first inline child
      this._DOM.insertAtEnd(complexTextBlock, child)
    } else {
      // A block child is encountered,
      // so interrupt the collection of elements in the complexTextBlock:
      complexTextBlock = null;
      newChildren.push(child);
    }
  })

  return newChildren
}
