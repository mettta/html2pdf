// Grid-specific slice builders. No signposts, no tfoot/thead.

export function createAndInsertGridSlice(context, { startId, endId, node, entries, fallbackCurrentRows }) {
  // We do not wrap with createWithFlagNoBreak to avoid CSS breakage; clone wrapper instead.
  const part = context._DOM.cloneNodeWrapper(node);
  context._node.copyNodeWidth(part, node);
  context._node.setFlagNoBreak(part);

  if (startId) {
    // * normalize top cut for table slices
    // ? may affect the table design
    // todo: include in user config
    context._node.markTopCut(part);
  }
  // * normalize bottom cut for table slices
  context._node.markBottomCut(part);


  node.before(part);

  const currentRows = entries?.currentRows || fallbackCurrentRows || [];
  // currentRows arrive via the shared entries container; fallback keeps older callers working.

  // Allow the DOM module to tell us what counts as an element.
  // Grid adapters sit between plain HTMLElements and wrappers returned by getPreparedChildren,
  // and test/SSR environments may not expose global HTMLElement reliably.
  const isElementNodeFn = (context && context._DOM && typeof context._DOM.isElementNode === 'function')
    ? context._DOM.isElementNode.bind(context._DOM)
    : null;

  const partEntries = currentRows
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

  context._DOM.insertAtEnd(part, ...partEntries);
  return part;
}

export function createAndInsertGridFinalSlice(context, { node, entries }) {
  // * Final slice is the original node (flagged no-break) left in place.

  // * normalize top cut for table slices
  // ? may affect the table design
  // todo: include in user config
  context._node.markTopCut(node);

  context._node.setFlagNoBreak(node);
  return node;
}

