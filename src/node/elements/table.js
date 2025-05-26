export default class Table {
  constructor({
    config,
    DOM,
    node,
    selector,
  }) {
    // * From config:
    this._debugMode = config.debugMode;
    // * Private
    this._DOM = DOM;
    this._selector = selector;
    this._node = node;

    this._debugToggler = true && this._debugMode;


    // todo
    // 1) move to config
    // Table:
    // # can be a single row with long content
    this._minLeftRows = 1; // ! min 1!
    this._minDanglingRows = 1;  // ! min 1!
    this._minBreakableRows = 1; // this._minLeftRows + this._minDanglingRows;
    // TODO move to paragraph
    this._minBreakableLines = 4;

    // TODO move to config
    this._signpostHeight = 24;

    // https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browsers
    // Firefox 1.0+
    // https://bugzilla.mozilla.org/show_bug.cgi?id=820891
    // * Reason: caption is considered as an external element
    // * and is not taken into account in calculation
    // * of offset parameters of table rows.
    this._isFirefox = typeof InstallTrigger !== 'undefined';

  }

  split(table, pageBottom, fullPageHeight) {
    return this._splitTableNode(table, pageBottom, fullPageHeight)
  }


  // TODO test more complex tables
  _splitTableNode(table, pageBottom, fullPageHeight) {
    // * Split simple tables, without regard to col-span and the like.
    this._debugToggler && console.group('%c_splitTableNode', 'background:cyan', [table]);

    this._lockWidths(table);

    // * Calculate table wrapper (empty table element) height
    // * to calculate the available space for table content
    const tableWrapperHeight = this._node.getEmptyNodeHeight(table, '<tr><td></td></tr>');
    // * Get table entries
    const tableEntries = this._getEntries(table);

    this._debugToggler && console.log('tableEntries', tableEntries);

    // TODO # can be a single row with long content ?
    // ! this._minBreakableRows === 0
    // if (tableEntries.rows.length < this._minBreakableRows) {
    //   this._end(NOT _splitTableNode (tableEntries.rows.length < this._minBreakableRows));
    //   return []
    // }

    // Prepare node parameters
    // * getTopWithMargin vs getTop
    // * The margin must be taken into account,
    // * because it is included in the calculation of the tableWrapperHeight
    // * and will be subtracted when calculating the first internal part of the table.
    const tableTopWithTopMargin = this._node.getTopWithMargin(table, this._root);

    // const tableHeight = this._DOM.getElementOffsetHeight(table);
    const tableCaptionHeight = this._DOM.getElementOffsetHeight(tableEntries.caption) || 0;
    const tableTheadHeight = this._DOM.getElementOffsetHeight(tableEntries.thead) || 0;
    const tableTfootHeight = this._DOM.getElementOffsetHeight(tableEntries.tfoot) || 0;

    // *** Convert NULL/Undefined to 0.
    // *** Nullish coalescing assignment (??=), Nullish coalescing operator (??)
    const captionFirefoxAmendment = (tableCaptionHeight ?? 0) * (this._isFirefox ?? 0);

    const tableFirstPartBottom = pageBottom
      - tableTopWithTopMargin
      - tableWrapperHeight
      - this._signpostHeight;

    const tableFullPartContentHeight = fullPageHeight
      - tableCaptionHeight // * copied into each part
      - tableTheadHeight // * copied into each part
      - tableTfootHeight // * remains in the last part (in the table)
      - tableWrapperHeight
      - 2 * this._signpostHeight;

    this._debugToggler && console.log(
      '\n • tableFirstPartBottom', tableFirstPartBottom,
      '\n',
      '\n   pageBottom', pageBottom,
      '\n - tableTop(WithTopMargin)', tableTopWithTopMargin,
      '\n - tableCaptionHeight', tableCaptionHeight,
      '\n - tableTheadHeight', tableTheadHeight,
      '\n - tableWrapperHeight', tableWrapperHeight,
      '\n - this._signpostHeight', this._signpostHeight,
      '\n',
      '\n   fullPageHeight', fullPageHeight,
      '\n - tableCaptionHeight', tableCaptionHeight,
      '\n - tableTheadHeight', tableTheadHeight,
      '\n - tableTfootHeight', tableTfootHeight,
      '\n - 2 * this._signpostHeight', (2 * this._signpostHeight),
      '\n - tableWrapperHeight', tableWrapperHeight,
      '\n = tableFullPartContentHeight', tableFullPartContentHeight,
    );

    // * Rows that we distribute across the partitioned table
    const getDistributedRows = (tableEntries) => [
      ...tableEntries.rows,
      ...(tableEntries.tfoot ? [tableEntries.tfoot] : [])
    ];

    let distributedRows = getDistributedRows(tableEntries);
    this._debugToggler && console.log('distributedRows', distributedRows);

    // * Calculate Table Splits Ids

    let splitsIds = [];
    let currentPageBottom = tableFirstPartBottom;

    this._debugToggler && console.log(
      this._node.getTop(distributedRows[1], table) - this._node.getBottom(distributedRows[0], table),
      '(row[1].top - row[0].bottom)',
    )

    if (this._node.getTop(distributedRows[0], table) > currentPageBottom) {
      // * If the beginning of the first line is immediately on the second page
      // * then even the header doesn't fit.
      // * Go immediately to the second page.
      currentPageBottom = tableFullPartContentHeight;
      this._debugToggler && console.log(`The Row 0 goes to the 2nd page`);
    }

    for (let index = 0; index < distributedRows.length; index++) {
      this._debugToggler && console.log(
        `%c 🟪 Check the Row # ${index}`, 'color:blueviolet',
        [ distributedRows[index] ],
        // [...distributedRows]
      );

      const currentRow = distributedRows[index];
      const currRowBottom = this._node.getBottom(currentRow, table) + captionFirefoxAmendment;
      const currRowTop = this._node.getTop(currentRow, table) + captionFirefoxAmendment;
      const nextRow = distributedRows[index + 1];
      const nextRowBottomOrTableBottom = nextRow
        ? this._node.getTop(nextRow, table) + captionFirefoxAmendment
        : currRowBottom; // for the last row

      if (nextRowBottomOrTableBottom > currentPageBottom) {
        // * If the end of the row is on the second page
        // * TRY TO SPLIT CURRENT ROW

        const splittingRowIndex = index;
        const splittingRow = currentRow;
        const splittingRowHeight = this._DOM.getElementOffsetHeight(splittingRow);
        const splittingMinRowHeight = this._node.getTableRowHeight(splittingRow, this._minBreakableLines); // ? paragraph inside
        const splittingEmptyRowHeight = this._node.getTableRowHeight(splittingRow);
        const splittingRowTop = currRowTop;

        const isNoBreak = this._node.isNoBreak(splittingRow);
        const makesSenseToSplitTheRow = (splittingRowHeight >= splittingMinRowHeight) && (!isNoBreak);

        this._debugToggler && console.log(
          `%c • Row # ${index}: try to split`, 'color:blueviolet', splittingRow,
        );


        if (makesSenseToSplitTheRow) {
          // * Let's split table row [index]

          this._debugToggler && console.groupCollapsed(
            `Split The ROW.${splittingRowIndex}`
          );

          const rowFirstPartHeight = currentPageBottom - splittingRowTop - splittingEmptyRowHeight;
          const rowFullPageHeight = tableFullPartContentHeight - splittingEmptyRowHeight;

          const splittingRowTDs = this._DOM.getChildren(splittingRow);

          let theRowContentSlicesByTD;

          theRowContentSlicesByTD = [...splittingRowTDs].map((td, ind) => {
            const tdChildren = this._node.getPreparedChildren(td);
            this._debugToggler && console.groupCollapsed(`Split TD.${ind} in ROW.${splittingRowIndex}`);
            const tdInternalSplitters = this._getInternalBlockSplitters({
              rootNode: td,
              children: tdChildren,
              pageBottom: pageBottom,
              firstPartHeight: rowFirstPartHeight,
              fullPageHeight: rowFullPageHeight,
            });
            this._debugToggler && console.groupEnd(`Split TD.${ind} in ROW.${splittingRowIndex}`);
            return tdInternalSplitters
          });

          this._debugToggler && console.log(
            '🟣 \ntheRowContentSlicesByTD',
            theRowContentSlicesByTD
          );

          const shouldFirstPartBeSkipped = theRowContentSlicesByTD.some(obj => {
            this._debugToggler && console.log(
              '🟣',
              '\nobj.result.length',
              obj.result.length,
              '\nobj.result[0]',
              obj.result[0]
            );
            return (obj.result.length && obj.result[0] === null)
          });

          this._debugToggler && console.log(
            '🟣',
            '\nshouldFirstPartBeSkipped',
            shouldFirstPartBeSkipped
          );

          if(shouldFirstPartBeSkipped) {
            theRowContentSlicesByTD = [...splittingRowTDs].map(td => {
              const tdChildren = this._node.getPreparedChildren(td);
              const tdInternalSplitters = this._getInternalBlockSplitters({
                rootNode: td,
                children: tdChildren,
                pageBottom: pageBottom,
                firstPartHeight: rowFullPageHeight,
                fullPageHeight: rowFullPageHeight,
              });
              return tdInternalSplitters
            });
          }

          this._debugToggler && console.log(
            '🟣',
            '\n theRowContentSlicesByTD',
            theRowContentSlicesByTD
          );

          const ifThereIsSplit = theRowContentSlicesByTD.some(obj => {
            return obj.result.length
          });
          this._debugToggler && console.log('🟣 ifThereIsSplit', ifThereIsSplit);

          // !
          if (ifThereIsSplit) {

            const theTdContentElements = theRowContentSlicesByTD.map(el => {
              if(el.result.length) {
                return this._createSlicesBySplitFlag(el.trail)
              } else {
                // * el.result === 0
                // один раз полностью копируем весь контент из столбца
                const sliceWrapper = this._node.createWithFlagNoBreak();
                sliceWrapper.classList.add("🟣");
                this._DOM.setStyles(sliceWrapper, { display: 'contents' });

                const contentElements = el.trail.map(item => item.element);
                this._DOM.insertAtEnd(sliceWrapper, ...contentElements);

                return [sliceWrapper]
              }
            });

            this._debugToggler && console.log('🟣 theTdContentElements', theTdContentElements);

            const theNewTrCount = Math.max(...theTdContentElements.map(arr => arr.length));
            this._debugToggler && console.log('🟣 theNewTrCount', theNewTrCount);

            const theNewRows = [];
            for (let i = 0; i < theNewTrCount; i++) {
              const rowWrapper = this._DOM.cloneNodeWrapper(splittingRow);
              this._node.setFlagNoBreak(rowWrapper);
              this._DOM.setAttribute(rowWrapper, `.splitted_row_${splittingRowIndex}_part_${i}`);

              [...splittingRowTDs].forEach(
                (td, tdID) => {
                  const tdWrapper = this._DOM.cloneNodeWrapper(td);
                  const content = theTdContentElements[tdID][i];
                  content && this._DOM.insertAtEnd(tdWrapper, theTdContentElements[tdID][i]);
                  this._DOM.insertAtEnd(rowWrapper, tdWrapper);
                }
              );

              theNewRows.push(rowWrapper);
            }

            this._debugToggler && console.log('🟣', '\n theNewRows', theNewRows);

            // добавляем строки в массив и в таблицу

            this._DOM.setAttribute(splittingRow, '.🚫_must_be_removed'); // for test, must be removed
            this._debugToggler && console.log('🟣 splittingRow', splittingRow);
            this._DOM.insertInsteadOf(splittingRow, ...theNewRows)

            // меняем исходный массив строк таблицы!
            tableEntries.rows.splice(splittingRowIndex, 1, ...theNewRows);
            // и обновляем рабочий массив включающий футер
            distributedRows = getDistributedRows(tableEntries);

            // To check all the split pieces anew:
            index = index - 1;

          } //? END OF ifThereIsSplit

          this._end(`Split The ROW.${splittingRowIndex} (...if makesSenseToSplitTheRow)`);
        } //? END OF 'if makesSenseToSplitTheRow'
        else {

          // !!!!!!!!!!!!!!
          if (isNoBreak) {
            this._debugToggler && isNoBreak && console.log(
              `%c • Row # ${index}: noBreak`, 'color:red', splittingRow,
            );
          } else {
            this._debugToggler && console.log(
              `%c • Row # ${index}: small`, 'color:blueviolet', splittingRow,
            );
          }

          // TODO проверять это ТОЛЬКО если мы не можем разбить
          if (index >= this._minLeftRows) {
            // * avoid < minLeftRows rows on first page
            // *** If a table row starts in the next part,
            // *** register the previous one as the beginning of the next part.
            // *** In the other case, we do not register a page break,
            // *** and the first small piece will be skipped.
            splitsIds.push(index);
            this._debugToggler && console.log(
              `%c • Row # ${index}: REGISTER as start, index >= ${this._minLeftRows} (_minLeftRows) `, 'color:blueviolet',
              splittingRow
            );
          }

          currentPageBottom =
          this._node.getTop(
            distributedRows[index], table
          ) + captionFirefoxAmendment
          + tableFullPartContentHeight;
        }


         //? END OF trying to split long TR


        // check if next fits

      } else {
        // currRowTop <= currentPageBottom
        // pass
        this._debugToggler && console.log(
          `%c • Row # ${index}: PASS ...`, 'color:blueviolet',
        );
      }
    }; //? END OF for: distributedRows

    this._debugToggler && console.log(
      '\n splitsIds', splitsIds,
      '\n distributedRows', [...distributedRows]
    );

    if (!splitsIds.length) {
      this._end(`_splitTableNode !splitsIds.length`);
      return []
    }

    // * avoid < minDanglingRows rows on last page
    // ! distributedRows модифицировано

    // TODO
    // * decide if the selected table will look good or if there will be very short parts:
    // const maxSplittingId = (distributedRows.length - 1) - this._minDanglingRows;
    // if (splitsIds[splitsIds.length - 1] > maxSplittingId) {
    //   splitsIds[splitsIds.length - 1] = maxSplittingId;
    // }

    const splits = splitsIds.map((value, index, array) => this._insertTableSplit({
      startId: array[index - 1] || 0,
      endId: value,
      table,
      tableEntries,
    }))

    this._debugToggler && console.log(
      'splits', splits
    );

    // create LAST PART
    const lastPart = this._node.createWithFlagNoBreak();
    table.before(lastPart);
    this._DOM.insertAtEnd(
      lastPart,
      this._node.createSignpost('(table continued)', this._signpostHeight),
      table
    );

    this._end(`_splitTableNode`);

    return [...splits, lastPart]
  }

  // 👪👪👪👪👪👪👪👪👪👪👪👪👪👪👪👪
  _createSlicesBySplitFlag(inputArray) {
    // {
    //   id,
    //   element,
    //   children: [],
    //   split: true | false,
    // }

    this._debugToggler && console.group(`_createSlicesBySplitFlag`);

    const sliceWrapper = this._node.createWithFlagNoBreak();
    this._DOM.setStyles(sliceWrapper, { display: 'contents' });
    sliceWrapper.classList.add("🧰");

    // *** иниццируем для первого элемента оболочку sliceWrapper
    const slices = [sliceWrapper];
    let wrappers = [sliceWrapper]; // Реальные элементы, нужно клонировать массив для нового
    let currentTargetInSlice = sliceWrapper;

    const createWrapperFromArray = (array) => {
      if (array.length === 0) {
        return null;
      }

      const wrapper = array[0];
      let currentWrapper = wrapper;

      for (let i = 1; i < array.length; i++) {
        const child = array[i];
        this._DOM.insertAtEnd(currentWrapper, child);
        currentWrapper = child;
      }

      this._debugToggler && console.log(' createWrapperFromArray:', wrapper);
      return wrapper;
    }

    const processChildren = (children, parent = null) => {
      this._debugToggler && console.group('processChildren');
      this._debugToggler && console.log('*start* children', children)

      for (let i = 0; i < children.length; i++) {
        processObj(children[i]);
      }

      this._debugToggler && console.log('- wrappers BEFORE pop:', [...wrappers]);
      const a = wrappers.pop();
      this._debugToggler && console.log('- wrappers.pop()', a);
      this._debugToggler && console.log('- parent', parent);
      this._debugToggler && console.log('- wrappers AFTER pop:', [...wrappers]);

      currentTargetInSlice = wrappers.at(-1);
      // TODO сделать функцию
      this._debugToggler && console.log('🎯🎯 currentTargetInSlice', currentTargetInSlice)
      this._debugToggler && console.log('🎯 wrappers.at(-1)', wrappers.at(-1))
      this._debugToggler && console.log('*END* children', children)

      this._end(`processChildren`);
    }

    const processObj = (obj) => {

      const hasChildren = obj.children?.length > 0;
      const hasSplitFlag = obj.split;
      const currentElement = obj.element;
      const id = obj.id;

      this._debugToggler && console.group(`processObj # ${id}`); // Collapsed
      this._debugToggler && console.log('currentElement', currentElement);
      currentElement && this._DOM.removeNode(currentElement);

      if(hasSplitFlag) {
        this._debugToggler && console.log('••• hasSplitFlag');
        // start new object
        // const currentWrapper = slices.at(-1);
        // const nextWrapper = this._DOM.cloneNode(currentWrapper);
        wrappers = wrappers.map(wrapper => {
          const clone = this._DOM.cloneNodeWrapper(wrapper); // ???? может делать клоны не тут а при создании?
          clone.classList.add("🚩");
          return clone
        });
        this._debugToggler && console.log('• hasSplitFlag: NEW wrappers.map:', [...wrappers]);
        const nextWrapper = createWrapperFromArray(wrappers);

        slices.push(nextWrapper);
        this._debugToggler && console.log('• hasSplitFlag: slices.push(nextWrapper):', [...slices]);
        // find container in new object

        currentTargetInSlice = wrappers.at(-1);
        this._debugToggler && console.log('• hasSplitFlag: currentTargetInSlice:', currentTargetInSlice);
      }

      // TODO проверить, когда есть оба флага

      if(hasChildren) {
        this._debugToggler && console.log('••• hasChildren');
        // make new wrapper
        const cloneCurrentElementWrapper = this._DOM.cloneNodeWrapper(currentElement);

        // add cloneCurrentElementWrapper to wrappers
        wrappers.push(cloneCurrentElementWrapper); // ???????????

        this._debugToggler && console.log('• hasChildren: wrappers.push(cloneCurrentElementWrapper)', cloneCurrentElementWrapper, [...wrappers]);
        // add cloneCurrentElementWrapper to slice
        this._debugToggler && console.log('• hasChildren: currentTargetInSlice (check):', currentTargetInSlice);

        if(currentTargetInSlice) {
          this._debugToggler && console.log('• hasChildren: currentTargetInSlice', 'TRUE, add to existing', cloneCurrentElementWrapper);
          // add to existing as a child
          this._DOM.insertAtEnd(currentTargetInSlice, cloneCurrentElementWrapper);
        } else {
          this._debugToggler && console.log('• hasChildren: currentTargetInSlice', 'FALSE, init the first', cloneCurrentElementWrapper);
          // init the first
          cloneCurrentElementWrapper.classList.add('🏁first');

          this._DOM.setStyles(cloneCurrentElementWrapper, { background: 'yellow' });
          slices.push(cloneCurrentElementWrapper);
          this._debugToggler && console.log('• hasChildren: slices.push(cloneCurrentElementWrapper)', cloneCurrentElementWrapper, [...slices]);
        }
        // update wrapper bookmark
        currentTargetInSlice = wrappers.at(-1) // = cloneCurrentElementWrapper
        this._debugToggler && console.log('• hasChildren:  currentTargetInSlice (=):', currentTargetInSlice);


        processChildren(obj.children, currentElement);

      } else { // !!! внесли под ELSE

        // insert current Element
        currentTargetInSlice = wrappers.at(-1);
        this._debugToggler && console.log('insert currentElement', currentElement, 'to target', currentTargetInSlice);
        this._DOM.insertAtEnd(currentTargetInSlice, currentElement);
      }

      this._end(`processObj # ${id}`);
    }

    this._debugToggler && console.log('#######  currentTargetInSlice (=):', currentTargetInSlice);

    processChildren(inputArray);

    this._debugToggler && console.log('slices:', slices)
    this._debugToggler && slices.forEach(slice => console.log('slice:', slice))

    this._end(`_createSlicesBySplitFlag`);
    return slices
  }

  _getInternalBlockSplitters({
    rootNode,
    rootComputedStyle,
    children,
    pageBottom,
    firstPartHeight,
    fullPageHeight,
    result = [],
    trail = [],
    indexTracker = [],
    stack = [],
  }) {

    // * Need to make the getTop work with root = rootNode.
    // * A positioned ancestor is either:
    // * - an element with a non-static position, or
    // * - td, th, table in case the element itself is static positioned.
    // * So we need to set non-static position for rootNode
    // * for the calculation runtime.
    // * Because anything in the content could be with a non-static position,
    // * and then TD without positioning wouldn't work for it as a offset parent.
    const _rootComputedStyle = rootComputedStyle
    ? rootComputedStyle
    : this._DOM.getComputedStyle(rootNode);
    const initPosition = _rootComputedStyle.position;
    if (initPosition != 'relative') {
      this._DOM.setStyles(rootNode, { position: 'relative' });
    }

    this._debugToggler && console.group('💟 _getInternalBlockSplitters'); // Collapsed

    const findFirstNullIDInContinuousChain = (array) => {
      let item = null;
      let index;
      for (let i = array.length - 1; i >= 0; i--) {
        if (array[i].id === 0) {
          item = array[i];
          index = i;
        } else {
          return {item, index}
        }
      }
      return {item, index}
    }

    const updateIndexTracker = i => {
      if(i >= 0) {
        indexTracker.push(i);
      } else {
        indexTracker.pop()
      }
    }

    const registerResult = (element, id) => {
      this._debugToggler && console.assert((id >= 0), `registerResult: ID mast be provided`, element);

      let theElementObject = trail[id]; // * contender without special cases
      let theElementIndexInStack; // ***

      this._debugToggler && console.groupCollapsed('💜💜💜 registerResult(element, id)');

      this._debugToggler && console.log(
          '\n element', element,
          '\n id', id,
          '\n theElementObject (trail[id])', theElementObject,
          '\n theElementIndexInStack', theElementIndexInStack,
      );

      if (id == 0) {
        // если первый ребенок,
        // ищем самую внешнюю оболочку, которая тоже первый ребенок первого ребенка...

        const topParentElementFromStack = findFirstNullIDInContinuousChain(stack);

        this._debugToggler && console.log(
            '💜💜 id == 0',
            '\n💜 [...stack]', [...stack],
            '\n💜 topParentElementFromStack', topParentElementFromStack,
          );

        if(topParentElementFromStack.item) {
          theElementObject = topParentElementFromStack.item;
          theElementIndexInStack = topParentElementFromStack.index;
        }

      }

      this._debugToggler && console.log('💜',
        '\n theElementObject', theElementObject,
        '\n theElementIndexInStack', theElementIndexInStack,
        '\n [...indexTracker]', [...indexTracker],
      );

      if(theElementIndexInStack === 0) {
        // * If this is the first wrapper registered for the first slice, we do not register the result,
        // * since it will be the beginning of the first slice.
        // * Otherwise we will generate an empty table row.
        // * Because the first row of the table starts filling automatically,
        // * and the first flag 'split' means the beginning of the SECOND slice.

        result.push(null); // * it is used to calculate the height of a piece

        this._debugToggler && console.log(
            'result.push(null)',
            '\n\n💜💜💜',
          );
      } else {
        result.push(theElementObject.element); // * it is used to calculate the height of a piece
        theElementObject && (theElementObject.split = true);

        this._debugToggler && console.log(
            '\n theElementObject', theElementObject,
            '\n theElementObject.element', theElementObject.element,
            '\n result.push(theElementObject.element)',
            '\n\n💜💜💜 ',
          );
      }

      this._end(`_getInternalBlockSplitters registerResult`);
    }

    this._debugToggler && console.log(
        '💟 result 💟', result,
        '\n\n',
        `\n rootNode:`, rootNode,
        `\n children:`, children,
        `\n pageBottom:`, pageBottom,
        `\n firstPartHeight:`, firstPartHeight,
        `\n fullPageHeight:`, fullPageHeight,
        `\n\n\n`,
        '💟 stack', [...stack],
      );

    for (let i = 0; i < children.length; i++) {

      const previousElement = children[i - 1];
      const currentElement = children[i];
      const nextElement = children[i + 1];
      const nextElementTop = nextElement ? this._node.getTop(nextElement, rootNode): undefined;

      // nextElement && console.log(
      //   'ddddd',
      //   this._node.getTop(nextElement, rootNode),
      //   nextElement,
      //   rootNode
      // )

      const newObject = {
        id: i,
        element: children[i],
      }

      const newObjectFromNext = {
        id: i + 1,
        element: children[i + 1], // * depend on nextElement
      }

      // * Проверяем, не добавлен ли этот элемент,
      // * это возможно через registerResult(nextElement, i + 1).
      const lastTrailElementID = trail.length ? trail.at(-1).id : undefined;
      (i !== lastTrailElementID) && trail.push(newObject);

      const floater = (result.length === 0) // * empty array => process first slice
      ? firstPartHeight
      : (
          (result.at(-1) === null) // * case with empty first slice
          ? fullPageHeight
          : fullPageHeight + this._node.getTop(result.at(-1), rootNode)
        );

      if (this._node.isForcedPageBreak(currentElement)) {
        //register

        // TODO #ForcedPageBreak
        this._debugToggler && console.warn(
            currentElement, '💟 is isForcedPageBreak'
          );
      }

      // TODO:
      // nextElementTop?
      // nextElement?

      if (nextElementTop <= floater) {
        // -- current fits

        // this._debugToggler && console.log('💟💟 nextElementTop <= floater // current fits');

        if (this._node.isNoHanging(currentElement)) {
          // -- current fits but it can't be the last

          this._debugToggler && console.log('💟💟 currentElement _isNoHanging');

          registerResult(currentElement, i);
        }
        // go to next index
      } else { // nextElementTop > floater
              // currentElement ?

        this._debugToggler && console.log('💟💟', currentElement, `nextElementTop > floater \n ${nextElementTop} > ${floater} `,);

        if (this._node.isSVG(currentElement) || this._node.isIMG(currentElement)) {
          // TODO needs testing
          this._debugToggler && console.log('%cIMAGE 💟💟', 'color:red;text-weight:bold')
        }

        const currentElementBottom = this._node.getBottomWithMargin(currentElement, rootNode);

        this._debugToggler && console.log(
          '💟💟 current ???',
          '\n currentElement', currentElement,
          '\n currentElementBottom', currentElementBottom,
          '\n floater', floater
        );

        // IF currentElement does fit
        // in the remaining space on the page,
        if (currentElementBottom <= floater) {

          this._debugToggler && console.log('💟💟💟 currentElementBottom <= floater');

          // ** add nextElement check (undefined as end)
          if(nextElement) {
            this._debugToggler && console.log('💟💟💟💟 register nextElement');
            trail.push(newObjectFromNext);
            registerResult(nextElement, i + 1);
          } // else - this is the end of element list

        } else {
          // currentElementBottom > floater
          // try to split
          this._debugToggler && console.log(
            '💟💟💟 currentElementBottom > floater,\ntry to split',
            currentElement
          );

          const currentElementChildren = this._node.processedBlockChildren(currentElement, pageBottom, fullPageHeight);

          // * Parse children:
          if (currentElementChildren.length) {

            // *** add wrapper ID
            updateIndexTracker(i);

            stack.push(newObject);

            // * Process children if exist:
            this._getInternalBlockSplitters({
              rootNode,
              rootComputedStyle: _rootComputedStyle,
              children: currentElementChildren,
              pageBottom,
              firstPartHeight,
              fullPageHeight,
              result,
              trail: trail[i].children = [],
              indexTracker,
              stack,
            });

            stack.pop();

            this._debugToggler && console.log('🟪 back from _getInternalBlockSplitters;\n trail[i]', trail[i]);
            // *** END of 'has children'

          } else {
            // * If no children,
            // * move element to the next page.
            // ** But,
            if (previousElement && this._node.isNoHanging(previousElement)) {
              // ** if previousElement can't be the last element on the page,
              // ** move it to the next page.
              // TODO #_canNotBeLast
              // а если там подряд несколько заголовков, и перед previousElement есть еще заголовки, которые мы не проверяли еслтенствнно, и они будут висеть
              // this._registerPageStart(previousElement)
              console.warn('tst improveResult', previousElement)
              // if (improveResult) {
              let result = previousElement;
              const firstChildParent = this._node.findFirstChildParent(result, this._contentFlow);
              result = firstChildParent || result;

              const previousCandidate = this._node.findPreviousNoHangingsFromPage(result, this.pages.at(-2)?.pageBottom, this._root)
              result = previousCandidate || result;


              this._debugToggler && console.log('previousElement _isNoHanging')
              registerResult(result, i - 1);
            } else {
              // TODO #tracedParent
              this._debugToggler && console.log(currentElement, 'currentElement has no children')
              registerResult(currentElement, i);
            }
          } // *** END of 'no children'
        } // *** END of 'currentElementBottom > floater'

      }
    }

    // *** remove last wrapper ID after children processing is complete
    updateIndexTracker();

    // *** need to revert back to the original positioning of the rootNode:
    this._DOM.setStyles(rootNode, { position: initPosition });

    this._end(`_getInternalBlockSplitters`);

    return {result, trail}
  }

  // getTableEntries(
  _getEntries(node) {

    const nodeEntries = [...node.children].reduce((acc, curr) => {

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
        this._node.setFlagNoBreak(curr);
        return {
          ...acc,
          caption: curr
        }
      }

      if (tag === 'COLGROUP') {
        this._node.setFlagNoBreak(curr);
        return {
          ...acc,
          colgroup: curr
        }
      }

      if (tag === 'THEAD') {
        this._node.setFlagNoBreak(curr);
        return {
          ...acc,
          thead: curr
        }
      }

      if (tag === 'TFOOT') {
        this._node.setFlagNoBreak(curr);
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
          // BUG: •Uncaught TypeError: t is not iterable at bundle.js:1:19184
          // curr,
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

    if (nodeEntries.unexpected.length > 0) {
      this._debugToggler && console.warn(`something unexpected is found in the table ${node}`);
    }

    return nodeEntries
  }

  _insertTableSplit({ startId, endId, table, tableEntries }) {

    // this._debugToggler && console.log(`=> _insertTableSplit(${startId}, ${endId})`);

    const tableWrapper = this._DOM.cloneNodeWrapper(table);

    const partEntries = tableEntries.rows.slice(startId, endId);

    const part = this._node.createWithFlagNoBreak();
    table.before(part);

    if (startId) {
      // if is not first part
      this._DOM.insertAtEnd(part, this._node.createSignpost('(table continued)', this._signpostHeight));
    }

    this._DOM.insertAtEnd(
      part,
      this._node.createTable({
        wrapper: tableWrapper,
        colgroup: this._DOM.cloneNode(tableEntries.colgroup),
        caption: this._DOM.cloneNode(tableEntries.caption),
        thead: this._DOM.cloneNode(tableEntries.thead),
        // tfoot,
        tbody: partEntries,
      }),
      this._node.createSignpost('(table continues on the next page)', this._signpostHeight)
    );

    return part
  };

  // ***

  _lockWidths(table) {
    this._node.copyNodeWidth(table, table);
    this._DOM.getAll('td', table).forEach(
      td => this._node.copyNodeWidth(td, td)
    )
  }

  _end(string) {
    const CONSOLE_CSS_END_LABEL = `background:#eee;color:#888;padding: 0 1px 0 0;`; //  font-size:smaller

    this._debugToggler && console.log(`%c ▲ ${string} `, CONSOLE_CSS_END_LABEL);
    this._debugToggler && console.groupEnd();
  }

}
