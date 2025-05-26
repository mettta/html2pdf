// SEE splitTextByWordsGreedyWithSpacesFilter(node) in DOM
const WORD_JOINER = '';

export default class Paragraph {
  constructor({
    config,
    DOM,
    node,
    selector,
  }) {
    // * From config:
    this._debug = config.debugMode ? { ...config.debugConfig.paragraph } : {};
    // * Private
    this._DOM = DOM;
    this._selector = selector;
    this._node = node;


    // todo
    // 1) move to config
    // Paragraph:
    this._minParagraphLeftLines = 2;
    this._minParagraphDanglingLines = 2;

    // calculate
    this._minParagraphBreakableLines = this._minParagraphLeftLines + this._minParagraphDanglingLines || 2;

  }

  split(node) {
    return this._splitComplexTextBlockIntoLines(node)
  }

  _estimateLineCount(element) {
    return Math.ceil(this._DOM.getElementOffsetHeight(element) / this._node.getLineHeight(element))
  }

  _splitComplexTextBlockIntoLines(node) {

    // TODO "complexTextBlock"

    this._debug._ && console.group('_splitComplexTextBlockIntoLines', [node]);

    if (this._node.isSelectorMatching(node, this._selector.split)) {
      // * This node has already been processed and has lines and groups of lines inside it,

      this._end(this._selector.split);
      // * so we just return those child elements:
      return this._DOM.getChildren(node);
    }

    const nodeChildren = this._node.getPreparedChildren(node);
    const extendedChildrenArray = nodeChildren.map(
      element => {
        const lineHeight = this._node.getLineHeight(element);
        const height = this._DOM.getElementOffsetHeight(element);
        const left = this._DOM.getElementOffsetLeft(element);
        const top = this._DOM.getElementOffsetTop(element);
        //// const lines = ~~(height / lineHeight);
        // * We round up to account for inline elements
        // * whose height is less than the sum of line heights.
        const lines = Math.ceil(height / lineHeight);
        const text = this._DOM.getInnerHTML(element);

        return {
          element,
          lines,
          left,
          top,
          height,
          lineHeight,
          text
        }
      }
    );
    this._debug._ && console.log(
      '\n🚸 nodeChildren',[...nodeChildren],
      '\n🚸 extendedChildrenArray',[...extendedChildrenArray]
    );

    // !!!
    // ? break it all down into lines

    // * Process the children of the block:
    const partiallyLinedChildren = extendedChildrenArray.flatMap((item) => {
      // * Break it down as needed:
      if ((item.lines > 1) && !this._node.isNoBreak(item.element)) {
        return this._breakItIntoLines(item.element); // array
      }
      // * otherwise keep the original element:
      return item.element;
    });
    this._debug._ && console.log('\n🚸🚸🚸\n partiallyLinedChildren',[...partiallyLinedChildren]);

    // * Prepare an array of arrays containing references to elements
    // * that fit into the same row:
    const groupedPartiallyLinedChildren = partiallyLinedChildren.reduce(
      (result, currentElement, currentIndex, array) => {
        if (!result) {
          result = []
        }

        // * If BR is encountered, we start a new empty line:
        if(this._DOM.getElementTagName(currentElement) === 'BR' ) {
          result.at(-1).push(currentElement);
          result.push([]); // => will be: result.at(-1).length === 0;
          this._debug._ && console.log('br; push:', currentElement);
          return result;
        }

        // * If this is the beginning, or if a new line:
        if(!result.length || this._node.isLineChanged(result.at(-1).at(-1), currentElement)) {
          result.push([currentElement]);
          this._debug._ && console.log('◼️ start new line:', currentElement);
          return result;
        }

        // TODO: isLineChanged vs isLineKept: можно сделать else? они противоположны
        if(
          result.at(-1).length === 0 // the last element was BR
          || (result.length && this._node.isLineKept(result.at(-1).at(-1), currentElement))
        ) {
          this._debug._ && console.log('⬆ add to line:', currentElement);
          result.at(-1).push(currentElement);
          return result;
        }

        this._debug._ && console.assert(
            true,
            'groupedPartiallyLinedChildren: An unexpected case of splitting a complex paragraph into lines.',
            '\nOn the element:',
            currentElement
        );
      }, []
    );

    this._debug._ && console.log(
      '🟡🟡🟡 groupedPartiallyLinedChildren \n',
      groupedPartiallyLinedChildren.length,
      [...groupedPartiallyLinedChildren]
    );

    // Consider the paragraph partitioning settings:
    // * this._minParagraphBreakableLines
    // * this._minParagraphLeftLines
    // * this._minParagraphDanglingLines

    if (groupedPartiallyLinedChildren.length < this._minParagraphBreakableLines) {
      this._debug._ && console.log(
          'groupedPartiallyLinedChildren.length < this._minParagraphBreakableLines',
          groupedPartiallyLinedChildren.length, '<', this._minParagraphBreakableLines
        );

      this._end('NOT _splitComplexTextBlockIntoLines');
      // Not to break it up
      return []
    }

    const firstUnbreakablePart = groupedPartiallyLinedChildren.slice(0, this._minParagraphLeftLines).flat();
    const lastUnbreakablePart = groupedPartiallyLinedChildren.slice(-this._minParagraphDanglingLines).flat();
    this._debug._ && console.log(
      'groupedPartiallyLinedChildren', [...groupedPartiallyLinedChildren],
      '\n', 'minLeftLines =', this._minParagraphLeftLines,
      '\n', firstUnbreakablePart,
      '\n', 'minDanglingLines =', this._minParagraphDanglingLines,
      '\n', lastUnbreakablePart
    );
    groupedPartiallyLinedChildren.splice(0, this._minParagraphLeftLines, firstUnbreakablePart);
    groupedPartiallyLinedChildren.splice(-this._minParagraphDanglingLines, this._minParagraphDanglingLines, lastUnbreakablePart);

    // * Then collect the resulting children into rows
    // * which are not to be split further.
    const linedChildren = groupedPartiallyLinedChildren.map(
      (arr, index) => {
        // * Create a new line
        let newLine;

        // const line = this._node.createWithFlagNoBreak();
        // (arr.length > 1) && line.classList.add('group🛗');
        // line.setAttribute('role', 'group〰️');

        if (arr.length == 0) {
          newLine = arr[0];
          newLine.setAttribute('role', '🚫');
          console.assert(arr.length == 0, 'The string cannot be empty (_splitComplexTextBlockIntoLines)')
        } else if (arr.length == 1) {
          newLine = arr[0];
        } else {
          const group = this._node.createTextGroup();
          newLine = group;
          // * Replace the array of elements with a line
          // * that contains all these elements:
          this._DOM.insertBefore(arr[0], newLine);
          this._DOM.insertAtEnd(newLine, ...arr);
        }
        newLine.dataset.child = index;

        // * Return a new unbreakable line.
        return newLine;
      }
    );

    this._end('OK _splitComplexTextBlockIntoLines');

    this._DOM.setAttribute(node, this._selector.split);

    return linedChildren
  }

