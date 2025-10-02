# Pagination Split Flow Inventory

<!--
  Living document summarising the core helpers involved in table/grid pagination.
  Keep it short and actionable so it can guide test scenarios and future refactors.
-->

## Stage Overview (`Table._evaluateAndResolveRow`)

1. **Stage 1 – Geometry snapshot**: `paginationBuildRowEvaluationContext` gathers row top/bottom, tail window height, delta to split bottom.
2. **Stage 2 – Fits current window**: no action when `fitsCurrentWindow` is true.
3. **Stage 3 – Final budget**: `calculateFinalPartReclaimedHeight` + `paginationCanAbsorbLastRow` reuse signpost/TFOOT budget for the final slice.
4. **Stage 4 – Short tail**: if reclaimed budget ≥ overflow → skip split, keep last row intact.
5. **Stage 5 – Overflow branches**: `paginationResolveOverflowingRow` routes to:
   - **ROWSPAN fallback** → `paginationResolveRowWithRowspan` (conservative move/scale, logs via `branch=rowspan`).
   - **Splittable row** → `paginationResolveSplittableRow` (budget → split → placement; placement delegates to `_forwardOverflowFallback` when tail/full-page decisions are needed).
   - **Already sliced** → `paginationResolveAlreadySlicedRow` (move/scale tail slices, logs via `branch=alreadySliced`).
   - **Split failure** → triggered inside `paginationProcessRowSplitResult` when `newRows` empty; Table routes to `_forwardOverflowFallback` with `branch=splitFailure`.

## Shared Helpers (Node Adapters)

- `paginationBuildRowEvaluationContext(rows, rowIndex, table, splitBottom)`
  - Returns `{ rowIndex, row, rowTop, rowBottom, nextMarker, delta, tailWindowHeight, isLastRow, fitsCurrentWindow }`.
- `paginationCanAbsorbLastRow(evaluation, extraCapacity, splitBottom, debug)`
  - Short-tail check for last row (uses reclaimed signpost + TFOOT height).
- `paginationResolveOverflowingRow({ evaluation, utils, handlers })`
  - Delegates to specific branch callbacks.
- `paginationResolveRowWithRowspan({ evaluation, splitStartRowIndexes, fullPageHeight, resolveOverflow, debug, afterResolve })`
  - Shared fallback for ROWSPAN rows.
- `paginationResolveAlreadySlicedRow({ evaluation, splitStartRowIndexes, resolveSplitFailure, fullPageHeight, debug })`
  - Handles slices that still overflow.
- `paginationCalculateRowSplitBudget({ tailWindowHeight, minMeaningfulRowSpace, fullPartHeight, debug })`
  - Determines first-part height or escalates to full-page budget.
- `paginationProcessRowSplitResult({ evaluation, splitResult, splitStartRowIndexes, insufficientRemainingWindow, extraCapacity, fullPageHeight, debug, handlers })`
  - Orchestrates DOM replacement, recorder refresh, placement, and failure fallback via adapter callbacks.
- `paginationSplitRow({ rowIndex, row, firstPartHeight, fullPageHeight, debug, decorateRowSlice })`
  - Builds row slices via shared slicers while allowing caller decoration/logging.
- `paginationResolveSplittableRow({ evaluation, splitStartRowIndexes, extraCapacity, fullPageHeight, minPartLines, debug, decorateRowSlice, onBudgetInfo, handlers })`
  - Full splittable-row flow using shared budget/split/process helpers; Table’s `handlers.onSplitFailure` now calls `_forwardOverflowFallback` (logs `branch=splitFailure`).
- `paginationHandleRowSlicesPlacement({ evaluation, table, newRows, insufficientRemainingWindow, isFirstPartEmptyInAnyTD, needsScalingInFullPage, splitStartRowIndexes, pageBottom, fullPageHeight, debug, registerPageStartAt, scaleProblematicSlice, applyFullPageScaling })`
  - Shared placement logic deciding current-page vs full-page allocation.

## Table-Specific Callbacks

- `onReplaceRow` → `_replaceRowInDOM`
- `onAbsorbTail` → `absorbShortTrailingSliceIfFits`
- `onRefreshRows` → `paginationRefreshRowsAfterSplit`
- `onPlacement` → `paginationHandleRowSlicesPlacement`
- `onSplitFailure` → `_forwardOverflowFallback` (`branch=splitFailure`)
  - `_forwardOverflowFallback` also services ROWSPAN (`branch=rowspan`) and already-sliced (`branch=alreadySliced`) via shared overflow helpers (`handleRowOverflow` / `handleRowSplitFailure`).

## Key Behaviours / Logs

- **Short-tail skip**: `🫟 last-row-fits-without-bottom-signpost` (Stage 4).
- **ROWSPAN conservative fallback**: `%c ⚠️ Row has ROWSPAN; use conservative fallback (no slicing)`
- **Already-sliced overflow**: `%c Row # … is slice! but don't fit` + `%c SUPER BIG` warning (followed by `[table.overflow] branch=alreadySliced …`).
- **Splitting attempt**: `🔳 Try to split the ROW …` group log; failure path emits `[table.overflow] branch=splitFailure …` before delegating to `handleRowSplitFailure`.
- **ROWSPAN fallback**: `[table.overflow] branch=rowspan …` before delegating to `handleRowOverflow`.

## Coverage Checklist (Tests)

- Tail window large → split occurs, placement decides current page vs new page.
- Tail window small → escalates to full-page budget before splitting.
- ROWSPAN row → moved/scaled via fallback, no slicing.
- Already-sliced row overflow → triggers `_resolveRowSplitFailure` branch.
- Short-tail last row → reclaimed budget absorbs final slice.
- Absorption path ensures DOM merge and recorder update.

_Keep this inventory updated as helpers migrate or new behaviours appear._
