/**
 * @this {Node}
 */
export function fitElementWithinBoundaries({ element, height, width, vspace, hspace }) {

  const hRatio = vspace / height;
  const wRatio = hspace / width;

  const ratio = hRatio < wRatio ? hRatio : wRatio;

  const newHeight = Math.trunc(height * ratio);
  const newWidth = Math.trunc(width * ratio);

  this._DOM.setStyles(element, {
    height: newHeight + 'px',
    width: newWidth + 'px',

    // todo
    // margin: '0 auto',
  });

  // In SVG width and height of <rect> elements are attributes and not CSS properties
  this._DOM.setAttribute(element, "height", `${newHeight}px`);
  this._DOM.setAttribute(element, "width", `${newWidth}px`);
}

/**
 * @this {Node}
 */
export function copyNodeWidth(clone, node) {
  this._DOM.setStyles(clone, {
    'width': `${this._DOM.getElementOffsetWidth(node)}px`,
    // * if in COLGROUP/COL were set 'width',
    // * it defines a minimum width for the columns within the column group,
    // * as if min-width were set.
    // * And this COLGROUP/COL rule has precedence in CSS rules,
    // * so just 'width' in TD won't be able to override the one set in COL.
    'min-width': `${this._DOM.getElementOffsetWidth(node)}px`,
  });
}

/**
 * @this {Node}
 */
export function lockTableWidths(table) {
  this.copyNodeWidth(table, table);
  this.getAll('td', table).forEach(
    td => this.copyNodeWidth(td, td)
  )
}