  _breakItIntoLines(splittedItem) {
    // return splittedItem
    // *** item.lines > 1 && !this._node.isNoBreak
    this._debug._ && console.group('_breakItIntoLines', [splittedItem]);

    // *** over-checking
    if (this._node.isNoBreak(splittedItem)) {
      this._end('isNoBreak');
      return splittedItem
    }

    // * TEXT NODE
    if (this._node.isWrappedTextNode(splittedItem)) {
      const newLines =  this._breakWrappedTextNodeIntoLines(splittedItem);
      this._end('TextNode newLines');
      return newLines
    }

    // * INLINE NODE
    this._end('(recursive _breakItIntoLines)');
    return this._processNestedInlineElements(splittedItem);
  }

  _processNestedInlineElements(node) {
    this._debug._ && console.group('_processNestedInlineElements', [node]);
    const preparedChildren = this._getNestedInlineChildren(node);
    const linedChildren = preparedChildren.flatMap(child => {
      return (this._estimateLineCount(child) > 1) ? this._breakItIntoLines(child) : child;
    });
    const splitters = this._findNewLineStarts(linedChildren);

    const parts = splitters.map((splitter, i) => {
      const startElement = linedChildren[splitter];
      const endElement = linedChildren[splitters[i + 1]];
      return this._cloneAndCleanOutsideRange(node, startElement, endElement);
    });
    this._DOM.insertInsteadOf(node, ...parts);

    this._end('Nested Inline parts');
    return parts;
  }

  _cloneAndCleanOutsideRange(root, startElement, endElement) {
    startElement && startElement.setAttribute('split', `start`);
    endElement && endElement.setAttribute('split', `end`);
    let clone = root.cloneNode(true);

    // Delete elements before startPoint (if startPoint is not the first)
    if (startElement) {
      // * remove siblings to left
      let startEl = clone.querySelector(`[split="start"]`);
      let prev = startEl.previousElementSibling;
      while (prev) {
        let toRemove = prev;
        prev = prev.previousElementSibling;
        toRemove.remove();
      }
      // * remove ancestors outside range
      let ancestor = startEl.parentElement;
      while (ancestor && ancestor !== root) {
        let sibling = ancestor.previousElementSibling;
        while (sibling) {
          let toRemove = sibling;
          sibling = sibling.previousElementSibling;
          toRemove.remove();
        }
        ancestor = ancestor.parentElement;
      }
      startEl.removeAttribute('split'); // * Clear attribute
    }

    // Delete elements after and including endPoint (if endPoint is not the last)
    if (endElement) {
      // * remove siblings to right and element
      let endEl = clone.querySelector(`[split="end"]`);
      let next = endEl.nextElementSibling;
      while (next) {
        let toRemove = next;
        next = next.nextElementSibling;
        toRemove.remove();
      }
      // * remove ancestors outside range
      let ancestor = endEl.parentElement;
      while (ancestor && ancestor !== root) {
        let sibling = ancestor.nextElementSibling;
        while (sibling) {
          let toRemove = sibling;
          sibling = sibling.nextElementSibling;
          toRemove.remove();
        }
        ancestor = ancestor.parentElement;
      }
      endEl.remove(); // * remove end element
    }
    // * Clear attributes
    startElement && startElement.removeAttribute('split');
    endElement && endElement.removeAttribute('split');
    return clone;
  }

