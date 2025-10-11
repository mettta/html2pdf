// Shared splitter kernel helpers and adapter contract definitions.

import { debugFor } from '../../utils/debugFor.js';
const _isDebug = debugFor('pagination');

/**
 * @typedef {Object} SplitterRowGuardConfig
 * @property {Array} rows - Row collection evaluated by guard helpers.
 * @property {object} [DOM] - Optional DOM facade override; defaults to Node DOM.
 * @property {(tag: string, cell: HTMLElement) => boolean} [cellTagFilter]
 * @property {(flags: { hasRowspan: boolean, hasColspan: boolean, inconsistentCells: boolean }) => void} [guardCallback]
 */

/**
 * @typedef {Object} SplitterRowProvider
 * @property {string} [label] - Debug label for the provider.
 * @property {() => Array} [getCurrentRows] - Returns current row cache used by paginator.
 * @property {(params: { rowIndex: number, rowSlices: Array }) => void} replaceRow - Integrate fresh row slices into the provider.
 * @property {(params: { rowIndex: number, rowSlices: Array }) => void} [syncEntries] - Refresh adapter-specific caches after replacement.
 * @property {(params: { rowIndex: number, rowSlices: Array }) => SplitterRowGuardConfig | null | undefined} [getGuardConfig]
 * @property {(params: { rowIndex: number, rowSlices: Array, flags?: any }) => void} [onRowsChanged]
 */

/**
 * @typedef {Object} SplitterPartBuilder
 * @property {(params: any) => HTMLElement} createSlice - Builds non-final slice wrapper/part.
 * @property {(params: any) => HTMLElement} createFinalSlice - Builds final slice wrapper/part.
 */

/**
 * @typedef {Object} SplitterRowBalancer
 * @property {(params: any) => Array} sliceCells - Splits cells by adapter-provided split points.
 * @property {(params: any) => Array} buildRows - Reassembles balanced row slices.
 */

/**
 * @typedef {Object} SplitterGuardHooks
 * @property {(params: { rowIndex: number, rowSlices: Array }) => SplitterRowGuardConfig | null | undefined} [getConfig]
 * @property {(params: { flags: any, rowIndex: number, rowSlices: Array }) => void} [onFlags]
 */

/**
 * @typedef {Object} SplitterMetricHooks
 * @property {(params: { rowIndex: number, rowSlices: Array, flags?: any }) => void} [refresh]
 */

/**
 * @typedef {Object} SplitterKernelAdapter
 * @property {string} label - Owner label (table/grid/etc.).
 * @property {SplitterRowProvider} rows
 * @property {SplitterGuardHooks} [guards]
 * @property {SplitterMetricHooks} [metrics]
 * @property {SplitterPartBuilder} [parts]
 * @property {SplitterRowBalancer} [balancer]
 */

/**
 * 🤖 Ensure splitter adapter exposes mandatory row replacement hook before pagination mutates DOM.
 * @param {SplitterKernelAdapter} adapter
 */
export function validateSplitterAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object') {
    throw new Error('splitter kernel adapter must be an object.');
  }
  if (!adapter.rows || typeof adapter.rows !== 'object') {
    throw new Error('splitter kernel adapter must expose a rows provider.');
  }
  if (typeof adapter.rows.replaceRow !== 'function') {
    throw new Error('splitter kernel adapter rows.replaceRow must be a function.');
  }
}

/**
 * 🤖 Apply fresh row slices and refresh guard/metric caches via adapter hooks, keeping shared bookkeeping aligned.
 *
 * @this {import('../../node.js').default}
 * @param {SplitterKernelAdapter} adapter
 * @param {{ rowIndex: number, rowSlices: Array }} params
 * @returns {{ flags: any }}
 */
export function paginationRefreshRowsAfterSplit(adapter, { rowIndex, rowSlices }) {
  validateSplitterAdapter(adapter);

  const safeIndex = Number.isFinite(rowIndex) ? rowIndex : 0;
  const slices = Array.isArray(rowSlices) ? rowSlices : [];

  const rowsProvider = adapter.rows;
  rowsProvider.replaceRow({ rowIndex: safeIndex, rowSlices: slices });
  rowsProvider.syncEntries?.({ rowIndex: safeIndex, rowSlices: slices });

  const guardConfig = adapter.guards?.getConfig?.({ rowIndex: safeIndex, rowSlices: slices })
    ?? rowsProvider.getGuardConfig?.({ rowIndex: safeIndex, rowSlices: slices })
    ?? null;

  let flags = null;
  if (guardConfig) {
    const guardInput = {
      rows: guardConfig.rows,
      DOM: guardConfig.DOM || this._DOM,
      cellTagFilter: guardConfig.cellTagFilter,
      guardCallback: guardConfig.guardCallback,
    };

    if (Array.isArray(guardInput.rows) && guardInput.DOM) {
      flags = this.computeRowFlags(guardInput);
      adapter.guards?.onFlags?.({ flags, rowIndex: safeIndex, rowSlices: slices });
    }
  }

  adapter.metrics?.refresh?.({ rowIndex: safeIndex, rowSlices: slices, flags });
  rowsProvider.onRowsChanged?.({ rowIndex: safeIndex, rowSlices: slices, flags });

  return { flags };
}
