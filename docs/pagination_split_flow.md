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
   - **ROWSPAN fallback** → `paginationResolveRowWithRowspan` (conservative move/scale).
   - **Splittable row** → `paginationResolveSplittableRow` (budget → split → placement).
   - **Already sliced** → `paginationResolveAlreadySlicedRow` (move/scale tail slices).

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
  - Full splittable-row flow using shared budget/split/process helpers.
- `paginationHandleRowSlicesPlacement({ evaluation, table, newRows, insufficientRemainingWindow, isFirstPartEmptyInAnyTD, needsScalingInFullPage, splitStartRowIndexes, pageBottom, fullPageHeight, debug, registerPageStartAt, scaleProblematicSlice, applyFullPageScaling })`
  - Shared placement logic deciding current-page vs full-page allocation.

## Table-Specific Callbacks

- `onReplaceRow` → `_replaceRowInDOM`
- `onAbsorbTail` → `absorbShortTrailingSliceIfFits`
- `onRefreshRows` → `paginationRefreshRowsAfterSplit`
- `onPlacement` → `paginationHandleRowSlicesPlacement`
- `onSplitFailure` → `_resolveRowSplitFailure`

## Key Behaviours / Logs

- **Short-tail skip**: `🫟 last-row-fits-without-bottom-signpost` (Stage 4).
- **ROWSPAN conservative fallback**: `%c ⚠️ Row has ROWSPAN; use conservative fallback (no slicing)`
- **Already-sliced overflow**: `%c Row # … is slice! but don't fit` + `%c SUPER BIG` warning.
- **Splitting attempt**: `🔳 Try to split the ROW …` group log.

## Coverage Checklist (Tests)

- Tail window large → split occurs, placement decides current page vs new page.
- Tail window small → escalates to full-page budget before splitting.
- ROWSPAN row → moved/scaled via fallback, no slicing.
- Already-sliced row overflow → triggers `_resolveRowSplitFailure` branch.
- Short-tail last row → reclaimed budget absorbs final slice.
- Absorption path ensures DOM merge and recorder update.

_Keep this inventory updated as helpers migrate or new behaviours appear._
