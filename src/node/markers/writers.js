// 🚩 markers

import { debugFor } from '../utils/debugFor.js';
const _isDebug = debugFor('markers');

/**
 * @this {Node}
 */
export function markProcessed(element, value) {
  this.setMark(element, 'processed', value);
}


/**
 * @this {Node}
 */
export function markNoBreak(element) {
  this.setMark(element, 'noBreak');
}

/**
 * @this {Node}
 */
export function markNoHanging(element, value) {
  this.setMark(element, 'noHanging', value);
}

/**
 * @this {Node}
 */
export function markSlice(element) {
  this.setMark(element, 'slice');
}

/**
 * @this {Node}
 */
export function markPageStart(element, pageNum) {
  this.setMark(element, 'pageStart', pageNum);
}

/**
 * @this {Node}
 */
export function unmarkPageStart(element) {
  this.clearMark(element, 'pageStart');
}

/**
 * @this {Node}
 */
export function markPageEnd(element, pageNum) {
  this.setMark(element, 'pageEnd', pageNum);
}

/**
 * @this {Node}
 */
export function markPageNumber(element, pageNum) {
  this.setMark(element, 'pageNumber', pageNum);
}

/**
 * @this {Node}
 */
export function markCleanTopCut(element) {
  _isDebug(this) && console.log('[mark ⊤ cut]', element);
  element && this.setMark(element, 'cleanTopCut');
}

/**
 * @this {Node}
 */
export function markCleanBottomCut(element) {
  _isDebug(this) && console.log('[mark ⊥ cut]', element);
  element && this.setMark(element, 'cleanBottomCut');
}

/**
 * @this {Node}
 */
export function markTopCut(element) {
  _isDebug(this) && console.log('[mark ⊤ cut]', element);
  element && this.setMark(element, 'topCut');
}

/**
 * @this {Node}
 */
export function markBottomCut(element) {
  _isDebug(this) && console.log('[mark ⊥ cut]', element);
  element && this.setMark(element, 'bottomCut');
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
