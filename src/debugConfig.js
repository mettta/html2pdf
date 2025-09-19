const debugConfig = {
  DOM: {
    _: false,
  },
  layout: {
    _: true,
  },
  pages: {
    _: true,
    // * `Pages` methods
    _parseNode: true,
    _parseNodes: true,
    _registerPageStart: true,
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
    _: true,
    // * `Node` modules
    children: true,
    creators: true,
    fitters: true,
    getters: true,
    markers: true,
    pagebreaks: true,
    positioning: true,
    selectors: true,
    slicers: true,
    splitters: true,
    wrappers: true,
  },
  paragraph: {
    _: true,
  },
  grid: {
    _: true,
  },
  pre: {
    _: true,
  },
  table: {
    _: true,
  },
  tableLike: {
    _: true,
  },
};

export default debugConfig;
