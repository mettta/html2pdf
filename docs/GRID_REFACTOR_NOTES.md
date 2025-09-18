# Grid/TableLike Refactor Notes

## Current Objectives
- Finish extracting reusable pagination logic from `Table` into shared modules (slicers, fitters, paginator).
- Add a Grid adapter that can reuse the Table slicing primitives to split rows and their content, not just row groups.
- If feasible, mirror the same adapter pattern for `TableLike`; otherwise document follow-up steps.
- Ensure Grid keeps behavior differences (no signposts, reclaimed height = 0) while matching Table’s correctness guarantees.
- Record new edge cases, test plans, and configuration needs for future work.

## Notable Constraints & Decisions
- Signposts remain Table-only until UI/UX confirms them for Grid/TableLike.
- Maintain existing geometry guarantees: no overflow, strictly increasing split indexes, non-empty slices.
- Fallback strategy for unsupported layouts (row/col spans, complex grid areas) should be conservative and logged.
- Use existing offset/probe measurements; avoid switching to `getBoundingClientRect` globally.

## Open Threads / Follow-ups
- Define Grid test matrix for nested content, auto-flow variants, and long single-row cases.
- Clarify how scaling should work for Grid when content cannot fit a single page.
- Evaluate reuse of `TableAdapter` patterns for Grid/TableLike builders and slice lifecycle.
- Revisit configuration placement for signpost text/height once adapters are unified.
- Capture per-item shell measurements for Grid to improve split budgets and scaling heuristics.

## Work Log
- 2025-09-18: Rewired Grid splitter to share the paginator adapter with Table, added row-level slicing via existing slicers (shells stubbed to zero pending dedicated measurements).
