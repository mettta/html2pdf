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
 * Scales only those cell contents that overflow their per-cell height budget
 * to fit totalRowHeight.
 *
 * Intended to be generic across layouts (tables, grids, etc.). The caller
 * provides the list of cell elements and the total target height for the
 * whole row (or logical line). Each cell’s budget is computed as
 *   target = max(0, totalRowHeight - shellHeight[cellIndex])
 * where shellHeight is the structural contribution of the cell (padding,
 * borders, alignment), measured by the caller. If a cell’s content exceeds
 * its budget, the content is wrapped in a neutral block (if not already)
 * and visually scaled to fit using fitElementWithinHeight.
 *
 * Reuses a neutral wrapper (single neutral child) or wraps all children.
 * Measures via getContentHeightByProbe; scales with fitElementWithinHeight.
 * Returns true if any cell was scaled. Layout‑agnostic (table/grid).
 *
 * @this {Node}
 * @param {Element[]} list of cell elements (e.g., TDs or grid cells)
 * @param {number} totalRowHeight - total allowed height for the row/line
 * @param {number[]} [shellsOpt] - per-cell shell heights; if absent, treated as zeros
 * @returns {boolean} whether any cell was scaled
 */
export function scaleCellsToHeight(cells, totalRowHeight, shellsOpt) {
  const shells = Array.isArray(shellsOpt) ? shellsOpt : new Array(cells.length).fill(0);
  let scaled = false;

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const shellH = shells[i] || 0;
    const target = Math.max(0, totalRowHeight - shellH);
    if (target <= 0) continue;

    const onlyOneElementChild = this._DOM.getChildren(cell).length === 1;
    const firstChildEl = this._DOM.getFirstElementChild(cell);

    let contentWrapper = null;
    let contentH;

    if (onlyOneElementChild && firstChildEl && this.isNeutral(firstChildEl)) {
      contentWrapper = firstChildEl;
      contentH = this._DOM.getElementOffsetHeight(contentWrapper) || 0;
    } else if (shellsOpt) {
      // When caller provides shell heights (grid path), infer content height from
      // the current box instead of probing cloned nodes: offsetHeight already
      // includes padding/borders and stays valid during pagination clones.
      const cellOuterHeight = this._DOM.getElementOffsetHeight(cell) || 0;
      contentH = Math.max(0, cellOuterHeight - shellH);
    } else {
      contentH = this.getContentHeightByProbe(cell);
    }

    if (contentH > target) {
      if (!contentWrapper) {
        // Wrap dynamic content once and remeasure via offsetHeight so repeated
        // scaling avoids offsetParent churn.
        contentWrapper = this.wrapNodeChildrenWithNeutralBlock(cell);
        contentH = this._DOM.getElementOffsetHeight(contentWrapper) || contentH;
      }
      this.fitElementWithinHeight(contentWrapper, target);
      scaled = true;
      _isDebug(this) && console.warn('💢 scaleCellsToHeight: resized cell content', { cell, target });
    }
  }

  return scaled;
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

/**
 * @this {Node}
 */
export function lockNodesWidths(nodes) {
  if (!Array.isArray(nodes)) return;
  nodes.forEach(node => {
    if (node) {
      this.copyNodeWidth(node, node);
    }
  });
}

/**
 * Estimate extra empty space (px) under an inline <img> caused by baseline alignment.
 * Fast path: uses only computed font-size & line-height; no canvas, no layout reads.
 *
 * Formula:
 *          gap ≈ halfLeading + descentRatio * fontSize
 * where halfLeading = max(0, (lineHeight - fontSize)/2)
 *
 * * Usage:
 *  const px = estimateInlineImgGapBelow(parentElement);
 *  or with a safer upper bound for unknown fonts:
 *  const pxSafe = estimateInlineImgGapBelow(parentElement, { descentRatio: 0.26, safety: 1.05 });
 *
 * @this {Node}
 *
 * @param {Element} parentEl - inline formatting context parent of the image
 * @param {Object} [opt]
 * @param {number} [opt.descentRatio=0.22]
 *   Heuristic fraction of font-size that approximates font descent.
 *   - Typical western/Latin fonts have descent ≈ 18–28% of em.
 *   - 0.22 is a pragmatic middle; adjust per your font stack if needed.
 * @param {number} [opt.normalLH=1.2]
 *   Fallback multiplier for CSS `line-height: normal` (UA default is ~1.2).
 * @param {number} [opt.safety=1.0]
 *   Extra safety factor (>1 inflates estimate). Example: 1.05 adds ~5% headroom.
 * @returns {number} Integer pixels, rounded up.
 */
export function estimateInlineImgGapBelow(parentEl, opt = {}) {
  const { descentRatio = 0.22, normalLH = 1.2, safety = 1.0 } = opt;

  const cs = getComputedStyle(parentEl);
  const fs = parseFloat(cs.fontSize) || 0;

  // Resolve line-height: 'normal' -> normalLH * font-size
  let lh;
  if (cs.lineHeight === 'normal' || !cs.lineHeight) {
    lh = normalLH * fs;
  } else {
    // Handles unitless and px values uniformly
    const n = parseFloat(cs.lineHeight);
    lh = Number.isFinite(n) ? n : normalLH * fs;
  }

  // Lower half of leading (empty space added above & below the em box).
  const halfLeading = Math.max(0, (lh - fs) / 2);

  // Descent approximation: fraction of em (font-size).
  // Rationale:
  //   - Fonts vary; 0.18–0.28 is common for Latin scripts.
  //   - Choose 0.22 as default; bump to 0.24–0.26 if you use fonts with larger descents.
  const descent = descentRatio * fs;

  // Estimated gap under baseline-aligned inline image
  const raw = (halfLeading + descent) * safety;

  // Return integer px, rounded up (conservative).
  return Math.ceil(raw);
}
