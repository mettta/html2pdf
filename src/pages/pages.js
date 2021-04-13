import calculateSplitters from './calculateSplitters';
import findSplitId from './findSplitId';
import calculateTableSplits from './calculateTableSplits';

export default class Pages {

  constructor({
    DOM,
    contentFlow,
    referenceHeight
  }) {

    this.DOM = DOM;
    this.contentFlow = contentFlow;
    this.referenceHeight = referenceHeight;

    // todo
    // 1) move to config
    this.minLeftLines = 2;
    this.minDanglingLines = 2;
    this.minBreakableLines = this.minLeftLines + this.minDanglingLines;
    this.minLeftRows = 2;
    this.minDanglingRows = 2;
    this.minBreakableRows = this.minLeftRows + this.minDanglingRows;

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
      this._registerPage({ pageStart: this.contentFlow });
      return;
    }

    // ELSE:

    const content = this._getChildren(this.contentFlow);

    // TODO put this into main calculations?
    // FIRST ELEMENT: register the beginning of the first page.
    this._registerPage({ pageStart: content[0] });

    this._parseNodes({
      array: content
    });
  }

  _registerPage({
    pageBreak,
    pageEnd,
    pageStart,
  }) {
    this.pages.push({
      pageBreak: pageBreak,
      pageEnd: pageEnd,
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
    const lastElem = this.pages[this.pages.length - 1].pageEnd;
    const flowCutPoint = lastElem ? this.DOM.getElementBottom(lastElem) : 0;
    const newPageBottom = flowCutPoint + this.referenceHeight;

    if (this.DOM.isForcedPageBreak(currentElement)) {
      this._registerPage({
        pageBreak: currentElement,
        pageEnd: previousElement,
        pageStart: nextElement,
      })
      return
    }

    // IF nextElement does not start on the current page,
    // we should check if the current one fits in the page,
    // because it could be because of the margin
    if (this.DOM.getElementTop(nextElement) > newPageBottom) {

      // TODO check BOTTOMS??? vs MARGINS
      // IF currentElement does fit
      // in the remaining space on the page,
      if (this.DOM.getElementBottom(currentElement) < newPageBottom) {
        console.log('%c -- check BOTTOM of', 'color:rose', currentElement);
        this._registerPage({
          pageEnd: currentElement,
          pageStart: nextElement,
        });
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
        // If no children, move element to the next page:
        this._registerPage({
          pageEnd: previousElement,
          pageStart: currentElement,
        });
      }

    }
    // IF currentElement fits, continue.
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
    function prepareItem(item) {
      return {
        item: item,
        top: item.offsetTop,
        height: item.offsetHeight
      }
    }

    const nodeEntries = [...node.children].reduce(function (acc, curr) {

      const tag = curr.tagName;

      if (tag === 'TBODY') {
        curr = [...curr.children].map(item => prepareItem(item));
        return {
          ...acc,
          rows: [
            ...acc.rows,
            ...curr,
          ]
        }
      }

      if (tag === 'CAPTION') {
        return {
          ...acc,
          caption: prepareItem(curr)
        }
      }

      if (tag === 'THEAD') {
        return {
          ...acc,
          thead: prepareItem(curr)
        }
      }

      if (tag === 'TFOOT') {
        return {
          ...acc,
          tfoot: prepareItem(curr)
        }
      }

      if (tag === 'TR') {
        return {
          ...acc,
          rows: [
            ...acc.rows,
            ...prepareItem(curr),
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
    console.log(nodeEntries);

    if (nodeEntries.unexpected.length > 0) {
      console.warn('something unexpected is found in the table');
    }

    if (nodeEntries.rows.length < this.minBreakableRows) {
      return []
    }

    // -
    // const signpostHeight = 24;
    // const tablePrefix = this.DOM.createSignpost('continuation of the table', signpostHeight);
    // const tableSuffix = this.DOM.createSignpost('the table continue on the next page', signpostHeight);

    // Prepare node parameters
    const nodeTop = this.DOM.getElementTop(node);
    const nodeHeight = this.DOM.getElementHeight(node);

    // console.log('nodeTop', nodeTop);
    // console.log('nodeHeight', nodeHeight);

    // Prepare parameters for splitters calculation
    // const availableSpace = pageBottom - nodeTop;
    // console.log('availableSpace', availableSpace);
    // const firstPartBodyHeight = availableSpace - this.signpostHeight;
    // console.log('firstPartBodyHeight', firstPartBodyHeight);

    const firstPartHeight = pageBottom - nodeTop
      - this.signpostHeight - tableWrapperHeight;
    const fullPagePartHeight = this.referenceHeight
      - nodeEntries.thead.height - nodeEntries.tfoot.height - nodeEntries.caption.height
      - 2 * this.signpostHeight - tableWrapperHeight;
    // console.log(fullPagePartHeight);
    const topsArr = [
      ...nodeEntries.rows.map((row) => row.top),
      nodeEntries.tfoot.top || nodeHeight
    ]

    const splitsIds = calculateTableSplits({
      topsArr: topsArr,
      firstPartHeight: firstPartHeight,
      fullPagePartHeight: fullPagePartHeight,
      minLeftRows: this.minLeftRows,
      minDanglingRows: this.minDanglingRows,
    })
    console.log('@@@@@@@@@@@@@@', splitsIds);

    const insertTableSplit = (startId, endId) => {

      // we filtered this array, so there's no need for that.
      // if (!endId) {
      //   // empty element
      //   return this.DOM.createPrintNoBreak();
      // }

      const tableWrapper = node.cloneNode(false);
      console.log(tableWrapper, 'CLONED --------- ');

      const partEntries = nodeEntries.rows.slice(startId, endId).map(
        el => el.item
      )

      const part = this.DOM.createPrintNoBreak();
      node.before(part);

      if (startId) {
        // if is not first part
        part.append(this.DOM.createSignpost('(table continued)', this.signpostHeight));
      }

      part.append(
        this.DOM.createTable({
          wrapper: tableWrapper,
          caption: nodeEntries.caption?.item.cloneNode(true),
          thead: nodeEntries.thead?.item.cloneNode(true),
          // tfoot,
          tbody: partEntries,
        }),
        this.DOM.createSignpost('(table continues on the next page)', this.signpostHeight)
      );

      return part
    };

    const splits = splitsIds.map((value, index, array) => insertTableSplit(array[index - 1] || 0, value))

    console.log(splits);

    // const tryPartStart = nodeEntries.rows.findIndex((element, index) => element.top > firstPartBodyHeight);
    // const nextPartStart = tryPartStart === -1
    //   // if only footer is on the next page,
    //   // take also 2 rows
    //   ? nodeEntries.rows.length - 2
    //   // if find a row that starts on the next page,
    //   // also pick up the previous one
    //   : tryPartStart - 1;

    // console.log('id', nextPartStart);
    // console.log('nextPartStart', nodeEntries.rows[nextPartStart]);

    // const firstPartEntries = nodeEntries.rows.slice(0, nextPartStart).map(
    //   el => el.item
    // )

    // if (firstPartEntries.length < 2) {
    //   // TODO multipage
    //   return []
    // }

    // // create FIRST PART
    // const firstPart = this.DOM.createPrintNoBreak();
    // node.before(firstPart);
    // firstPart.append(
    //   this.DOM.createTable({
    //     wrapper: tableWrapper,
    //     caption: nodeEntries.caption?.item.cloneNode(true),
    //     thead: nodeEntries.thead?.item.cloneNode(true),
    //     // tfoot,
    //     tbody: firstPartEntries,
    //   }),
    //   this.DOM.createSignpost('(table continues on the next page)', this.signpostHeight)
    // );



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
      console.log('НЕ РАЗБИВАЕМ', node);
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
      && tag !== 'TABLE'
      && tag !== 'OBJECT'
    )
  }

  _isUnbreakable(element) {
    // IF currentElement is specific,
    // process as a whole:
    const tag = this.DOM.getElementTagName(element);

    // BUG WITH OBJECT: in FF is ignored, in Chrome get wrong height
    // if (tag === 'OBJECT') {
    //   console.log('i am object');
    //   resizeObserver.observe(currentElement)
    // }

    // this.DOM.isNeutral(element) || 

    const takeAsWhole = (tag === 'IMG' || tag === 'TABLE' || this.DOM.isNoBreak(element) || tag === 'OBJECT')
    return takeAsWhole;
  }
}
