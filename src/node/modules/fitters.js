// 🪚 fitters

import { debugFor } from '../utils/debugFor.js';
const _isDebug = debugFor('fitters');

/**
 * Scales an element to fit within given vertical and horizontal space.
 * Maintains aspect ratio. Sets fixed pixel dimensions (CSS + SVG).
 *
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
 * Scales element visually to fit target height using transform: scale.
 * Since this doesn't reduce layout height, wraps element in a fixed-height block
 * to constrain flow.
 *
 * @this {Node}
 */
export function fitElementWithinHeight(element, targetHeight) {
  // `transform: scale` does not affect the element’s box model or its parent’s layout
  //  because scaling is a visual transformation only, not part of normal document flow.
  // `transform: scale` visually changes the size of an element, but its actual size in the layout
  //  stays the same — so the parent doesn’t shrink or grow based on the scaled size.
  const actualHeight = this._DOM.getElementOffsetHeight(element);

  if (actualHeight <= targetHeight) return;

  const scale = targetHeight / actualHeight;

  element.style.transformOrigin = 'top left';
  element.style.transform = `scale(${scale})`;

  // const scaler = this.create('div');
  const scaler = this.createNeutral();
  scaler.style.display = 'inline-block';
  scaler.style.verticalAlign = 'top';
  scaler.style.width = '100%';
  scaler.style.height = targetHeight + 'px';

  this._DOM.wrap(element, scaler);

  _isDebug(this) && console.warn(
    `%c Scaled element to fit target height: ${targetHeight}px`,
    'color:orange; font-weight:bold;',
    `scale: ${scale}`,
    element
  );
}

/**
 * @this {Node}
 */
export function copyNodeWidth(clone, node) {
  this._DOM.setStyles(clone, {
    'box-sizing': 'border-box', // * to prevent the effects of borders etc.
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
  this._DOM.getAll('td', table).forEach(
    td => this.copyNodeWidth(td, td)
  )
}
