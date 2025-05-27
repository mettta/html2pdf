
/**
 * Returns a cleaned and normalized list of children for the given element.
 *
 * @relation(PAGINATION-1, scope=function)
 *
 * INTENTION: Prepare children for layout by filtering, wrapping, and flattening
 *            elements that would otherwise interfere with pagination flow.
 *
 * INPUT: A DOM element whose children should be prepared for layout analysis.
 *        Skips style, whitespace, and comment nodes.
 *        Wraps significant text nodes.
 *        Recursively unwraps elements with no offset (e.g., display: contents).
 *        Skips fixed/absolute positioned elements.
 *
 *        If the resulting children break vertical flow,
 *        they are grouped into a complexTextBlock.
 *
 * EXPECTED_RESULTS: A clean, flat array of elements ready to be laid out into pages.
 */
/**
 * @this {Node}
 */
export function getPreparedChildren(element) {
  this._debugMode && console.groupCollapsed(`getPreparedChildren of`, [element]);
  let children = [];

  // Check children:
  // TODO variants
  // TODO last child
  // TODO first Li

  // fon display:none / contents
  // this._DOM.getElementOffsetParent(currentElement)

  // TODO: to do this check more elegant
  // SEE the context here:
  // this._paragraph.split(node)
  // ...
  // const nodeChildren = this.getPreparedChildren(node);
  // * _collectAndBundleInlineElements (makes ComplexTextBlock) is running extra on complex nodes
  if (this.isComplexTextBlock(element)) {
    children = [...this._DOM.getChildren(element)];
    this._debugMode && console.info('🚸 getPreparedChildren: return children for complexTextBlock', children);
    // return children

  } else {

    children = [...this._DOM.getChildNodes(element)]
      .reduce(
        (acc, item) => {

          // * filter STYLE, use element.tagName
          if (this.isSTYLE(item)) {
            this._debugMode && console.info('🚸 (getPreparedChildren) ignore STYLE', [item]);
            return acc;
          }

          // * wrap text node, use element.nodeType
          if (this.isSignificantTextNode(item)) {
            const textNodeWrapper = this.createTextNodeWrapper();
            this._DOM.wrap(item, textNodeWrapper);
            acc.push(textNodeWrapper);
            this._debugMode && console.info('🚸 (getPreparedChildren) wrap and return TEXT NODE', [item]);
            return acc;
          }

          // * normal
          if (this._DOM.isElementNode(item)) {

            // If the element has no offset parent but is absolutely/fixed positioned,
            // keep it as-is — don't unwrap (not display: contents).
            // Only unwrap when it's likely display: contents or similar flowless container.
            const offsetParent = this._DOM.getElementOffsetParent(item);
            if (!offsetParent) {
              const computedStyle = this._DOM.getComputedStyle(item);
              const position = computedStyle?.position;
              if (position === 'absolute' || position === 'fixed') {
                // ⚠️ position: fixed/absolute elements are excluded from layout flow.
                // They are intentionally skipped and not added to children.
                this._debugMode && console.info('🚸 (getPreparedChildren) * absolute/fixed — skipped', [item]);
                return acc;
              } else {
                // Likely a flowless container (e.g., display: contents).
                // Recursively unwrap its children into the current context.
                const ch = this.getPreparedChildren(item);
                ch.length > 0 && acc.push(...ch);
                this._debugMode && console.info('%c🚸 (getPreparedChildren) * no offset parent — unwrapped', 'color:green', ch, [item]);
              }
            } else {

              acc.push(item);
              this._debugMode && console.info('🚸 (getPreparedChildren) * normal node', [item]);
            }

            return acc;
          };

          this._debugMode && console.info('%c🚸 (getPreparedChildren) IGNORE whitespace / comment ...', 'color:red', [item]);
          return acc;

        }, [])

    if (_isVerticalFlowDisrupted.call(this, children)) {
      // * If the vertical flow is disturbed and the elements are side by side:
      // *** bundle and return complexTextBlock
      this._debugMode && console.info('🚸 (getPreparedChildren) isVerticalFlowDisrupted in children of', [element]);
      children = _collectAndBundleInlineElements.call(this, children);
    }

  }

  this.logGroupEnd(`getPreparedChildren`);
  this._debugMode && console.info('🚸 getPreparedChildren:', children);
  return children;
}


