import FlagStore from './flagStore.js';
import MeasureCache from './measureCache.js';

// Central per-Node state:
// - flags: long-lived logical markers (WeakMap + optional Symbol/attributes)
// - measure: short-lived caches for layout reads (BCR/computed styles), reset manually

export default class NodeState {
  constructor(flagOptions = {}) {
    this.flags = new FlagStore(flagOptions);
    this.measure = new MeasureCache();
    this.registry = {
      pageStart: new Map(),
      pageEnd: new Map(),
      // Page -> Set of elements that carry that page number.
      pageNumberByPage: new Map(),
      // Element -> page number (fast reverse lookup).
      pageNumberByElement: new WeakMap(),
    };
  }

  resetMeasureCache() {
    this.measure.reset();
  }
}
