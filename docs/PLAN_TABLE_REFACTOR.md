# Table Pagination Refactor Plan

Scope: keep current behavior; extract reusable logic; prepare for Grid adapter.

## Invariants (must hold)
- Strict geometry, no overflows: every part fits within its page window.
- No empty parts; strictly increasing split indexes; no duplicates; no zero index.
- Short-first-part logic correct; final-part reclaimed height correct (table: signpost+tfoot; grid: 0).
- TFOOT only in the final slice.

## Milestones
1) Core paginator interface
   - Extract `updateSplitBottom(refElOrValue, reason)` from Table.
   - Extract `registerPageStartAt(index, rows, reason)` from Table.
   - Keep offset/probe-based metrics; no functional changes.

2) Table adapter (builders)
   - Move slice builders into `TableAdapter`:
     - Create non-final slice with cloned `caption/colgroup/thead`, own `tbody` and signposts.
     - Create final slice (move original table), add only top signpost.
   - Add TODO: externalize signpost texts/height to config.

3) Metrics and caches
   - Keep current `offset*` + probe approach for performance and browser-conformity.
   - Document rounding policy: comparisons use integer offsets; probe-based bottoms when margin affects flow.
   - Ensure row shell heights cache is invalidated after DOM mutations (split/scale).

4) TODOs (future features)
   - colSpan/rowSpan: unsupported; add guard/TODO in split path.
   - Scroll containers inside cells: print as-is; TODO for future unwrapping.
   - Signpost config: move texts/height under external config (same style as headers/footers).

5) Tests (unit/integration)
   - collapse vs separate borders; thick borders.
   - Short-first-part; last-tail reclaimed height; no empty slices; strict indexes.
   - Multi-page table with tfoot only in final slice.

6) Grid adapter (next phase)
   - Div-based grid items as rows; no signposts/thead/tfoot; reclaimed height = 0.
   - Reuse slice engine (slicers/fitters) and core paginator.

Notes
- Do not switch to BCR globally; use existing offset/probe methods for stability and speed.
- Keep behavior identical while extracting; validate with existing examples/tests.