/**
 * Returns pagination-ready fragments for a given DOM element.
 *
 * @relation(PAGINATION-2, scope=function)
 *
 * INTENTION: Select and apply the correct split strategy based on the element type,
 *            so it can be safely divided across pages or preserved unbroken.
 *
 * INPUT: A DOM node and pagination metrics (firstPageBottom, fullPageHeight, root).
 *        Known types (tables, pre, complex text) invoke specific split functions.
 *        Fallback to getPreparedChildren for generic cases.
 *
 * EXPECTED_RESULTS: An array of elements or fragments suitable for page layout.
 *                   Unbreakable nodes return an empty array.
 */
/**
 * @this {Node}
 */
export function getSplitChildren(node, firstPageBottom, fullPageHeight, root) {

  let children = [];

  // if (nodeMinHeight && this.isTooSmall(node, nodeMinHeight)) {
  //   this._debugMode && console.info('🤎 isTooSmall, return []', node);
  //   return children = [];
  // }

  if (this.isNoBreak(node)) {
    // don't break apart, thus keep an empty children array
    this._debugMode && console.info('🧡 isNoBreak', node);
    return children = [];

  } else if (this.isComplexTextBlock(node)) {
    this._debugMode && console.info('💚 ComplexTextBlock', node);
    return children = this._paragraph.split(node) || [];

  } else if (this.isWrappedTextNode(node)) {
    this._debugMode && console.info('💚 TextNode', node);

    return children = this._paragraph.split(node) || [];

  }

  const nodeComputedStyle = this._DOM.getComputedStyle(node);

  // ? TABLE now has conditions that overlap with PRE (except for the tag name),
  // ? so let's check it first.
  // FIXME the order of checks
  if (this.isTableLikeNode(node, nodeComputedStyle)) {
    this._debugMode && console.info('💚 TABLE like', node);
    children = this._tableLike.split(
      node,
      firstPageBottom,
      fullPageHeight,
      root,
      nodeComputedStyle,
    ) || [];

  } else if (this.isTableNode(node, nodeComputedStyle)) {
    this._debugMode && console.info('💚 TABLE', node);
    children = this._table.split(
      node,
      firstPageBottom,
      fullPageHeight,
      root,
    ) || [];

  } else if (this.isPRE(node, nodeComputedStyle)) {
    this._debugMode && console.info('💚 PRE', node);
    children = this._pre.split(
      node,
      firstPageBottom,
      fullPageHeight,
      root,
    ) || [];

  } else if (this.isGridAutoFlowRow(this._DOM.getComputedStyle(node))) {
    // ** If it is a grid element.
    // ????? Process only some modifications of grids!
    // ***** There's an inline grid check here, too.
    // ***** But since the check for inline is below and real inline children don't get here,
    // ***** it is expected that the current element is either block or actually
    // ***** behaves as a block element in the flow thanks to its content.
    this._debugMode && console.info('💜 GRID');
    children = this._grid.split(
      node,
      firstPageBottom,
      fullPageHeight,
      root,
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
    this._debugMode && console.info('💚 some node', [node]);
    children = this.getPreparedChildren(node);
  }

  return children
}

// 🔒 private

/**
 * Groups consecutive inline elements into a single complexTextBlock container.
 *
 * @relation(PAGINATION-4, scope=function)
 *
 * INTENTION: Ensure layout correctness by bundling inline siblings that appear side-by-side
 *            into a unified block-level wrapper, allowing them to be treated as a single unit during pagination.
 *
 * INPUT: An array of DOM elements, where some may be inline (e.g., <span>, <em>, etc.).
 *        Iterates through the list and wraps sequences of inline elements into a single
 *        complexTextBlock container.
 *        Block elements interrupt grouping and are added as-is.
 *
 * EXPECTED_RESULTS: Returns a new array of elements where inline runs are grouped.
 */
/**
 * @this {Node}
 */
function _collectAndBundleInlineElements(children) {

  let complexTextBlock = null;
  const newChildren = [];

  children.forEach(child => {
    if (this.isInline(this._DOM.getComputedStyle(child))) {
      if (!complexTextBlock) {
        // the first inline child
        complexTextBlock = this.createComplexTextBlock();
        this._DOM.wrap(child, complexTextBlock);
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

// ???
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
        this._DOM.wrap(child, complexTextBlock);
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
