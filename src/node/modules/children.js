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

/**
 * @this {Node}
 */
export function getProcessedChildren(node, firstPageBottom, fullPageHeight) {
    const consoleMark = ['%c_getProcessedChildren\n', 'color:white',];

    let children = [];

    if (this.isNoBreak(node)) {
      // don't break apart, thus keep an empty children array
      this._debugMode && console.info(...consoleMark,
        '🧡 isNoBreak', node);
      return children = [];

    } else if (this.isComplexTextBlock(node)) {
      this._debugMode && console.info(...consoleMark,
        '💚 ComplexTextBlock', node);
      return children = this._paragraph.split(node) || [];

    } else if (this.isWrappedTextNode(node)) {
      this._debugMode && console.info(...consoleMark,
        '💚 TextNode', node);

      return children = this._paragraph.split(node) || [];

    }

    const nodeComputedStyle = this._DOM.getComputedStyle(node);

    // ? TABLE now has conditions that overlap with PRE (except for the tag name),
    // ? so let's check it first.
    // FIXME the order of checks
    if (this.isTableLikeNode(node, nodeComputedStyle)) {
      this._debugMode && console.info(...consoleMark,
        '💚 TABLE like', node);
      children = this._tableLike.split(
        node,
        firstPageBottom,
        fullPageHeight,
        nodeComputedStyle
      ) || [];

    } else if (this.isTableNode(node, nodeComputedStyle)) {
      this._debugMode && console.info(...consoleMark,
        '💚 TABLE', node);
      children = this._table.split(
        node,
        firstPageBottom,
        fullPageHeight,
        // nodeComputedStyle
      ) || [];

    } else if (this.isPRE(node, nodeComputedStyle)) {
      this._debugMode && console.info(...consoleMark,
        '💚 PRE', node);
      children = this._pre.split(
        node,
        firstPageBottom,
        fullPageHeight,
      ) || [];

    } else if (this.isGridAutoFlowRow(this._DOM.getComputedStyle(node))) {
      // ** If it is a grid element.
      // ????? Process only some modifications of grids!
      // ***** There's an inline grid check here, too.
      // ***** But since the check for inline is below and real inline children don't get here,
      // ***** it is expected that the current element is either block or actually
      // ***** behaves as a block element in the flow thanks to its content.
      this._debugMode && console.info(...consoleMark,
        '💜 GRID');
      children = this._grid.split(
        node,
        firstPageBottom,
        fullPageHeight
      ) || [];


      // TODO LI: если в LI есть UL, маркер может оставаться на прежней странице - см. скрин в телеге.
      // } else if (this.isLiNode(node)) {
      //   // todo
      //   // now make all except UL unbreakable
      //   const liChildren = this.getPreparedChildren(node)
      //     .reduce((acc, child) => {
      //       if (this._DOM.getElementTagName(child) === 'UL') {
      //         acc.push(child);
      //       } else {
      //         // TODO сразу собирать в нейтральный объект
      //         // и проверить display contents!! чтобы брать положение, но отключать стили и влияние на другие
      //         if (acc[acc.length - 1]?.length) {
      //           acc[acc.length - 1].push(child);
      //         } else {
      //           acc.push([child]);
      //         }
      //       }
      //       return acc
      //     }, []);

    } else {
      this._debugMode && console.info(...consoleMark,
        '💚 some node', node);
      children = this.getPreparedChildren(node);

      this._debugMode && console.info(
        ...consoleMark,
        '🚸 get element children ',
        children
      );
    }

    return children
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
