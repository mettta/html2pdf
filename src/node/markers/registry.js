export default class MarkersRegistry {
  constructor() {
    this.pageStart = new Map();
    this.pageEnd = new Map();
    this.pageDividerByPage = new Map();
    // Page -> Set of elements that carry that page number.
    this.pageNumberByPage = new Map();
    // Element -> page number (fast reverse lookup).
    this.pageNumberByElement = new WeakMap();
  }
}
