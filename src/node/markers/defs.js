export const FLAG_DEFS = {
  // ✴️ structural
  // * needs fast lookup by key (e.g., page number), so it is indexed in registry.
  // * DOM attributes are written only in debug/test.
  pageStart: { kind: 'structural', selectorKey: 'pageStartMarker', registry: 'pageStart' },
  pageEnd: { kind: 'structural', selectorKey: 'pageEndMarker', registry: 'pageEnd' },
  pageNumber: { kind: 'structural', selectorKey: 'pageMarker', registry: 'pageNumber' },
  // ✴️ runtime-only
  // * local logic flags; read via hasFlag(element, key). No registry or global lookup is needed.
  // * DOM attributes are written only in debug/test.
  noBreak: { kind: 'runtime', selectorKey: 'flagNoBreak' },
  noHanging: { kind: 'runtime', selectorKey: 'flagNoHanging' },
  slice: { kind: 'runtime', selectorKey: 'flagSlice' },
  split: { kind: 'runtime', selectorKey: 'split' },
  // ✴️ debug-only
  // * DOM attributes are written only when markupDebugMode is enabled.
  processed: {
    kind: 'debug',
    selectorKey: 'processed',
    attributeValue: (value) => '🏷️ ' + value,
  },
  // ✴️ style
  // * DOM attributes are always written (required by CSS).
  cleanTopCut: { kind: 'style', selectorKey: 'cleanTopCut' },
  cleanBottomCut: { kind: 'style', selectorKey: 'cleanBottomCut' },
  topCut: { kind: 'style', selectorKey: 'topCutPart' },
  bottomCut: { kind: 'style', selectorKey: 'bottomCutPart' },
};
