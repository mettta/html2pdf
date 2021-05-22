import calculateSplitters from './calculateSplitters';
import findSplitId from './findSplitId';

export default class Pages {

  constructor({
    DOM,
    contentFlow,
    referenceWidth,
    referenceHeight
  }) {

    this.DOM = DOM;
    this.contentFlow = contentFlow;
    this.referenceWidth = referenceWidth;
    this.referenceHeight = referenceHeight;

    // todo
    // 1) move to config
    // Paragraph:
    this.minLeftLines = 2;
    this.minDanglingLines = 2;
    this.minBreakableLines = this.minLeftLines + this.minDanglingLines;
    // Table:
    this.minLeftRows = 2;
    this.minDanglingRows = 2;
    this.minBreakableRows = this.minLeftRows + this.minDanglingRows;
    // Code:
    this.minPreFirstBlockLines = 3;
    this.minPreLastBlockLines = 3;
    this.minPreBreakableLines = this.minPreFirstBlockLines + this.minPreLastBlockLines;

    this.imageReductionRatio = 0.8;

    // TODO move to config
    this.signpostHeight = 24;

    this.pages = [];
  }

  calculate() {
    this._calculate();
    return this.pages;
  }

  _calculate() {

    // IF contentFlow is less than one page,

    if (this.DOM.getElementHeight(this.contentFlow) < this.referenceHeight) {
      // register a single page
      this._registerPageStart(this.contentFlow);
      return;
    }

    // ELSE:

    const content = this._getChildren(this.contentFlow);

    // TODO put this into main calculations?
    // FIRST ELEMENT: register the beginning of the first page.
    this._registerPageStart(content[0]);

    this._parseNodes({
      array: content
    });
  }

  _registerPageStart(pageStart) {
    this.pages.push({
      pageStart: pageStart,
    })
  }

  _parseNodes({
    array,
    previous,
    next
  }) {

    for (let i = 0; i < array.length; i++) {

      this._parseNode({
        previousElement: array[i - 1] || previous,
        currentElement: array[i],
        nextElement: array[i + 1] || next,
      });
    }
  }

