import * as Logging from '../../utils/logging.js';

const CONSOLE_CSS_END_LABEL = `background:#999;color:#FFF;padding: 0 4px;`;

export default class Grid {
  constructor({
    config,
    DOM,
    node,
    selector,
  }) {
    // * From config:
    this._debug = config.debugMode ? { ...config.debugConfig.grid } : {};
    this._assert = config.consoleAssert ? true : false;

    // * Private
    this._DOM = DOM;
    this._selector = selector;
    this._node = node;

    Object.assign(this, Logging);

    // todo
    // 1) move to config
    // Grid:
    this._minBreakableGridRows = 4;

    // TODO make function
    // * From config:
    // - if null is set - the element is not created in createSignpost().
    this._signpostHeight = parseFloat(config.splitLabelHeight) || 0;

  }

  split(gridNode, pageBottom, fullPageHeight, root, computedStyle) {
    // Flow outline (parity with simple tables):
    // 1. Collect child grid cells and partition them into visual rows.
    // 2. Measure available space: short first window vs full-page window.
    // 3. Walk rows, registering split indexes when the next row would overflow.
    //    • If the first row itself does not fit → move whole row to next page (🚧 refine logic).
    //    • If rows can be sliced into parts → reuse slicers (🚧 not implemented yet).
    // 4. Build parts by cloning wrappers and moving row groups.
    // 5. Leave original grid as the final slice; no signposts / reclaimed height for now.
    //
    // Long-term grid targets:
    // - support deep slicing of a row's content (mirroring table TD splitting).
    // - fallback for non-breakable items (IMG/SVG) via scaling similar to Table.
    // - guard/skip complex layouts (non-monotonic placement, spans) with explicit logs.

    this._debug._ && console.group('%c_splitGridNode', 'background:#00FFFF', gridNode);

    const gridCells = this._node.getPreparedChildren(gridNode);

    const nodeComputedStyle = computedStyle ? computedStyle : this._DOM.getComputedStyle(gridNode);
    // * Use this._node.setInitStyle:
    // * In some layouts grid stays `position: static`; force a relative context so
    // * offset-based getters work (otherwise offsets are taken from body and rows
    // * start looking like a single chunk).

    if (!gridCells.length) {
      this._node.setInitStyle (false, gridNode, nodeComputedStyle);
      this._debug._ && console.groupEnd();
      return [];
    }

    this._node.setInitStyle (true, gridNode, nodeComputedStyle);

    const layoutScan = this._scanGridLayout(gridNode, nodeComputedStyle);
    if (!layoutScan.safe) {
      this._debug._ && console.warn('[grid.split] skip:', layoutScan.reason);
      this._node.setInitStyle (false, gridNode, nodeComputedStyle);
      this._debug._ && console.groupEnd();
      return [];
    }

    const ROW_TOP_STEP = 0.5; // tolerate sub-pixel jitter when detecting row breaks
    const rowGroups = [];
    let hasRowSpan = false;
    let hasColumnSpan = false;
    const rowIndexSet = new Set();
    let previousRowTop = null;

    gridCells.forEach((gridCell) => {
      // ***** Rely on vertical position only:
      // ***** we support linear, monotonic grids for now.
      const top = this._node.getTop(gridCell, gridNode);

      // * first element of a new line
      if (
        !rowGroups.length || previousRowTop == null       // * 1st row
        || Math.abs(top - previousRowTop) > ROW_TOP_STEP  // * new row
      ) {
        rowGroups.push([gridCell]); // * add cell #0 to new row group
        previousRowTop = top;       // * note down the top of new row
        return;
      }

      // * ordinary element of the current row
      rowGroups[rowGroups.length - 1].push(gridCell);

      // ** Detect spans and collect row-start indices.
      // ** If row-starts jump beyond known row groups (implicit tracks/gaps),
      // ** or any cell spans rows/columns, skip splitting this grid.
      const cellStyle = this._DOM.getComputedStyle(gridCell);
      const rowEnd = cellStyle.gridRowEnd || '';
      const colEnd = cellStyle.gridColumnEnd || '';
      hasRowSpan = hasRowSpan || rowEnd.includes('span');
      hasColumnSpan = hasColumnSpan || colEnd.includes('span');

      const rowStart = parseInt(cellStyle.gridRowStart, 10);
      Number.isFinite(rowStart) && rowIndexSet.add(rowStart);
      // todo: span w/o 'span' keyword
      // todo: gridRowEnd/gridColumnEnd as Num/-1
      // todo: gridRowStart asNaN (named lines)
      // todo: improve "implicit row gaps"?
      // - misses within a set of starts:
      // - for example, if rowIndexSet contains {1,3,5}, and 2 and 4 are missing?
    });

    const hasImplicitRowGaps = rowIndexSet.size > 0 && Math.max(...rowIndexSet) > rowGroups.length;
    if (hasImplicitRowGaps) {
      this._debug._ && console.warn('[grid.split] skip: implicit row gaps detected');
      this._node.setInitStyle (false, gridNode, nodeComputedStyle);
      this._debug._ && console.groupEnd();
      return [];
    }

    if (hasRowSpan || hasColumnSpan) {
      this._debug._ && console.warn('[grid.split] skip: span detected (row or column)');
      this._node.setInitStyle (false, gridNode, nodeComputedStyle);
      this._debug._ && console.groupEnd();
      return [];
    }

    this._debug._ && console.log('[grid.split] rowGroups:', rowGroups)

    // ** Prepare gridNode parameters for splitting
    const nodeTop = this._node.getTop(gridNode, root);
    const nodeWrapperHeight = this._node.getEmptyNodeHeight(gridNode);
    const firstPartHeight = pageBottom
      - nodeTop
      // - this._signpostHeight
      - nodeWrapperHeight;
    const fullPagePartHeight = fullPageHeight
      // - 2 * this._signpostHeight
      - nodeWrapperHeight;

    this._debug._ && console.log({firstPartHeight, fullPagePartHeight});

    // ** If there are enough rows for the split to be readable,
    // ** and the gridNode is not too big (because of the content),
    // ** then we will split it.
    if (
      rowGroups.length < this._minBreakableGridRows
      && this._DOM.getElementOffsetHeight(gridNode) < fullPageHeight
    ) {
      this._debug._ && console.log(`%c END [grid.split]: DON'T SPLIT, it isn't breakable and fits in the page`, CONSOLE_CSS_END_LABEL);
      this._node.setInitStyle(false, gridNode, nodeComputedStyle);
      this._debug._ && console.groupEnd();
      return []
    }

    // === Pagination across rows ===
    const splitsIds = [];
    const ensureSplitId = (candidate) => {
      const isOutOfRange = (candidate <= 0 || candidate >= rowGroups.length);
      const alreadyRegistered = (splitsIds.at(-1) === candidate);
      this.strictAssert(!isOutOfRange, `[split grid] split IT is out of range`);
      this.strictAssert(!alreadyRegistered, `[split grid] split IT is already registered`);
      if (isOutOfRange || alreadyRegistered) return;

      splitsIds.push(candidate);
    };

    let currentPageBottom = firstPartHeight;
    let rowIndex = 0;
    const EPS = 0.5;

    while (rowIndex < rowGroups.length) {
      const row = rowGroups[rowIndex];
      const rowTop = this._getRowTop(row, gridNode);
      const rowBottom = this._getRowBottom(row, gridNode);

      if (rowBottom <= currentPageBottom + EPS) {
        rowIndex += 1;
        continue;
      }

      const remainingSpace = currentPageBottom - rowTop;
      let splitResult = null;
      let usedTailWindow = false;

      if (remainingSpace > EPS) {
        splitResult = this._splitGridRow({
          rowIndex,
          row,
          gridNode: gridNode,
          firstPartHeight: remainingSpace,
          fullPagePartHeight,
        });
        usedTailWindow = true;
      }

      if (!splitResult || !splitResult.newRows.length) {
        splitResult = this._splitGridRow({
          rowIndex,
          row,
          gridNode: gridNode,
          firstPartHeight: fullPagePartHeight,
          fullPagePartHeight,
        });
        usedTailWindow = false;
      }

      if (splitResult && splitResult.newRows.length) {
        rowGroups.splice(rowIndex, 1, ...splitResult.newRows);

        const firstSliceTop = this._getRowTop(rowGroups[rowIndex], gridNode);
        const firstSliceBottom = this._getRowBottom(rowGroups[rowIndex], gridNode);

        if (usedTailWindow && !splitResult.isFirstPartEmptyInAnyCell && firstSliceBottom <= currentPageBottom + EPS) {
          continue;
        }

        ensureSplitId(rowIndex);
        currentPageBottom = firstSliceTop + fullPagePartHeight;
        continue;

        // todo 🚧 Future: if still overflowing after escalation, fall back to scaling.
      }

      if (rowIndex > 0) {
        ensureSplitId(rowIndex);
        currentPageBottom = rowTop + fullPagePartHeight;
        continue;
      }

      this._debug._ && console.warn('[grid.split] first row cannot be split to fit page', { row });
      this._node.setInitStyle (false, gridNode, nodeComputedStyle);
      this._debug._ && console.groupEnd();
      return [];
    }

    this._debug._ && console.log('splitsIds', splitsIds);

    const insertGridSplit = (startId, endId) => {
      // * The function is called later.
      // TODO Put it in a separate method: THIS AND TABLE

      if (startId === endId) {
        // ⚠️ unexpected empty slice, do not build chunk
        this._debug._ && console.warn('[grid.split] skip empty slice request', startId, endId);
        return null;
      }

      this._debug._ && console.log(`=> insertGridSplit(${startId}, ${endId})`);

      // const partEntries = nodeEntries.rows.slice(startId, endId);
      const partEntries = rowGroups
        .slice(startId, endId)
        .flat();
      this._debug._ && console.log(`partEntries`, partEntries);

      // const part = this._node.createWithFlagNoBreak();
      // ! Do not wrap nodes so as not to break styles.
      // TODO - Check for other uses of createWithFlagNoBreak to see if the wrapper can be avoided.

      const part = this._DOM.cloneNodeWrapper(gridNode);
      this._node.copyNodeWidth(part, gridNode);
      this._node.setFlagNoBreak(part);
      gridNode.before(part);

      if (startId) {
        // if is not first part
        // this._DOM.insertAtEnd(part, this._node.createSignpost('(table continued)', this._signpostHeight));

        // TODO: insertions between parts will not disturb the original layout & CSS.
        // Therefore, it is possible to insert an element after and before the parts
        // and specify that the gridNode is being broken.
      }

      // в таблице другое
      // this._DOM.insertAtEnd(
      //   part,
      //   this._node.createTable({
      //     wrapper: nodeWrapper,
      //     caption: this._DOM.cloneNode(nodeEntries.caption),
      //     thead: this._DOM.cloneNode(nodeEntries.thead),
      //     // tfoot,
      //     tbody: partEntries,
      //   }),
      //   this._node.createSignpost('(table continues on the next page)', this._signpostHeight)
      // );
      // this._DOM.insertAtEnd(part, nodeWrapper);
      this._DOM.insertAtEnd(part, ...partEntries);

      return part
    };


    const splits = [
      ...splitsIds
        .map((value, index, array) => insertGridSplit(array[index - 1] || 0, value))
        .filter(Boolean),
      gridNode
    ];

    this._debug._ && console.log(
      'splits', splits
    );

    // create LAST PART
    // TODO ??? is that really needed?
    // const lastPart = this._node.createWithFlagNoBreak();
    // gridNode.before(lastPart);
    // this._DOM.insertAtEnd(
    //   lastPart,
    //   // this._node.createSignpost('(table continued)', this._signpostHeight),
    //   gridNode
    // );

    // parts handling
    splits.forEach((part, index) => this._DOM.setAttribute(part, '[part]', `${index}`));
    // LAST PART handling
    this._node.setFlagNoBreak(gridNode);

    this._node.setInitStyle (false, gridNode, nodeComputedStyle);

    this._debug._ && console.log(`%c END [grid.split]`, CONSOLE_CSS_END_LABEL);
    this._debug._ && console.groupEnd()

    return splits
  }