  _getNestedInlineChildren(element) {
    let nestedInlineChildren = [...this._DOM.getChildNodes(element)]
    .reduce(
      (acc, item) => {

        // * wrap text node, use element.nodeType
        if (this._node.isSignificantTextNode(item)) {
          const textNodeWrapper = this._node.createTextNodeWrapper();
          this._DOM.wrap(item, textNodeWrapper);
          acc.push(textNodeWrapper); // TODO

          return acc;
        }

        // * no offset parent (contains) -> _node.getPreparedChildren
        if (!this._DOM.getElementOffsetParent(item)) {
          const ch = this._node.getPreparedChildren(item);
          ch.length > 0 && acc.push(...ch);
          return acc;
        }

        // * normal -> _getNestedInlineChildren
        if (this._DOM.isElementNode(item)) {
          const innerChildren = this._getNestedInlineChildren(item);
          innerChildren.forEach(item => acc.push(item))
          return acc;
        };

      }, [])

  return nestedInlineChildren;
  }

  _makeWordsFromTextNode(splittingTextNode) {
    // Split the splittingTextNode into <html2pdf-word>.

    // * array with words:
    const wordArray = this._node.splitByWordsGreedy(splittingTextNode);
    this._debug._ && console.log('wordArray', wordArray);

    // * array with words wrapped with the inline tag 'html2pdf-word':
    const wrappedWordArray = wordArray.map((item, index) => {
      return this._node.createWord(item + WORD_JOINER, index);
    });
    this._debug._ && console.log('wrappedWordArray', wrappedWordArray);

    return {wordArray, wrappedWordArray}
  }

  // _splitTextNodeIntoWords

  _breakWrappedTextNodeIntoLines(splittedItem) {
    splittedItem.classList.add('🔠_breakItIntoLines');

    const {
      wordArray,
      wrappedWordArray,
    } = this._makeWordsFromTextNode(splittedItem);

    // Replacing the contents of the splittedItem with a span sequence:
    // splittedItem.innerHTML = '';
    this._DOM.setInnerHTML(splittedItem, '');
    this._DOM.insertAtEnd(splittedItem, ...wrappedWordArray);
    // this._DOM.insertInsteadOf(splittedItem, ...wrappedWordArray);

    // Split the splittedItem into lines.
    // Let's find the elements that start a new line.
    const beginnerNumbers = this._findNewLineStarts(wrappedWordArray);

    // Create the needed number of lines,
    // fill them with text from wordArray, relying on the data from beginnerNumbers,
    // and replace splittedItem with these lines:
    // * insert new lines before the source element,
    const newLines = beginnerNumbers.reduce(
      (result, currentElement, currentIndex) => {
        const line = this._node.createTextLine();

        const start = beginnerNumbers[currentIndex];
        const end = beginnerNumbers[currentIndex + 1];
        // FIXME
        // ? need to add safety spaces at both ends of the line:
        // const text = ' ' + wordArray.slice(start, end).join(WORD_JOINER) + WORD_JOINER + ' ';
        const text = wordArray.slice(start, end).join(WORD_JOINER) + WORD_JOINER;
        this._DOM.setInnerHTML(line, text);
        this._DOM.insertBefore(splittedItem, line);

        result.push(line);
        return result;
      }, []);

    // * and then delete the source element.
    splittedItem.remove();
    return newLines;
  }

  _findNewLineStarts(wrappedWordsArray) {
    // Split the splittedItem into lines.
    // Let's find the elements that start a new line.
    const newLineStartNumbers = wrappedWordsArray.reduce(
      (result, currentWord, currentIndex) => {
        if (currentIndex > 0 && (wrappedWordsArray[currentIndex - 1].offsetTop + wrappedWordsArray[currentIndex - 1].offsetHeight) <= currentWord.offsetTop) {
          result.push(currentIndex);
        }
        return result;
      }, [0]
    );
    return newLineStartNumbers
  }

  // ***

  _end(string) {
    const CONSOLE_CSS_END_LABEL = `background:#eee;color:#888;padding: 0 1px 0 0;`; //  font-size:smaller
    this._debug._ && console.log(`%c ▲ ${string} `, CONSOLE_CSS_END_LABEL);
    this._debug._ && console.groupEnd();
  }
}