  _parseNode({
    previousElement,
    currentElement,
    nextElement,
  }) {

    // THE END:
    if (!nextElement) {
      return
    }

    // TODO
    // offsetParent: div#printTHIS
    // if relative? -> offsetParent + offsetThis

    // TODO
    // this.DOM.getElementTop(pageStart)???????
    // this.pages[this.pages.length - 1].pageStart

    // const lastElem = this.pages[this.pages.length - 1].pageEnd;
    // const flowCutPoint = lastElem ? this.DOM.getElementBottom(lastElem) : 0;
    // const newPageBottom = flowCutPoint + this.referenceHeight;

    const lastPageStart = this.pages[this.pages.length - 1].pageStart;
    const flowCutPoint = lastPageStart ? this.DOM.getElementTop(lastPageStart) : 0;
    const newPageBottom = flowCutPoint + this.referenceHeight;

    if (this.DOM.isForcedPageBreak(currentElement)) {
      this._registerPageStart(nextElement)
      return
    }

    // IF nextElement does not start on the current page,
    // we should check if the current one fits in the page,
    // because it could be because of the margin
    // TODO if next elem is SVG it has no offset Top!
    if (this.DOM.getElementTop(nextElement) > newPageBottom) {

      // console.log(
      //   '\n previousElement:', previousElement,
      //   '\n currentElement:', currentElement,
      //   '\n nextElement:', nextElement,
      //   // '\n newPageBottom', newPageBottom,
      //   // '\n elBot', this.DOM.getElementBottom(currentElement),
      // );

      // Here nextElement is a candidate to start a new page,
      // and currentElement is a candidate
      // (1) EITHER to end the current page (being taken as a whole or being splitted)
      // (2) OR to start a new page.
      // Check the possibility of (1).
      if (this._canNotBeLast(currentElement)) {
        // if currentElement can't be the last element on the page,
        // immediately move it to the next page:
        this._registerPageStart(currentElement);
        return
      }

      // IMAGE with optional resizing
      // TODO float images

      if (this._isSVG(currentElement) || this._isIMG(currentElement)) {

        // TODO needs testing

        // svg has not offset props
        const currentImage = this._isSVG(currentElement)
          ? this.DOM.wrapWithPrintNoBreak(currentElement)
          : currentElement;

        const availableSpace = newPageBottom - this.DOM.getElementTop(currentImage);
        const currentImageHeight = this.DOM.getElementHeight(currentImage);
        const currentImageWidth = this.DOM.getElementWidth(currentImage);

        // TODO !!! page width overflow for SVG
        if (currentImageHeight < this.referenceWidth) {
          // just leave it on the current page
          console.warn('%c IMAGE is too wide', 'color: red');
        }

        // if it fits
        if (currentImageHeight < availableSpace) {
          // just leave it on the current page
          this._registerPageStart(nextElement);
          return
        }

        // if not, try to fit it
        const ratio = availableSpace / currentImageHeight;

        if (ratio > this.imageReductionRatio) {
          // leave it on the current page
          this._registerPageStart(nextElement);
          // and reduce it a bit
          this.DOM.fitElementWithinBoundaries({
            element: currentElement,
            height: currentImageHeight,
            width: currentImageWidth,
            vspace: availableSpace,
            hspace: this.referenceWidth
          });
          return
        }

        // otherwise move it to next page,
        this._registerPageStart(currentImage);
        // and avoid page overflow if the picture is too big to fit on the page as a whole
        if (currentImageHeight > this.referenceHeight) {
          this.DOM.fitElementWithinBoundaries({
            element: currentElement,
            height: currentImageHeight,
            width: currentImageWidth,
            vspace: this.referenceHeight,
            hspace: this.referenceWidth
          });
        }
        return
      }

      // TODO check BOTTOMS??? vs MARGINS
      // IF currentElement does fit
      // in the remaining space on the page,
      if (this.DOM.getElementBottom(currentElement) <= newPageBottom) {
        // we need <= because splitted elements often get equal height // todo comment 
        console.log('%c -- check BOTTOM of', 'color:yellow', currentElement);
        this._registerPageStart(nextElement);
        return
      }

      // otherwise try to break it and loop the children:
      let children = [];

      if (this.DOM.isNoBreak(currentElement) || this._notSolved(currentElement)) {
        // don't break apart, thus keep an empty children array
        children = [];
      } else if (this._isTextNode(currentElement)) {
        children = this._splitTextNode(currentElement, newPageBottom) || [];
      } else if (this._isPRE(currentElement)) {
        children = this._splitPreNode(currentElement, newPageBottom) || [];
      } else if (this._isTableNode(currentElement)) {
        children = this._splitTableNode(currentElement, newPageBottom) || [];
      } else {
        children = this._getChildren(currentElement);
      }


      // parse children
      if (children.length) {
        // Process children if exist:
        this._parseNodes({
          array: children,
          previous: previousElement,
          next: nextElement
        })
      } else {
        // If no children, move element to the next page.
        // But,
        if (this._canNotBeLast(previousElement)) {
          // if previousElement can't be the last element on the page,
          // move it to the next page.
          this._registerPageStart(previousElement)
        } else {
          this._registerPageStart(currentElement)
        }
      }

    }
    // IF currentElement fits, continue.
  }

  _canNotBeLast(element) {

    // TODO
    // if Header is only child of element

    const tag = this.DOM.getElementTagName(element);
    return (
      tag === 'H1'
      || tag === 'H2'
      || tag === 'H3'
      || tag === 'H4'
      || tag === 'H5'
      || tag === 'H6'
    )
    //nodeName
  }

  _isPRE(element) {
    return this.DOM.getElementTagName(element) === 'PRE'
  }
  _isIMG(element) {
    return this.DOM.getElementTagName(element) === 'IMG'
  }
  _isSVG(element) {
    return this.DOM.getElementTagName(element) === 'svg'
  }

  // TODO
  // - если не разбиваемый и его высота больше чем страница - уменьшать

  // HELPERS