  _splitGridRow({ rowIndex, row, gridNode, firstPartHeight, fullPagePartHeight }) {
    if (!Array.isArray(row) || !row.length) {
      return { newRows: [], isFirstPartEmptyInAnyCell: false, needsScalingInFullPage: false };
    }

    const shells = row.map(() => 0);
    const computed = this._node.getSplitPointsPerCells(
      row,
      shells,
      firstPartHeight,
      fullPagePartHeight,
      gridNode
    );

    const splitPointsPerCell = computed.splitPointsPerCell;
    const hasSplits = splitPointsPerCell.some(list => list.length);

    if (!hasSplits) {
      return {
        newRows: [],
        isFirstPartEmptyInAnyCell: computed.isFirstPartEmptyInAnyCell,
        needsScalingInFullPage: computed.needsScalingInFullPage,
      };
    }

    const slicedPerCell = row.map((cell, index) => {
      this._node.setFlagSlice(cell);
      return this._node.sliceNodeBySplitPoints({ index, rootNode: cell, splitPoints: splitPointsPerCell[index] });
    });

    const maxSlices = Math.max(...slicedPerCell.map(arr => arr.length));
    const anchor = row[0];
    const newRows = [];

    for (let sliceIndex = 0; sliceIndex < maxSlices; sliceIndex++) {
      const fragment = this._DOM.createDocumentFragment();
      const sliceCells = [];

      row.forEach((originalCell, cellIdx) => {
        const candidates = slicedPerCell[cellIdx];
        const nextCell = candidates[sliceIndex] ? candidates[sliceIndex] : this._DOM.cloneNodeWrapper(originalCell);
        this._node.setFlagSlice(nextCell);
        fragment.append(nextCell);
        sliceCells.push(nextCell);
      });

      this._DOM.insertBefore(anchor, fragment);
      newRows.push(sliceCells);
    }

    row.forEach(cell => this._DOM.removeNode(cell));

    return {
      newRows,
      isFirstPartEmptyInAnyCell: computed.isFirstPartEmptyInAnyCell,
      needsScalingInFullPage: computed.needsScalingInFullPage,
    };
  }

