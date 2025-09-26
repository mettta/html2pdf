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

    // * Private
    this._DOM = DOM;
    this._selector = selector;
    this._node = node;

    // todo
    // 1) move to config
    // Grid:
    this._minBreakableGridRows = 4;

    // TODO make function
    // * From config:
    // - if null is set - the element is not created in createSignpost().
    this._signpostHeight = parseFloat(config.splitLabelHeight) || 0;

  }

  split(node, pageBottom, fullPageHeight, root) {
    // Flow outline (parity with simple tables):
    // 1. Collect children and partition them into visual rows.
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

    this._debug._ && console.group('%c_splitGridNode', 'background:#00FFFF');

    const children = this._node.getPreparedChildren(node);

    const nodeComputedStyle = this._DOM.getComputedStyle(node);
    const initialInlinePosition = node.style.position;
    const needsTempPosition = nodeComputedStyle.position === 'static';
    const restorePosition = () => {
      if (!needsTempPosition) return;
      if (initialInlinePosition) {
        this._DOM.setStyles(node, { position: initialInlinePosition });
      } else {
        node.style.removeProperty('position');
      }
    };

    if (!children.length) {
      restorePosition();
      this._debug._ && console.groupEnd();
      return [];
    }

    if (needsTempPosition) {
      // In some layouts grid stays `position: static`; force a relative context so
      // offset-based getters work (otherwise offsets are taken from body and rows
      // start looking like a single chunk).
      this._DOM.setStyles(node, { position: 'relative' });
    }

    const layoutScan = this._scanGridLayout(node, nodeComputedStyle);
    if (!layoutScan.safe) {
      this._debug._ && console.warn('[grid.split] skip:', layoutScan.reason);
      restorePosition();
      this._debug._ && console.groupEnd();
      return [];
    }

    const ROW_TOP_STEP = 0.5; // tolerate sub-pixel jitter when detecting row breaks
    const rowGroups = [];
    const rowTops = [];
    let hasRowSpan = false;
    let hasColumnSpan = false;
    const rowIndexSet = new Set();

    children.forEach((child) => {
      const top = this._node.getTop(child, node);
      const lastTop = rowTops.length ? rowTops[rowTops.length - 1] : null;
      if (!rowGroups.length || Math.abs(top - lastTop) > ROW_TOP_STEP) {
        rowGroups.push([child]);
        rowTops.push(top);
        return;
      }
      // Rely on vertical position only: we support linear, monotonic grids for now.
      rowGroups[rowGroups.length - 1].push(child);

      const childStyle = this._DOM.getComputedStyle(child);
      const rowEnd = childStyle.gridRowEnd || '';
      const colEnd = childStyle.gridColumnEnd || '';
      hasRowSpan = hasRowSpan || rowEnd.includes('span');
      hasColumnSpan = hasColumnSpan || colEnd.includes('span');

      const rowStart = parseInt(childStyle.gridRowStart, 10);
      Number.isFinite(rowStart) && rowIndexSet.add(rowStart);
    });

    const gridNodeRows = rowGroups.length;
    const gridNodeHeight = this._DOM.getElementOffsetHeight(node);

    const hasImplicitRowGaps = rowIndexSet.size > 0 && Math.max(...rowIndexSet) > gridNodeRows;
    if (hasImplicitRowGaps) {
      this._debug._ && console.warn('[grid.split] skip: implicit row gaps detected');
      restorePosition();
      this._debug._ && console.groupEnd();
      return [];
    }

    if (hasRowSpan || hasColumnSpan) {
      this._debug._ && console.warn('[grid.split] skip: span detected (row or column)');
      restorePosition();
      this._debug._ && console.groupEnd();
      return [];
    }

    // ** If there are enough rows for the split to be readable,
    // ** and the node is not too big (because of the content),
    // ** then we will split it.
    // TODO: make the same condition for all like-table:
    if (gridNodeRows < this._minBreakableGridRows && gridNodeHeight < fullPageHeight) {
      // ** Otherwise, we don't split it.
      this._debug._ && console.log(`%c END DONT _splitGridNode`, CONSOLE_CSS_END_LABEL);
      restorePosition();
      this._debug._ && console.groupEnd();
      return []
    }

    // ** We want to know the top point of each row
    // ** to calculate the parts to split.
    // ** After sorting, we can use [0] as the smallest element for this purpose.
    // [ [top, top, top], [top, top, top], [top, top, top] ] =>
    // [ [min-top, top, max-top], [min-top, top, max-top], [min-top, top, max-top] ] =>
    // [min-top, min-top, min-top]
    const gridPseudoRowsTopPoints = [...rowTops, gridNodeHeight];


    this._debug._ && console.log(
      'gridPseudoRowsTopPoints', gridPseudoRowsTopPoints
    );

    // ** Calculate the possible parts.
    // TODO: same as the table

    // ** Prepare node parameters
    const nodeTop = this._node.getTop(node, root);
    const nodeWrapperHeight = this._node.getEmptyNodeHeight(node);
    const firstPartHeight = pageBottom
      - nodeTop
      // - this._signpostHeight
      - nodeWrapperHeight;
    const fullPagePartHeight = fullPageHeight
      // - 2 * this._signpostHeight
      - nodeWrapperHeight;

    this._debug._ && console.log(
      '\n • firstPartHeight', firstPartHeight,
      '\n • fullPagePartHeight', fullPagePartHeight
    );

    // TODO 1267 -  как в таблице

    // * Calculate grid Splits Ids

    const topsArr = gridPseudoRowsTopPoints;

    let splitsIds = [];
    let currentPageBottom = firstPartHeight;

    for (let index = 0; index < topsArr.length; index++) {

      if (topsArr[index] > currentPageBottom) {

        // CASE: row `index` would overflow the current window.
        // TODO split long row: when a single row is taller than the window, slice content.

        if (index > 0) {
          // Normal case: keep at least one row per slice, register previous row as split.
          splitsIds.push(index - 1);
        } else {
          // First row does not fit tail window.
          // For now we move it to the next page by stepping currentPageBottom forward.
          this._debug._ && console.warn('[grid.split] row0 overflow tail window → use full-page window');
        }

        currentPageBottom = topsArr[Math.max(index - 1, 0)] + fullPagePartHeight;

        // 🚧 Future: if still overflowing after escalation, fall back to scaling.

      }
    };

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

      const part = this._DOM.cloneNodeWrapper(node);
      this._node.copyNodeWidth(part, node);
      this._node.setFlagNoBreak(part);
      node.before(part);

      if (startId) {
        // if is not first part
        // this._DOM.insertAtEnd(part, this._node.createSignpost('(table continued)', this._signpostHeight));

        // TODO: insertions between parts will not disturb the original layout & CSS.
        // Therefore, it is possible to insert an element after and before the parts
        // and specify that the node is being broken.
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
      node
    ];

    this._debug._ && console.log(
      'splits', splits
    );

    // create LAST PART
    // TODO ??? is that really needed?
    // const lastPart = this._node.createWithFlagNoBreak();
    // node.before(lastPart);
    // this._DOM.insertAtEnd(
    //   lastPart,
    //   // this._node.createSignpost('(table continued)', this._signpostHeight),
    //   node
    // );

    // parts handling
    splits.forEach((part, index) => this._DOM.setAttribute(part, '[part]', `${index}`));
    // LAST PART handling
    this._node.setFlagNoBreak(node);

    restorePosition();

    this._debug._ && console.log(`%c END _splitGridNode`, CONSOLE_CSS_END_LABEL);
    this._debug._ && console.groupEnd()

    return splits
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