  _splitPreNode(node, pageBottom) {

    console.log('PRE', node);

    // TODO the same in splitTextNode - make one code piece

    // TODO try first split the PRE by \n\n
    // and then split solid PRE by lines

    // TODO check if there are NODES except text nodes

    // Prepare node parameters
    const nodeTop = this.DOM.getElementTop(node);
    const nodeHeight = this.DOM.getElementHeight(node);
    const nodeLineHeight = this.DOM.getLineHeight(node);
    const preWrapperHeight = this.DOM.getEmptyNodeHeight(node);
    const totalLines = (nodeHeight - preWrapperHeight) / nodeLineHeight;

    if (totalLines < this.minPreBreakableLines) {
      this._registerPageStart(node);
      return
    }

    // Prepare parameters for splitters calculation
    let availableSpace = pageBottom - nodeTop - preWrapperHeight;
    const pageSpace = this.referenceHeight - preWrapperHeight;

    let firstPartLines = Math.trunc(availableSpace / nodeLineHeight);
    const linesPerPage = Math.trunc(pageSpace / nodeLineHeight);

    if (firstPartLines < this.minPreFirstBlockLines) {
      console.log('availableSpace is too small');
      availableSpace = this.referenceHeight;
      firstPartLines = linesPerPage;
    }

    const restLines = totalLines - firstPartLines;

    const fullPages = Math.floor(restLines / linesPerPage);
    const lastPartLines = restLines % linesPerPage;

    if (lastPartLines < this.minPreLastBlockLines) {
      firstPartLines = firstPartLines - (this.minPreLastBlockLines - lastPartLines);
    }

    // *** try split by blocks
    // TODO <br>

    // TODO
    // const linesJoiner = '\n';
    // const blocksJoiner = '\n\n';

    // correction for line break, not affecting the block view, but affecting the calculations
    let preText = this.DOM.getInnerHTML(node);
    if (preText.charAt(preText.length - 1) === '\n') {
      // console.log('LAST CHAR IS BREAK');
      preText = preText.slice(0, -1);
    }

    console.log('1 - preText');

    const preLines = preText.split('\n');
    // "000", "", "001", "002", "003", "004", "005", "006", "", "007" .....
    console.log('2 - preLines', preLines);

    // ["000"], ["001", "002", "003", "004", "005", "006"], ["007", .....
    const preGroupedLines = preLines.reduce((accumulator, line, index, array) => {

      if (line === '') {
        accumulator.push([]);
      } else {
        accumulator[accumulator.length - 1].push(line)
      }
      return accumulator;
    }, [[]])
      .filter(array => array.length);

    let veryStartGroup = '';
    let veryEndGroup = '';

    if (preGroupedLines[0].length < this.minPreFirstBlockLines) {
      veryStartGroup = preGroupedLines.shift().join('\n') + '\n\n';
    }
    if (preGroupedLines[preGroupedLines.length - 1].length < this.minPreLastBlockLines) {
      veryEndGroup = '\n' + preGroupedLines.pop().join('\n');
    }

    console.log('3 - preGroupedLines', preGroupedLines);

    // ["000"], [Array(3), Array(3)], [Array(3), "010", "011", Array(3)], .....
    const preBlocks = preGroupedLines.reduce((accumulator, block, index, array) => {

      if (block.length < this.minPreBreakableLines) {
        accumulator.push(block.join('\n') + '\n')
      } else {
        const first = block.slice(0, this.minPreFirstBlockLines).join('\n') + '\n';
        const rest = block.slice(this.minPreFirstBlockLines, - this.minPreLastBlockLines)
          .map(line => line + '\n');
        const last = block.slice(-this.minPreLastBlockLines).join('\n') + '\n';
        const res = [];
        accumulator.push(first);
        rest.length && accumulator.push(...rest);
        accumulator.push(last);
      };

      accumulator.push('\n');
      // (index < array.length - 1) && accumulator.push('\n'); // for each block except last
      return accumulator;
    }, []);

    if (preBlocks[preBlocks.length - 1] === '\n') {
      preBlocks.pop()
    }

    veryStartGroup.length && (preBlocks[0] = veryStartGroup + preBlocks[0]);
    veryEndGroup.length && (preBlocks[preBlocks.length - 1] = preBlocks[preBlocks.length - 1] + veryEndGroup);

    console.log('4 - preBlocks', preBlocks);


    // **************************************

    const blockAndLineElementsArray = preBlocks.map(
      block => {
        const blockElement = this.DOM.createNeutral();
        this.DOM.setInnerHTML(blockElement, block);
        return blockElement;
      }
    )

    // console.log(blockAndLineElementsArray);

    //TODO move to DOM, like prepareSplittedNode(node)



    const testNode = this.DOM.createTestNodeFrom(node);
    testNode.append(...blockAndLineElementsArray);
    node.append(testNode);



    // console.log('availableSpace', availableSpace);
    // console.log('pageSpace', pageSpace);

    // find starts of parts splitters

    let page = 0;
    let splitters = [];
    let floater = availableSpace;

    for (let index = 0; index < blockAndLineElementsArray.length; index++) {
      // const floater = availableSpace + page * pageSpace;
      const current = blockAndLineElementsArray[index];

      // TODO move to DOM
      if (this.DOM.getElementBottom(current) > floater) {

        splitters.push(index);
        page += 1;
        floater = this.DOM.getElementTop(current) + pageSpace;
      }
    }

    // register last part end
    splitters.push(null);

    console.log(splitters);


    const splitsArr = splitters.map((id, index, splitters) => {
      // Avoid trying to break this node: createPrintNoBreak()
      // We can't wrap in createPrintNoBreak()
      // because PRE may have margins and that will affect the height of the wrapper.
      // So we will give the PRE itself this property.
      const part = this.DOM.cloneNodeWrapper(node);
      this.DOM.setPrintNoBreak(part);

      const start = splitters[index - 1] || 0;
      const end = id || splitters[splitters.length];

      part.append(...blockAndLineElementsArray.slice(start, end));

      return part;
    });

    console.log('PRE splitsArr', splitsArr);

    this.DOM.insertInsteadOf(node, ...splitsArr);
    return splitsArr;

    // TODO переполнение ширины страницы
    // overflow-x hidden + warning

  }