  _getRowTop(row, gridNode) {
    if (Array.isArray(row)) {
      let minTop = Infinity;
      row.forEach(cell => {
        const candidate = this._node.getTop(cell, gridNode);
        if (Number.isFinite(candidate)) {
          minTop = Math.min(minTop, candidate);
        }
      });
      return minTop === Infinity ? 0 : minTop;
    }
    if (row) {
      return this._node.getTop(row, gridNode) || 0;
    }
    return 0;
  }

  _getRowBottom(row, gridNode) {
    if (Array.isArray(row)) {
      let maxBottom = -Infinity;
      row.forEach(cell => {
        const candidate = this._node.getBottom(cell, gridNode);
        if (Number.isFinite(candidate)) {
          maxBottom = Math.max(maxBottom, candidate);
        }
      });
      return maxBottom === -Infinity ? 0 : maxBottom;
    }
    if (row) {
      return this._node.getBottom(row, gridNode) || 0;
    }
    return 0;
  }

  _scanGridLayout(_node, nodeComputedStyle) {
    const autoFlow = nodeComputedStyle.gridAutoFlow || '';
    if (!autoFlow.startsWith('row')) {
      return { safe: false, reason: `grid-auto-flow=${autoFlow}` };
    }
    if (autoFlow.includes('dense')) {
      // TODO(grid): support dense flow by re-evaluating row ordering.
      return { safe: false, reason: 'grid-auto-flow dense not supported yet' };
    }

    const templateAreas = nodeComputedStyle.gridTemplateAreas || 'none';
    if (templateAreas !== 'none') {
      return { safe: false, reason: 'grid-template-areas present' };
    }

    const templateColumns = nodeComputedStyle.gridTemplateColumns || '';
    const templateRows = nodeComputedStyle.gridTemplateRows || '';
    const complexTemplate = (value) => (
      value.includes('subgrid') ||
      value.includes('auto-fit') ||
      value.includes('auto-fill') ||
      value.includes('fit-content')
    );
    if (complexTemplate(templateColumns) || complexTemplate(templateRows)) {
      return { safe: false, reason: 'complex track sizing (subgrid/auto-fit/fit-content)' };
    }

    const hasNamedLines = /\[.*?\]/.test(templateColumns) || /\[.*?\]/.test(templateRows);
    if (hasNamedLines) {
      // TODO(grid): replicate named lines per slice once templates are copied over.
      return { safe: false, reason: 'named grid lines detected' };
    }

    return { safe: true };
  }

}
