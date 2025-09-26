# Table Pagination Refactor Plan

Scope: keep current behavior; extract reusable logic; prepare for Grid adapter.

## Invariants (must hold)
- Strict geometry, no overflows: every part fits within its page window.
- No empty parts; strictly increasing split indexes; no duplicates; no zero index.
- Short-first-part logic correct; final-part reclaimed height correct (table: signpost+tfoot; grid: 0).
- TFOOT only in the final slice.

## Milestones
1) Core paginator interface (ElementPaginator)
   - File: `src/node/elements/table.paginator.js` (table-specific for now).
   - API: `updateSplitBottom(refElOrValue, reason)`, `registerPageStartAt(index, rows, reason)`.
   - Keep offset/probe-based metrics; no functional changes.
   - Note: This is element-level paginator for Table. Grid may get its own adapter or reuse later.
   - TODO(later): compare with `Pages.js` (document paginator) and evaluate unification.

2) Table adapter (builders)
   - Move slice builders into `TableAdapter`:
     - Create non-final slice with cloned `caption/colgroup/thead`, own `tbody` and signposts.
     - Create final slice (move original table), add only top signpost.
     - Add TODO: externalize signpost texts/height to config.
   - File: `src/node/elements/table.adapter.js` (done)

3) Metrics and caches
   - Keep current `offset*` + probe approach for performance and browser-conformity.
   - Document rounding policy: comparisons use integer offsets; probe-based bottoms when margin affects flow.
   - Ensure row shell heights cache is invalidated after DOM mutations (split/scale).

4) TODOs (future features)
   - colSpan/rowSpan: unsupported; add guard/TODO in split path.
   - Scroll containers inside cells: print as-is; TODO for future unwrapping.
   - Signpost config: move texts/height under external config (same style as headers/footers).

5) Tests (unit/integration)
   Specs to implement (add here, keep behavior strict; layout in real browser for e2e, jsdom for unit invariants):
   - Split indexes monotonicity:
     - Given rowsLen=5 and attempts [0,2,2,5,10] → registered [1,3,4].
   - Split bottom updates:
     - Start 100 → updateSplitBottom(250) → 250; then registerPageStartAt(2) → top(rows[2])+fullPart.
   - Short-first-part handling:
     - If top(row0) > firstPartBottom → first window uses full-page budget.
   - No empty parts:
     - Last index never equals rows.length; clamping protects final slice.
   - Final reclaimed height:
     - Table: reclaimed = signpostBottom + tfoot height; tail drop allowed if overflow <= reclaimed.
   - TFOOT only in the final slice.
   - Borders mode:
     - border-collapse: separate vs collapse; thick borders — ensure no off-by-one overflows.
   - ROWSPAN conservative fallback (table):
      - Row with rowspan>1 does not get sliced; if it overflows tail window → moved to next page; if it overflows full-page window → TD contents are scaled to fit full page, then moved. Assert geometry holds and no empty parts.
      - Logging: expect `warn` mentioning ROWSPAN fallback.
      - TODO: detection of rows affected by a rowspan starting above (not in the current row) — add e2e coverage when implemented.
   - COLSPAN presence (table):
      - With colspan>1 in row, slicing proceeds within the row; assert strict geometry, no crashes; expect a `warn` about COLSPAN presence.
   - Inconsistent cell counts (table):
      - Table where rows have different TD/TH counts. Split proceeds; assert strict geometry and warn emitted.
   - Unexpected children in <table>:
      - Inject non-TABLE structural children; assert warn is emitted and splitting still works or safely no-ops.

6) Grid adapter (next phase)
   - Div-based grid items as rows; no signposts/thead/tfoot; reclaimed height = 0.
   - Reuse slice engine (slicers/fitters) and core paginator.

Notes
- Do not switch to BCR globally; use existing offset/probe methods for stability and speed.
- Keep behavior identical while extracting; validate with existing examples/tests.

## Slicers Follow-ups (TODO)
- Add helpers: `isFirstSliceEmpty(points)` and `sanitizeFirstSlice(points)` to centralize null handling.
- Prefer `capacity` (tail window) over `max(first, full)` in first pass; avoid early window escalation in slicers.
- Ensure early-abort after first `null` is consistently respected by all call sites (already added in slicers; audit usages).
- Keep scaling out of slicers: only signal via second pass (`needsScalingInFullPage`), scaling lives in element layer.
- Unit tests for slicers: first-pass abort on null, no early scaling, recursion with shared points semantics.
