const debugConfig = {
  DOM: {
    _: false,
  },
  layout: {
    _: true,
  },
  pages: {
    _: false,
    // * `Pages` methods
    _parseNode: false,
    _parseNodes: false,
    _registerPageStart: false,
  },
  paper: {
    _: false,
  },
  preview: {
    _: false,
  },
  toc: {
    _: false,
  },
  // * `Node` group
  node: {
    _: false,
    // * `Node` modules
    children: true,
    creators: false,
    fitters: true,
    getters: false,
    markers: false,
    pagebreaks: true,
    positioning: false,
    selectors: false,
    slicers: true,
    splitters: false,
    wrappers: false,
  },
  paragraph: {
    _: false,
  },
  grid: {
    _: false,
  },
  pre: {
    _: false,
  },
  table: {
    _: true,
  },
  tableLike: {
    _: false,
  },
};

export default debugConfig;
