// Element-level pagination helpers reused by Table and Grid splitters.

// 🤖 Read debug configuration from adapter; prefer accessor when available for lazy evaluation.
function resolveDebug(adapter) {
  if (!adapter) return undefined;
  if (typeof adapter.getDebug === 'function') return adapter.getDebug();
  return adapter.debug;
}

// 🤖 Determine whether paginator should assert while registering page starts.
function resolveAssert(adapter) {
  if (!adapter) return false;
  if (typeof adapter.shouldAssert === 'function') return adapter.shouldAssert();
  return Boolean(adapter.assert);
}

// 🤖 Fetch current row collection so split markers can be validated.
function resolveRows(adapter) {
  if (!adapter) return [];
  if (typeof adapter.getRows === 'function') return adapter.getRows() || [];
  return adapter.rows || [];
}

// 🤖 Obtain split-bottom log array for telemetry if adapter exposes it.
function resolveLog(adapter) {
  if (!adapter) return null;
  if (typeof adapter.getSplitBottomLog === 'function') return adapter.getSplitBottomLog();
  return adapter.splitBottomLog || null;
}

// 🤖 Friendly label used in debug output (table/grid/etc.).
function resolveLabel(adapter) {
  return adapter?.label || '👤 [paginator.label] element';
}

/**
 * 🤖 Update split-bottom geometry via adapter accessor
 * (numeric absolute bottom or element marker).
 *
 * Update the current split bottom coordinate.
 * Accepts either a numeric value (absolute bottom) or an element
 * from which bottom is computed by the adapter.
 *
 * @param {object} adapter - paginator adapter implementing accessors
 * @param {number|HTMLElement} elementOrValue
 * @param {string} [message]
 */
export function updateSplitBottom(adapter, elementOrValue, message = 'unknown case') {
  if (!adapter || typeof adapter.getSplitBottom !== 'function' || typeof adapter.setSplitBottom !== 'function') {
    throw new Error('updateSplitBottom: adapter must expose getSplitBottom() and setSplitBottom().');
  }

  const prev = adapter.getSplitBottom();
  let next;

  if (typeof elementOrValue === 'number') {
    next = elementOrValue;
  } else if (elementOrValue instanceof HTMLElement) {
    if (typeof adapter.computeSplitBottomForElement !== 'function') {
      throw new Error('updateSplitBottom: adapter must implement computeSplitBottomForElement(element).');
    }
    next = adapter.computeSplitBottomForElement(elementOrValue);
  } else {
    throw new Error(`updateSplitBottom: unexpected value type: ${typeof elementOrValue}`);
  }

  adapter.setSplitBottom(next);

  const log = resolveLog(adapter);
  Array.isArray(log) && log.push(next);

  const debug = resolveDebug(adapter);
  if (debug && debug._) {
    console.log(
      `%c♻️ [${resolveLabel(adapter)}] update splitBottom (with ${elementOrValue}) \n • ${message}`,
      'color: green; font-weight: bold',
      '\n', (prev ? prev : '•••'), '->', next,
      log ? `\n log: ${log}` : ''
    );
  }
}

/**
 * 🤖 Register a new page start and advance splitBottom while keeping split markers monotonic.
 *
 * Register the start of a new page at a given row index and
 * immediately advance the split bottom to the next page window.
 * Keeps splitStartRowIndexes strictly increasing; ignores invalid/duplicate indices.
 *
 * @param {object} adapter - paginator adapter implementing accessors
 * @param {number} index - row index to start next page
 * @param {number[]} splitStartRowIndexes - accumulator of split starts
 * @param {string} [reason]
 */
export function registerPageStartAt(adapter, index, splitStartRowIndexes, reason = 'register page start') {
  const rows = resolveRows(adapter);
  const rowsLen = rows.length;
  const shouldAssert = resolveAssert(adapter);
  const debug = resolveDebug(adapter);

  const isInt = Number.isInteger(index);
  shouldAssert && console.assert(isInt, `registerPageStartAt: index must be an integer, got: ${index}`);
  if (!isInt) return;

  shouldAssert && console.assert(rowsLen > 0, `registerPageStartAt: no rows to register`);
  if (rowsLen === 0) return;

  if (index === 0) {
    debug && debug._ && console.log(`%c 📍 Row #0 forced to next page (no short first fragment)`, 'color:green; font-weight:bold');
    if (rows[0] instanceof HTMLElement) {
      updateSplitBottom(adapter, rows[0], `${reason} (index=0)`);
    } else if (typeof rows[0] === 'number') {
      updateSplitBottom(adapter, rows[0], `${reason} (index=0)`);
    }
    return;
  }

  let idx = Math.max(1, Math.min(index, rowsLen - 1));
  const last = splitStartRowIndexes.at(-1);
  if (last != null && idx <= last) {
    idx = last + 1;
  }

  if (idx >= rowsLen) {
    // * Stage 5 always replays the same row after it tweaks the window:
    // * the handler returns rowIndex - 1, the surrounding for immediately does index++,
    // * and that lands the row back on the next iteration with the updated splitBottom.
    // * Until the tail has truly moved to the next part, the different Stage 5 branches
    // * keep issuing the very same targetIndex, so the final call sometimes tries
    // * to “advance” past the end of rows. The guard (and early return) doesn’t signal a bug -
    // * it just cancels that redundant request so the source table never ends up empty
    // * and we never reuse a split marker beyond rows.length.
    debug && debug._ && console.warn(`registerPageStartAt return: computed index (${idx}) >= rowsLen (${rowsLen})`,
      'Last split index should not equal rows.length, or the original table will be empty.'
    );
    return;
  }

  splitStartRowIndexes.push(idx);
  debug && debug._ && console.log(`%c 📍 Row # ${idx} registered as page start`, 'color:green; font-weight:bold');
  const rowMarker = rows[idx];
  if (rowMarker instanceof HTMLElement || typeof rowMarker === 'number') {
    updateSplitBottom(adapter, rowMarker, reason);
  }
}