  _splitTableNode(node, pageBottom) {
    console.log('%c WE HAVE A TABLE', 'color:yellow');
    console.log('pageBottom', pageBottom);
    console.log('nodeBottom', this.DOM.getElementBottom(node));

    console.time('_splitTableNode')

    // calculate table wrapper (empty table element) height
    // to calculate the available space for table content
    const tableWrapperHeight = this.DOM.getEmptyNodeHeight(node);

    // nodeEntries

    const nodeEntries = [...node.children].reduce(function (acc, curr) {

      const tag = curr.tagName;

      if (tag === 'TBODY') {
        return {
          ...acc,
          rows: [
            ...acc.rows,
            ...curr.children,
          ]
        }
      }

      if (tag === 'CAPTION') {
        return {
          ...acc,
          caption: curr
        }
      }

      if (tag === 'THEAD') {
        return {
          ...acc,
          thead: curr
        }
      }

      if (tag === 'TFOOT') {
        return {
          ...acc,
          tfoot: curr
        }
      }

      if (tag === 'TR') {
        return {
          ...acc,
          rows: [
            ...acc.rows,
            ...curr,
          ]
        }
      }

      return {
        ...acc,
        unexpected: [
          ...acc.unexpected,
          ...curr,
        ]
      }
    }, {
      caption: null,
      thead: null,
      tfoot: null,
      rows: [],
      unexpected: [],
    });
    console.log('nodeEntries', nodeEntries);

    if (nodeEntries.unexpected.length > 0) {
      console.warn('something unexpected is found in the table');
    }

    if (nodeEntries.rows.length < this.minBreakableRows) {
      return []
    }

    // Prepare node parameters
    const nodeTop = this.DOM.getElementTop(node);
    const nodeHeight = this.DOM.getElementHeight(node);

    const firstPartHeight = pageBottom
      - nodeTop
      - this.signpostHeight - tableWrapperHeight;
    const fullPagePartHeight = this.referenceHeight
      - this.DOM.getElementHeight(nodeEntries.thead)
      - this.DOM.getElementHeight(nodeEntries.tfoot)
      - this.DOM.getElementHeight(nodeEntries.caption)
      - 2 * this.signpostHeight - tableWrapperHeight;
    const topsArr = [
      ...nodeEntries.rows.map((row) => this.DOM.getElementTop(row)),
      this.DOM.getElementTop(nodeEntries.tfoot) || nodeHeight
    ]

    // calculate Table Splits Ids

    let splitsIds = [];
    let currentPageBottom = firstPartHeight;

    for (let index = 0; index < topsArr.length; index++) {

      if (topsArr[index] > currentPageBottom) {

        // TODO split long TR
        // console.log('%c calculateRowSplits', 'color: #47D447');

        if (index > this.minLeftRows) {
          // avoid < minLeftRows rows on first page
          splitsIds.push(index - 1);
        }

        currentPageBottom = topsArr[index - 1] + fullPagePartHeight;

        // check if next fits

      }
    }

    // avoid < minDanglingRows rows on last page
    const maxSplittingId = (topsArr.length - 1) - this.minDanglingRows;
    if (splitsIds[splitsIds.length - 1] > maxSplittingId) {
      splitsIds[splitsIds.length - 1] = maxSplittingId;
    }
    console.log('splitsIds', splitsIds);



    const insertTableSplit = (startId, endId) => {

      const tableWrapper = this.DOM.cloneNodeWrapper(node);

      const partEntries = nodeEntries.rows.slice(startId, endId);

      const part = this.DOM.createPrintNoBreak();
      node.before(part);

      if (startId) {
        // if is not first part
        part.append(this.DOM.createSignpost('(table continued)', this.signpostHeight));
      }

      part.append(
        this.DOM.createTable({
          wrapper: tableWrapper,
          caption: this.DOM.cloneNode(nodeEntries.caption),
          thead: this.DOM.cloneNode(nodeEntries.thead),
          // tfoot,
          tbody: partEntries,
        }),
        this.DOM.createSignpost('(table continues on the next page)', this.signpostHeight)
      );

      return part
    };

    const splits = splitsIds.map((value, index, array) => insertTableSplit(array[index - 1] || 0, value))

    console.log('splits', splits);

    // create LAST PART
    const lastPart = this.DOM.createPrintNoBreak();
    node.before(lastPart);
    lastPart.append(
      this.DOM.createSignpost('(table continued)', this.signpostHeight),
      node
    )

    console.timeEnd('_splitTableNode')
    return [...splits, lastPart]
  }

