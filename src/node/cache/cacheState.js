import MeasureCache from './measureCache.js';

// Central per-Node cache state:
// - measure: short-lived caches for layout reads (BCR/computed styles), reset manually

export default class CacheState {
  constructor() {
    this.measure = new MeasureCache();
  }

  resetMeasureCache() {
    this.measure.reset();
  }
}
