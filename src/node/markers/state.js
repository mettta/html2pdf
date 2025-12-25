import MarkStore from './markStore.js';
import MarkersRegistry from './registry.js';

// Central markers state:
// - marks: logical markers (WeakMap + optional Symbol/attributes)
// - registry: structural markers (pageStart/pageEnd/pageNumber)
export default class MarkersState {
  constructor(markOptions = {}) {
    this.marks = new MarkStore(markOptions);
    this.registry = new MarkersRegistry();
  }
}
