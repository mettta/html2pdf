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
  if (ctx._assert) {
    const rowsLen = (tableEntries && tableEntries.rows) ? tableEntries.rows.length : 0;
    console.assert(Number.isInteger(startId) && Number.isInteger(endId),
      `createAndInsertTableSlice: non-integer bounds: startId=${startId}, endId=${endId}`);
    console.assert(rowsLen >= 0, `createAndInsertTableSlice: invalid rows length: ${rowsLen}`);
    console.assert(startId >= 0 && endId >= 0 && startId < endId && endId <= rowsLen,
      `createAndInsertTableSlice: out-of-range slice [${startId}, ${endId}) for rowsLen=${rowsLen}`);
  }

  const tableSliceWrapper = ctx._node.createWithFlagNoBreak();
  ctx._DOM.insertBefore(table, tableSliceWrapper);

  const partEntries = tableEntries.rows.slice(startId, endId);

  if (startId) {
    ctx._DOM.insertAtEnd(
      tableSliceWrapper,
      createTopSignpost(ctx),
    );
  }

  const tableSlice = ctx._node.createTable({
    wrapper: ctx._DOM.cloneNodeWrapper(table),
    colgroup: ctx._DOM.cloneNode(tableEntries.colgroup),
    caption: ctx._DOM.cloneNode(tableEntries.caption),
    thead: ctx._DOM.cloneNode(tableEntries.thead),
    // tfoot is only in the final part
    tbody: partEntries,
  });

  ctx._DOM.insertAtEnd(
    tableSliceWrapper,
    tableSlice,
    createBottomSignpost(ctx),
  );

  return tableSliceWrapper;
}

// 🤖 Create the final slice wrapper, moving the original table (with TFOOT) and adding top continuation label.
export function createAndInsertTableFinalSlice(ctx, { table }) {
  const tableSliceWrapper = ctx._node.createWithFlagNoBreak();
  ctx._DOM.insertBefore(table, tableSliceWrapper);
  ctx._DOM.insertAtEnd(
    tableSliceWrapper,
    createTopSignpost(ctx),
    table // includes tfoot if present
  );
  return tableSliceWrapper;
}
