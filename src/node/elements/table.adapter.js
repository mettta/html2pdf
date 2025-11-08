// Table-specific slice builders. No behavior change vs inlined methods.

// 🤖 Build the continuation signpost displayed above intermediate table parts.
// TODO(config): move signpost text/height to external config
function createTopSignpost(ctx) {
  return ctx._node.createSignpost('(table continued)', ctx._signpostHeight);
}

// 🤖 Build the continuation signpost displayed below non-final parts.
// TODO(config): move signpost text/height to external config
function createBottomSignpost(ctx) {
  return ctx._node.createSignpost('(table continues on the next page)', ctx._signpostHeight);
}

// 🤖 Create and insert a non-final table slice (tbody fragment) before the original table.
// 🤖 Geometry: clones structural pieces (caption/thead/colgroup) and wraps rows [startId, endId) into a no-break container.
export function createAndInsertTableSlice(ctx, { startId, endId, table, tableEntries }) {
  ctx.strictAssert(Number.isInteger(startId) && Number.isInteger(endId),
  `createAndInsertTableSlice: non-integer bounds: startId=${startId}, endId=${endId}`);
  const rowsLen = (tableEntries && tableEntries.rows) ? tableEntries.rows.length : 0;
  ctx.strictAssert(rowsLen >= 0, `createAndInsertTableSlice: invalid rows length: ${rowsLen}`);
  ctx.strictAssert(startId >= 0 && endId >= 0 && startId < endId && endId <= rowsLen,
    `createAndInsertTableSlice: out-of-range slice [${startId}, ${endId}) for rowsLen=${rowsLen}`);

  const partEntries = tableEntries.rows.slice(startId, endId);

  const tableSlice = ctx._node.createTable({
    wrapper: ctx._DOM.cloneNodeWrapper(table),
    colgroup: ctx._DOM.cloneNode(tableEntries.colgroup),
    caption: ctx._DOM.cloneNode(tableEntries.caption),
    thead: ctx._DOM.cloneNode(tableEntries.thead),
    // tfoot is only in the final part
    tbody: partEntries,
  });

  const nodes = [];
  let topSignpost = null;
  if (startId) {
    // * At the cut point (has startId), we insert a forced page break to prevent topSignpost
    // * from going over to the previous page if the previews table part are short due to the content.
    const forcedPBElement = ctx._node.createForcedPageBreak();
    nodes.push(forcedPBElement);

    topSignpost = createTopSignpost(ctx);
    if (topSignpost) {
      ctx._node.setFlagNoBreak(topSignpost);
      nodes.push(topSignpost);
    }
    // * normalize top cut for table slices
    // ? may affect the table design
    // todo: include in user config
    ctx._node.markTopCut(tableSlice);
  }
  // * normalize bottom cut for table slices
  ctx._node.markBottomCut(tableSlice);

  ctx._node.setFlagNoBreak(tableSlice);
  nodes.push(tableSlice);

  const bottomSignpost = createBottomSignpost(ctx);
  if (bottomSignpost) {
    ctx._node.setFlagNoBreak(bottomSignpost);
    nodes.push(bottomSignpost);
  }

  ctx._DOM.insertBefore(table, ...nodes);

  return {
    nodes,
    mainPart: tableSlice,
    signposts: {
      top: topSignpost,
      bottom: bottomSignpost,
    },
  };
}

// 🤖 Create the final slice wrapper, moving the original table (with TFOOT) and adding top continuation label.
export function createAndInsertTableFinalSlice(ctx, { table }) {
  // * normalize top cut for table slices
  // ? may affect the table design
  // todo: include in user config
  ctx._node.markTopCut(table);

  ctx._node.setFlagNoBreak(table);

  const nodes = [];

  // * At the cut point before the last part, we insert a forced page break to prevent topSignpost
  // * from going over to the previous page if the previews table part are short due to the content.
  const forcedPBElement = ctx._node.createForcedPageBreak();
  nodes.push(forcedPBElement);

  const topSignpost = createTopSignpost(ctx);
  if (topSignpost) {
    ctx._node.setFlagNoBreak(topSignpost);
    nodes.push(topSignpost);
  }

  ctx._DOM.insertBefore(table, ...nodes);
  nodes.push(table);

  return {
    nodes,
    mainPart: table,
    signposts: {
      top: topSignpost,
      bottom: null,
    },
  };
}
