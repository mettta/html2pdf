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
    this.minLeftLines = 2;
    this.minDanglingLines = 2;
    this.minBreakableLines = this.minLeftLines + this.minDanglingLines;
    this.minLeftRows = 2;
    this.minDanglingRows = 2;
    this.minBreakableRows = this.minLeftRows + this.minDanglingRows;

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
    if (this.DOM.getElementTop(nextElement) > newPageBottom) {

      console.log(
        '\n previousElement:', previousElement,
        '\n currentElement:', currentElement,
        '\n nextElement:', nextElement,
      );

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

        // svg has not offset props
        const currentImage = this._isSVG(currentElement)
          ? this.DOM.wrapWithPrintNoBreak(currentElement)
          : currentElement;

        const availableSpace = newPageBottom - this.DOM.getElementTop(currentImage);
        const currentImageHeight = this.DOM.getElementHeight(currentImage);

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
            width: this.DOM.getElementWidth(currentImage),
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
            width: this.DOM.getElementWidth(currentImage),
            vspace: this.referenceHeight,
            hspace: this.referenceWidth
          });
        }
        return
      }

      // TODO check BOTTOMS??? vs MARGINS
      // IF currentElement does fit
      // in the remaining space on the page,
      if (this.DOM.getElementBottom(currentElement) < newPageBottom) {
        console.log('%c -- check BOTTOM of', 'color:yellow', currentElement);
        this._registerPageStart(nextElement);
        return
      }

      // otherwise try to break it and loop the children:
      let children = [];

      if (this._isTextNode(currentElement)) {
        children = this._splitTextNode(currentElement, newPageBottom) || [];
      } else if (this._isTableNode(currentElement)) {
        children = this._splitTableNode(currentElement, newPageBottom) || [];
      } else if (this._isBreakable(currentElement)) {
        children = this._getChildren(currentElement);
      }
      // otherwise we keep an empty children array

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

  _isIMG(element) {
    return this.DOM.getElementTagName(element) === 'IMG'
  }
  _isSVG(element) {
    return this.DOM.getElementTagName(element) === 'svg'
  }

  // TODO
  // - если не разбиваемый и его высота больше чем страница - уменьшать

  // HELPERS

  _splitTableNode(node, pageBottom) {
    console.log('%c WE HAVE A TABLE', 'color:yellow');
    console.log('pageBottom', pageBottom);
    console.log('nodeBottom', this.DOM.getElementBottom(node));

    console.time('_splitTableNode')

    // calculate table wrapper (empty table element) height
    // to calculate the available space for table content
    const testTableWrapper = node.cloneNode(false);
    node.before(testTableWrapper);
    const tableWrapperHeight = testTableWrapper.offsetHeight;
    testTableWrapper.remove();

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

      const tableWrapper = node.cloneNode(false);

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
          caption: nodeEntries.caption?.cloneNode(true),
          thead: nodeEntries.thead?.cloneNode(true),
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

    console.log('approximateSplitters', approximateSplitters);

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

  _isBreakable(element) {
    const tag = this.DOM.getElementTagName(element);
    return (
      !this.DOM.isNoBreak(element)
      && tag !== 'IMG'
      && tag !== 'svg'
      && tag !== 'TABLE'
      && tag !== 'OBJECT'
    )
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
