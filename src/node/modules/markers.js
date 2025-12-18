// 🚩 markers

import { debugFor } from '../utils/debugFor.js';
const _isDebug = debugFor('markers');

/**
 * @this {Node}
 */
export function markProcessed(element, value) {
  this._markupDebugMode && this._DOM.setAttribute(element, this._selector.processed, '🏷️ ' + value)
}

/**
 * @this {Node}
 */
export function setFlagNoBreak(element) {
  this._DOM.setAttribute(element, this._selector.flagNoBreak)
}

/**
 * @this {Node}
 */
export function setFlagNoHanging(element, value) {
  this._DOM.setAttribute(element, this._selector.flagNoHanging, value)
}

/**
 * @this {Node}
 */
export function setFlagSlice(element) {
  this._DOM.setAttribute(element, this._selector.flagSlice)
}

/**
 * @this {Node}
 */
export function markPageStartElement(element, pageNum) {
  this._DOM.setAttribute(element, this._selector.pageStartMarker, `${pageNum}`);
}

/**
 * @this {Node}
 */
export function unmarkPageStartElement(element) {
  this._DOM.removeAttribute(element, this._selector.pageStartMarker);
}

/**
 * @this {Node}
 */
export function markPageEndElement(element, pageNum) {
  this._DOM.setAttribute(element, this._selector.pageEndMarker, `${pageNum}`);
}

/**
 * @this {Node}
 */
export function markPageNumber(element, pageNum) {
  this._DOM.setAttribute(element, this._selector.pageMarker, `${pageNum}`);
}

/**
 * @this {Node}
 */
export function markCleanTopCut(element) {
  _isDebug(this) && console.log('[mark ⊤ cut]', element);
  element && this._DOM.setAttribute(element, this._selector.cleanTopCut);
}

/**
 * @this {Node}
 */
export function markCleanBottomCut(element) {
  _isDebug(this) && console.log('[mark ⊥ cut]', element);
  element && this._DOM.setAttribute(element, this._selector.cleanBottomCut);
}

/**
 * @this {Node}
 */
export function markTopCut(element) {
  _isDebug(this) && console.log('[mark ⊤ cut]', element);
  element && this._DOM.setAttribute(element, this._selector.topCutPart);
}

/**
 * @this {Node}
 */
export function markBottomCut(element) {
  _isDebug(this) && console.log('[mark ⊥ cut]', element);
  element && this._DOM.setAttribute(element, this._selector.bottomCutPart);
}

/**
 * @this {Node}
 */
export function markSliceCuts(slices) {
  if (!slices || !slices.length) {
    // There is no slices
    _isDebug(this) && console.log('%c[markSliceCuts] Slices were not passed. Doing nothing.', 'color:red');
    return
  }
  if (slices.length === 1) {
    // There is no cuts
    _isDebug(this) && console.log('%c[markSliceCuts] There is no cuts in one slice. Doing nothing.', 'color:blue');
    return
  }

  for (let i = 0; i < slices.length; i++) {
    const exceptFirst = i > 0;
    const exceptLast = i < slices.length - 1;
    const slice = slices[i];
    _isDebug(this) && console.log('[markSliceCuts] slice', i, slice);

    if (exceptFirst) {
      // * normalize top cut
      _isDebug(this) && console.log('[markSliceCuts] slice 🖍️ ⊥', slice);
      this.markTopCut(slice);
    }

    if (exceptLast) {
      // * normalize bottom cut
      _isDebug(this) && console.log('[markSliceCuts] slice 🖍️ ⊤', slice);
      this.markBottomCut(slice);
    }
  }
}

/**
 * @this {Node}
 */
export function markSliceCutsInRows(rows) {
  _isDebug(this) && console.log('[markSliceCutsInRows] rows', rows);
  if (!rows || !rows.length) {
    // There is no rows
    _isDebug(this) && console.log('%c[markSliceCutsInRows] The rows were not passed. Doing nothing.', 'color:red');
    return
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowExceptFirst = i > 0;
    const rowExceptLast = i < rows.length - 1;
    _isDebug(this) && console.log('[markSliceCutsInRows] row', i, row);

    let rowWrapper;
    let cellWrappers;

    if (row instanceof HTMLElement) {
      _isDebug(this) && console.log('%c[markSliceCutsInRows] It is a <TR>', 'color:blue', row);
      rowWrapper = row; // real TR
      cellWrappers = [...this._DOM.getChildren(row)]; // TDs
    }
    else if (Array.isArray(row)) {
      _isDebug(this) && console.log('%c[markSliceCutsInRows] It is an Array', 'color:blue', row);
      rowWrapper = undefined; // not exists
      cellWrappers = row; // cells in virtual row
    } else {
      this.strictAssert(0, 'we expected TR or an array of elements!')
    }

    if (!rowWrapper && !cellWrappers.length) {
      // There is no Split
      _isDebug(this) && console.log('%c[markSliceCutsInRows] There was no split', 'color:red', {rowWrapper, cellWrappers});
      break
    }

    if (rowExceptFirst) {
      // * normalize top cut
      if (rowWrapper) {
        _isDebug(this) && console.log('[markSliceCutsInRows] rowWrapper ⊥', rowWrapper);
        this.markTopCut(rowWrapper);
      }
      cellWrappers.forEach(cell => {
        _isDebug(this) && console.log('[markSliceCutsInRows] cell 🖍️ ⊥', cell);
        this.markTopCut(cell);
      });
    }

    if (rowExceptLast) {
      // * normalize bottom cut
      if (rowWrapper) {
        _isDebug(this) && console.log('[markSliceCutsInRows] rowWrapper ⊤', rowWrapper);
        this.markBottomCut(rowWrapper);
      }
      cellWrappers.forEach(cell => {
        _isDebug(this) && console.log('[markSliceCutsInRows] cell 🖍️ ⊤', cell);
        this.markBottomCut(cell);
      });
    }
  }
}