  // TODO split text with BR
  // TODO split text with A (long, splitted) etc.

  _splitTextNode(node, pageBottom) {

    // Prepare node parameters
    const nodeTop = this.DOM.getElementTop(node);
    const nodeHeight = this.DOM.getElementHeight(node);
    const nodeLineHeight = this.DOM.getLineHeight(node);

    // Prepare parameters for splitters calculation
    const availableSpace = pageBottom - nodeTop;

    const nodeLines = ~~(nodeHeight / nodeLineHeight);
    const pageLines = ~~(this.referenceHeight / nodeLineHeight);
    const firstPartLines = ~~(availableSpace / nodeLineHeight);

    // calculate approximate splitters
    const approximateSplitters = calculateSplitters({
      nodeLines: nodeLines,
      pageLines: pageLines,
      firstPartLines: firstPartLines,
      // const
      minBreakableLines: this.minBreakableLines,
      minLeftLines: this.minLeftLines,
      minDanglingLines: this.minDanglingLines,
    });

    // console.log('approximateSplitters', approximateSplitters);

    if (approximateSplitters.length < 2) {
      console.log(' ... do not break', node);
      return []
    }

    // Split this node:

    const {
      splittedNode,
      nodeWords,
      nodeWordItems,
    } = this.DOM.prepareSplittedNode(node);

    // CALCULATE exact split IDs
    const exactSplitters = approximateSplitters.map(
      ({ endLine, splitter }) =>
        splitter
          ? findSplitId({
            arr: nodeWordItems,
            floater: splitter,
            topRef: endLine * nodeLineHeight,
            getElementTop: this.DOM.getElementTop,
          })
          : null
    );

    const splitsArr = exactSplitters.map((id, index, exactSplitters) => {
      // Avoid trying to break this node: createPrintNoBreak()
      const part = this.DOM.createPrintNoBreak();

      const start = exactSplitters[index - 1] || 0;
      const end = id || exactSplitters[exactSplitters.length];

      this.DOM.setInnerHTML(part, nodeWords.slice(start, end).join(' ') + ' ');

      return part;
    });

    this.DOM.insertInsteadOf(splittedNode, ...splitsArr);

    return splitsArr;

    // todo
    // последняя единственная строка - как проверять?
    // смотреть, если эта НОДА - единственный или последний потомок своего родителя

  }

  _getChildren(element) {
    // Check children:
    // TODO variants
    // TODO last child
    // TODO first Li

    const childrenArr = [...this.DOM.getChildNodes(element)]
      .map(
        item =>
          this.DOM.isSignificantTextNode(item)
            ? this.DOM.wrapTextNode(item)
            : item
      )
      .filter(
        item =>
          this.DOM.isElementNode(item)
      );

    return childrenArr;
  }

  _isSignificantChild(child) {
    const tag = this.DOM.getElementTagName(child);

    // TODO isSignificantChild
    // If my nodeName is #text, my height is always undefined
    return (tag !== 'A' && tag !== 'TT' && this.DOM.getElementHeight(child) > 0);
  }

  _isTextNode(element) {
    return this.DOM.isNeutral(element);
  }
  _isTableNode(element) {
    return this.DOM.getElementTagName(element) === 'TABLE';
  }

  _notSolved(element) {
    // TODO !!!
    // помещать такой объект просто на отдельную страницу
    // проверить, если объект больше - как печатаются номера и разрывы
    const tag = this.DOM.getElementTagName(element);
    return (tag === 'OBJECT')
  }

  // _isUnbreakable(element) {
  //   // IF currentElement is specific,
  //   // process as a whole:
  //   const tag = this.DOM.getElementTagName(element);

  //   // BUG WITH OBJECT: in FF is ignored, in Chrome get wrong height
  //   // if (tag === 'OBJECT') {
  //   //   console.log('i am object');
  //   //   resizeObserver.observe(currentElement)
  //   // }

  //   // this.DOM.isNeutral(element) || 

  //   const takeAsWhole = (tag === 'IMG' || tag === 'svg' || tag === 'TABLE' || this.DOM.isNoBreak(element) || tag === 'OBJECT')
  //   return takeAsWhole;
  // }
}
