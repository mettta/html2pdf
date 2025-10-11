// Shared helpers for handling tail slices and reclaimed height across table-like splitters.
// Keep calculations in one place so grid/table reuse the same heuristics.
// All helpers expect to be mixed into the Node instance (this._DOM available).

import { debugFor } from '../../utils/debugFor.js';
const _isDebug = debugFor('pagination');

/**
 * 🤖 Compute the height budget reclaimed in the final part when
 *    bottom signpost is skipped and TFOOT stays with the table.
 *
 * Geometric intent:
 * - The final slice drops the bottom continuation label, restoring its height budget.
 * - TFOOT remains in the original table, so its height is also reclaimed when estimating
 *   how much of the last data row can still fit without creating a new part.
 */
export function calculateFinalPartReclaimedHeight({ signpostHeight = 0, tfootHeight = 0 } = {}) {
  const safeSignpostHeight = Number.isFinite(signpostHeight) ? signpostHeight : 0;
  const safeTfootHeight = Number.isFinite(tfootHeight) ? tfootHeight : 0;
  return Math.max(0, safeSignpostHeight) + Math.max(0, safeTfootHeight);
}

/**
 * 🤖 Absorb short trailing slices into the previous fragment when reclaimed tail budget can host them.
 *
 * Merge the last generated slice back into the previous one when reclaimed height
 * is sufficient to host it without creating an extra table/grid part.
 * This is a “short tail” optimisation: we only absorb fragments whose height is
 * smaller than the reclaimed bottom budget. Long-tail scenarios (full-height
 * overflow chains) are handled elsewhere by dedicated splitters.
 *
 * Geometric intent:
 * - Tail slices that are shorter than the reclaimed budget should stay with the final part
 *   to avoid visually tiny fragments and to keep pagination stable.
 * - We only move the contents of the problematic slice (TD->TD for tables), then drop the
 *   empty slice wrapper. Pagination wrappers / enclosing table structure remain untouched.

 * 🤖 Geometry: keeps the final chunk compact by moving TD content back and dropping the empty tail slice wrapper.
 */
export function absorbShortTrailingSliceIfFits({ slices, extraCapacity = 0, ownerLabel = 'table', debug }) {
  if (!Array.isArray(slices) || slices.length < 2) {
    debug && debug._ && console.warn(`[${ownerLabel}.shortTail] Expected at least two slices to evaluate tail absorption, got:`, slices?.length);
    return;
  }
  const tailSlice = slices.at(-1);
  if (!tailSlice) {
    debug && debug._ && console.warn(`[${ownerLabel}.shortTail] Missing tail slice for absorption check.`);
    return;
  }
  const domFacade = this?._DOM;
  if (!domFacade) {
    debug && debug._ && console.warn(`[${ownerLabel}.shortTail] Missing DOM facade on Node instance.`);
    return;
  }
  const tailHeight = domFacade.getElementOffsetHeight(tailSlice) || 0;
  const reservedCapacity = Number.isFinite(extraCapacity) ? extraCapacity : 0;
  if (tailHeight <= reservedCapacity) {
    debug && debug._ && console.log('🫟 Short tail absorbed last slice', { ownerLabel, tailHeight, reservedCapacity });
    const previousSlice = slices.at(-2);
    if (previousSlice) {
      domFacade.moveRowContent(tailSlice, previousSlice);
    }
    domFacade.removeNode(tailSlice);
    slices.pop();
  }
}
