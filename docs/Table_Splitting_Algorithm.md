# Table Splitting – Algorithm Inventory (2024-09)

Document purpose: capture the current pagination pipeline inside `Table` (`src/node/elements/table.js`). We will reuse this map while extracting shared helpers and bringing Grid to feature parity.

## High-Level Pipeline

1. Preparation (lock widths, gather entries, compute metrics).
2. Rows one by one:
    - Row iteration (detect overflow, attempt slicing).
    - Row placement (tail vs full-page decisions, scaling, requeue).
3. Part assembly (build slices, attach signposts, return parts).

1. **Entry & Current State Setup**
   - `split(table, pageBottom, fullPageHeight, root)` assigns `_current*` fields via `_setCurrent` and resets them afterwards.
   - `split` delegates to `_splitCurrentTable()`.

2. **Preparation Phase** (`_prepareCurrentTableForSplitting`)
   - Lock column widths (`_lockCurrentTableWidths`) to keep geometry stable during DOM moves.
   - Collect logical table entries (`getTableEntries`): caption/thead/tbody/tfoot etc.
   - Build `distributedRows = rows + optional tfoot` for the pagination pass; expose `__html2pdfRecordedParts` for diagnostics.
   - Run structural guards (`_analyzeCurrentTableStructure`): set flags `hasRowspan/hasColspan/inconsistentCells/unexpectedChildren`.
   - Measure pagination metrics (`_collectCurrentTableMetrics`):
     - `firstPartContentBottom`: available space for short first window.
     - `fullPartContentHeight`: reusable height for subsequent pages (excludes signposts, caption, tfoot).
     - Cache per-row shell heights via `_currentRowShellCache` (WeakMap).

3. **Paginator Initialisation**
   - `_setCurrentTableFirstSplitBottom()` chooses between short first window (`firstPartContentBottom`) and full-page height when the first row already overflows.
   - `TablePaginator` (`table.paginator.js`) tracks `splitBottom`, register page starts.

4. **Row Iteration Loop** (`_splitCurrentTable` → `_evaluateRowForSplitting`)
   For each distributed row (including tfoot rows appended for final chunk):
   - Compute `currentRowFitDelta = nextRowTopOrTableBottom – splitBottom`.
   - If row fits (`<=0`): continue.
   - Otherwise execute the non-fitting path:
     1. **Last-row tail check**: if this is the final row and overflow ≤ reclaimed height (`signpost + tfoot`), treat as fitting and skip splitting.
     2. **Rowspan fallback**: if row contains ROWSPAN>1 → no slicing; use `_handleRowOverflow` to move/scale whole row.
     3. **Attempt slicing** (`_splitTableRow`):
        - Compute TD shells (`getTableRowShellHeightByTD`), gather split points via `getSplitPointsPerCells`.
        - Build new TRs with `paginationBuildBalancedRowSlices`.
        - Remove original row, insert new slices into DOM.
        - Update distributed rows through `_replaceRowInDOM` and `_node.applyRowSlicesToEntriesAfterRowSplit`.
     4. **Post-splitting decisions** (the part we intend to share):
        - Evaluate placement via `_node.evaluateRowSplitPlacement` (tail vs full window).
        - If slice stays on current page: optionally scale to tail height, register next-row start.
        - Else (empty first part / insufficient tail): scale for full-page if requested, register current row as next-page start.
        - If splitting failed (`newRows.length === 0`): fall back to `_handleRowOverflow` (move row to next page or scale full-page).
        - Roll back index to re-evaluate under updated `splitBottom` (ensures loops handle newly inserted slices).
     5. **Already-sliced row still overflowing**: if row carries `isSlice` flag but exceeds window, invoke `_handleRowOverflow` to move/scale.

5. **After Loop Completion**
   - Validate `splitStartRowIndexes` (no zeros, strictly increasing, last < rowsLen).
   - If empty array → table already fits → return [].
   - Otherwise, build non-final parts through `_createAndInsertTableSlice`, and final part via `_createAndInsertTableFinalSlice`.
   - Return array of wrappers (new slices + original table as last entry).

## Content Slicing Invariant

- Available window = total page window minus structural shells (caption/thead/tfoot, row padding/borders).
- Slicer input is normalized to this window; all tail/full-page decisions operate on pure content height.
- Helpers must treat container geometry and cell content separately so Grid/Table share the same content slicing logic.

## Post-Split Logic (Detailed)

This is the block that runs after `_splitTableRow` succeeds. Behaviour to preserve:

- **Evaluate placement**
  - Inputs: `usedRemainingWindow`, `isFirstPartEmptyInAnyTD`, `firstSliceTop/bottom`, `pageBottom`, `EPS=0`.
  - `evaluateRowSplitPlacement` returns `{ placeOnCurrentPage, remainingWindowSpace }`.

- **Tail placement** (`placeOnCurrentPage`):
  - Tail window: if remaining space is positive, scale only the first slice just enough to fit inside the residual height (no stretch beyond the window).
  - Register next page start at `rowIndex + 1` (since first slice stays here, remaining slices begin next page).
  - TODO: Confirm this scaling is still required—current regression set passes with `_scaleProblematicTDs` commented out (commit `node/Table: Ensure the first slice fits the current page window`).

- **Escalate to full page** (else branch):
  - If slicer reported `needsScalingInFullPage`, scale first slice to full-page height using `_scaleProblematicTDs` (only problematic TDs).
  - Register next page start at current `rowIndex` (whole row moves).

- **Re-check under new context**
  - Always decrement `rowIndex` to revisit row after `splitBottom` update (allows subsequent slices to be evaluated).

- **Failure / overflow fallback**
  - If slicing produced no rows: call `_handleRowOverflow` to either move row to next page (tail) or scale full-page.

- **Already-sliced overflow**
  - When row already split (flag `isSlice`) but still doesn’t fit, `_handleRowOverflow` again decides between move and full-page scaling.

## Guard / Fallback Functions

- `_handleRowOverflow(rowIndex, row, availableRowHeight, fullPageHeight, splitStartRowIndexes, tailReason, fullReason)`
  - Tail: register page start at current `rowIndex`, retry on next page.
  - Full page: scale via `_scaleProblematicTDs` then register start at current row.

- `_scaleProblematicTDs(row, totalRowHeight, shells)`
  - Row-level fallback to scale TD contents proportionally until they fit the window.

- `_getFinalPartReclaimedHeight()`
  - Extra capacity when rendering the final chunk (no bottom signpost, tfoot lives in final part).

## Next Steps

- Use this document to drive extraction of the shared “post-split row decision” helper: inputs/outputs shown above.
- When helper is ready, integrate with Table and then Grid, using adapters for element-specific data (signposts, reclaimed height, fallback handlers).
- This document can evolve into the canonical spec for tests covering row-splitting edge cases (tail scaling, last-row absorption, rowspan fallback, etc.).


## TODO / Investigation

- Re-evaluate tail-fitting (`_scaleProblematicTDs` for the first slice) and document explicit geometric triggers. Tests currently pass without it.
