// Lightweight caches for expensive layout reads.

const DEFAULT_KEY = 'default';

export default class MeasureCache {
  constructor() {
    this._bcr = new WeakMap();
    this._styles = new WeakMap();
  }

  getBCR(element, key = DEFAULT_KEY, getter) {
    if (!element) return;
    const bucket = this._getBucket(this._bcr, element);
    if (bucket.has(key)) return bucket.get(key);
    const value = getter ? getter() : element.getBoundingClientRect();
    bucket.set(key, value);
    return value;
  }

  getStyle(element, key = DEFAULT_KEY, getter) {
    if (!element) return;
    const bucket = this._getBucket(this._styles, element);
    if (bucket.has(key)) return bucket.get(key);
    const value = getter ? getter() : window.getComputedStyle(element);
    bucket.set(key, value);
    return value;
  }

  delete(element) {
    if (!element) return;
    this._bcr.delete(element);
    this._styles.delete(element);
  }

  reset() {
    this._bcr = new WeakMap();
    this._styles = new WeakMap();
  }

  _getBucket(store, element) {
    let bucket = store.get(element);
    if (!bucket) {
      bucket = new Map();
      store.set(element, bucket);
    }
    return bucket;
  }
}
