// Element-level pagination helpers used by table splitter.
// Keep behavior identical to inlined logic in table.js; no functional changes.

/**
 * Update the current split bottom coordinate.
 * Accepts either a numeric value (absolute bottom) or an element
 * from which bottom is computed as: top(element) + fullPartContentHeight.
 *
 * @param {object} ctx - splitter context (e.g., Table instance)
 * @param {number|HTMLElement} elementOrValue
 * @param {string} [message]
 */
export function updateSplitBottom(ctx, elementOrValue, message = 'unknown case') {
  const prev = ctx._currentTableSplitBottom;

  if (typeof elementOrValue === 'number') {
    ctx._currentTableSplitBottom = elementOrValue;
  } else if (elementOrValue instanceof HTMLElement) {
    ctx._currentTableSplitBottom =
      ctx._node.getTop(elementOrValue, ctx._currentTable) +
      ctx._currentTableFullPartContentHeight;
  } else {
    throw new Error(`updateSplitBottom: unexpected value type: ${typeof elementOrValue}`);
  }

  // log history for debugging
  ctx._logSplitBottom_ && ctx._logSplitBottom_.push(ctx._currentTableSplitBottom);

  if (ctx._debug && ctx._debug._) {
    console.log(
      `%c♻️ Update splitBottom (with ${elementOrValue}) \n • ${message}`,
      'color: green; font-weight: bold',
      '\n', prev, '->', ctx._currentTableSplitBottom,
      `\n _logSplitBottom_: ${ctx._logSplitBottom_}`,
      ctx._logSplitBottom_,
    );
  }
}

/**
 * Register the start of a new page at a given row index and
 * immediately advance the split bottom to the next page window.
 * Keeps splitStartRowIndexes strictly increasing; ignores invalid/duplicate indices.
 *
 * @param {object} ctx - splitter context (e.g., Table instance)
 * @param {number} index - row index to start next page
 * @param {number[]} splitStartRowIndexes - accumulator of split starts
 * @param {string} [reason]
 */
export function registerPageStartAt(ctx, index, splitStartRowIndexes, reason = 'register page start') {
  const rows = ctx._currentTableDistributedRows || [];
  const rowsLen = rows.length;

  // 1) Validate basics
  const isInt = Number.isInteger(index);
  ctx._assert && console.assert(isInt, `registerPageStartAt: index must be an integer, got: ${index}`);
  if (!isInt) return;

  ctx._assert && console.assert(rowsLen > 0, `registerPageStartAt: no rows to register`);
  if (rowsLen === 0) return;

  // 2) Special case: index === 0
  // Do NOT push 0 (would create an empty first part); just advance geometry.
  if (index === 0) {
    ctx._debug && ctx._debug._ && console.log(`%c 📍 Row #0 forced to next page (no short first fragment)`, 'color:green; font-weight:bold');
    updateSplitBottom(ctx, rows[0], `${reason} (index=0)`);
    return;
  }

  // 3) Clamp into [1 .. rowsLen-1] to avoid empty first/last parts
  let idx = Math.max(1, Math.min(index, rowsLen - 1));

  // 4) Enforce strictly ascending sequence (no dups)
  const last = splitStartRowIndexes.at(-1);
  if (last != null && idx <= last) {
    idx = last + 1;
  }

  // 5) If clamped beyond range, do not push (would empty final/original)
  if (idx >= rowsLen) {
    ctx._assert && console.assert(false, `registerPageStartAt: computed index (${idx}) >= rowsLen (${rowsLen})`);
    return;
  }

  // 6) Register and advance geometry
  splitStartRowIndexes.push(idx);
  ctx._debug && ctx._debug._ && console.log(`%c 📍 Row # ${idx} registered as page start`, 'color:green; font-weight:bold');
  updateSplitBottom(ctx, rows[idx], reason);
}
