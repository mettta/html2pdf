# Sliceable Elements Contract

Goal: implement a common shape for elements that are physically sliced across pages (Table, Grid, TableLike) so that core splitting flow is uniform and reusable.

## Adapter responsibilities (per element)
- collectEntries(node): structure refs for rows/cells used during split (table rows or grid pseudo-rows).
- distributedRows(entries): return the list of rows to iterate (include footer if applicable).
- measure:
  - wrapperHeight(node): height overhead of an empty wrapper (used to compute content window).
  - firstPartBottom(params): compute first window bottom for the element.
  - fullPartContentHeight(params): compute full-page content height used for windows.
  - reclaimedHeightForFinalPart(params): height regained in final part (e.g., tfoot+bottom signpost for table; 0 for grid).
- builders:
  - createAndInsertSlice(ctx, { startId, endId, node, entries }): build non-final slice next to original.
  - createAndInsertFinalSlice(ctx, { node }): move the original node into the final slice wrapper.
- row split:
  - splitRow(ctx, { rowIndex, row, firstPartHeight, fullPartHeight }): returns array of new rows and flags
    (empty-first-part, needs-scaling-for-full-page). Uses common slicers/fitters.

## Flow invariants
- Strict geometry: each slice fits ≤ its window; no empty parts.
- Strictly increasing split indexes; last split < rows.length.
- Final-part reclaimed height honored by tail-drop optimization (table); grid uses 0.

## Notes
- Signposts: only in Table for now; Grid/TableLike keep them off.
- Unsupported (TODO): colSpan/rowSpan, complex grid areas/auto-flow. Detect and fallback to full-page scaling.

