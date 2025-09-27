// Grid-specific slice builders. No signposts, no tfoot/thead.

export function createAndInsertGridSlice(ctx, { startId, endId, node, childrenGroups }) {
  // We do not wrap with createWithFlagNoBreak to avoid CSS breakage; clone wrapper instead.
  const part = ctx._DOM.cloneNodeWrapper(node);
  ctx._node.copyNodeWidth(part, node);
  ctx._node.setFlagNoBreak(part);
  node.before(part);

  // Allow the DOM module to tell us what counts as an element.
  // Grid adapters sit between plain HTMLElements and wrappers returned by getPreparedChildren,
  // and test/SSR environments may not expose global HTMLElement reliably.
  const isElementNodeFn = (ctx && ctx._DOM && typeof ctx._DOM.isElementNode === 'function')
    ? ctx._DOM.isElementNode.bind(ctx._DOM)
    : null;

  const partEntries = childrenGroups
    .slice(startId, endId)
    .flat()
    .map(candidate => {
      if (!candidate) return null;
      if (isElementNodeFn && isElementNodeFn(candidate)) {
        return candidate;
      }
      if (typeof HTMLElement !== 'undefined' && candidate instanceof HTMLElement) {
        return candidate;
      }
      const element = candidate.element;
      if (element) {
        if (isElementNodeFn && isElementNodeFn(element)) {
          return element;
        }
        if (typeof HTMLElement !== 'undefined' && element instanceof HTMLElement) {
          return element;
        }
      }
      // Returning null lets .filter(Boolean) drop non-element placeholders quietly;
      // getPreparedChildren may emit helper descriptors that are not renderable nodes.
      return null;
    })
    .filter(Boolean);

  ctx._DOM.insertAtEnd(part, ...partEntries);
  return part;
}

export function createAndInsertGridFinalSlice(ctx, { node }) {
  // Final slice is the original node (flagged no-break) left in place.
  ctx._node.setFlagNoBreak(node);
  return node;
}

