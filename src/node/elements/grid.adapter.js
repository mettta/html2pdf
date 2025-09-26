// Grid-specific slice builders. No signposts, no tfoot/thead.

export function createAndInsertGridSlice(ctx, { startId, endId, node, childrenGroups }) {
  // We do not wrap with createWithFlagNoBreak to avoid CSS breakage; clone wrapper instead.
  const part = ctx._DOM.cloneNodeWrapper(node);
  ctx._node.copyNodeWidth(part, node);
  ctx._node.setFlagNoBreak(part);
  node.before(part);

  const partEntries = childrenGroups
    .slice(startId, endId)
    .flat()
    .map(obj => obj.element);

  ctx._DOM.insertAtEnd(part, ...partEntries);
  return part;
}

export function createAndInsertGridFinalSlice(ctx, { node }) {
  // Final slice is the original node (flagged no-break) left in place.
  ctx._node.setFlagNoBreak(node);
  return node;
}

