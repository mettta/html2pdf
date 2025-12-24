export const FLAG_DEFS = {
  processed: {
    kind: 'debug',
    selectorKey: 'processed',
    attributeValue: (value) => '🏷️ ' + value,
  },
  noBreak: { kind: 'runtime', selectorKey: 'flagNoBreak' },
  noHanging: { kind: 'runtime', selectorKey: 'flagNoHanging' },
  slice: { kind: 'runtime', selectorKey: 'flagSlice' },
  pageStart: { kind: 'structural', selectorKey: 'pageStartMarker', registry: 'pageStart' },
  pageEnd: { kind: 'structural', selectorKey: 'pageEndMarker', registry: 'pageEnd' },
  pageNumber: { kind: 'structural', selectorKey: 'pageMarker', registry: 'pageNumber' },
  cleanTopCut: { kind: 'runtime', selectorKey: 'cleanTopCut' },
  cleanBottomCut: { kind: 'runtime', selectorKey: 'cleanBottomCut' },
  topCut: { kind: 'runtime', selectorKey: 'topCutPart' },
  bottomCut: { kind: 'runtime', selectorKey: 'bottomCutPart' },
  split: { kind: 'runtime', selectorKey: 'split' },
};
