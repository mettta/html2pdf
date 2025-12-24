import FlagStore from './flagStore.js';
import MarkersRegistry from './registry.js';

// Central markers state:
// - flags: logical markers (WeakMap + optional Symbol/attributes)
// - registry: structural markers (pageStart/pageEnd/pageNumber)
export default class MarkersState {
  constructor(flagOptions = {}) {
    this.flags = new FlagStore(flagOptions);
    this.registry = new MarkersRegistry();
  }
}
