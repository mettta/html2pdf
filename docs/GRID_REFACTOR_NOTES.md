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
- Add automated coverage for existing grid examples before attempting deeper refactors.

### 2025-10-02 – Stage‑5 Adapter Audit
- Current `Grid.split` still runs a bespoke Stage-5 loop (`_splitGridRow`, manual placement). Needs to delegate to `paginationResolveOverflowingRow` / `paginationResolveSplittableRow` with Grid-specific callbacks.
- Required adapters:
  - `gridEvaluateRow` equivalent → reuse `paginationBuildRowEvaluationContext` with grid rows; ensure row metadata cached (top/bottom, tail height).
  - Overflow hooks: implement `registerPageStartCallback`, `scaleProblematicCellsCallback`, `getRowShellHeightsCallback` for grid (currently `_scaleGridCellsToHeight`, `_computeGridCellShellHeights`).
  - Placement callbacks: map `scaleProblematicSliceCallback` / `applyFullPageScalingCallback` to grid cell scaler.
- Telemetry/recorder: `_currentGridEntries` already mirrors Table; confirm `_recordGridPart` aligns with shared kernel expectations.
- TODO: introduce `_forwardGridOverflowFallback` mirroring Table’s `_forwardOverflowFallback` once Stage‑5 wiring is shared.
- Risks: grid guards (auto-flow, spans) must still short-circuit before Stage‑5 to avoid illegal adapters.

## Work Log
- 2025-09-18: Prioritize regression tests for strictdoc grids, then extract reusable pagination steps incrementally (state prep, metrics, builders) with functional parity at each step.
- 2025-09-19: Added runtime layout scan helpers and integrated slicer-based row splitting for monotonic grids (fallback to logging when scaling is required).

## Test Backlog
- Simple two-column grid without explicit `grid-column` assignments should split correctly.
- Grid container with default `position: static` must be handled without requiring inline overrides.

See `docs/GRID_SPLIT_EDGE_CASES.md` for the full catalogue of grid-specific edge cases, detection hints, and current strategies.
- Horizontal grid spans (`grid-column: span N`) appear to be tolerable for simple splitting; verify with dedicated tests before enabling slicing in that scenario.
