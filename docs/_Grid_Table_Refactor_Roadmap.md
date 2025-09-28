# Grid/Table Refactor Roadmap — 28 Sep

## Current Baseline
- Both `grid` and `table` expose `__html2pdfRecordedParts` and share the `parts.recorder` format.
- Grid still lacks deep row/cell slicing parity with table (scaling fallbacks, span handling).
- Table splitting works but large methods remain monolithic and hard to reason about.

## Immediate Objectives

### 1. Grid Feature Parity
#### Additional Grid Handling Ideas
- [x] Freeze grid cell widths before slicing to prevent layout drift.
- Detect per-row alignment overrides (e.g. `align-items: end`) and treat such rows as unsplittable; if they overflow full-page budget, scale their cell content instead of breaking structure.
- Reuse table technique for freezing cell widths before cloning grid parts to prevent layout drift.
- Investigate temporarily normalising row alignment during row-group discovery (force consistent `align-content`), measure rows, then restore original styles.

- [x] **Audit gaps**: document cases where grid fails vs table (deep cell split, scaling, spans, dense flow).
  - Current gaps (2024-09-28):
    - No reuse of table slicer kernel; `_splitGridRow` narrows cells but upstream logic keeps stale `currentRows`.
    - `needsScalingInFullPage` result ignored; no scaling/per-row fallback when slices still overflow.
    - Post-split guards (`rowSpan`, dense flow) never re-evaluated; rely on initial scan only.
    - No rebuild of telemetry data after slicing; recorder sees old structures.
- [ ] **Extract shared slicers**: lift reusable helpers from table (row slicing, cell slicing, scaling) into modules.
  - [x] Adopt shared row slicing (sliceCellsBySplitPoints/buildRowSlices) via node modules.
  - [x] Share cell scaling/fallback helpers (needsScalingInFullPage, scaleCellsToHeight wrappers).
  - [x] Use shared evaluateRowSplitPlacement for tail vs full-page decisions.
  - [x] Expose shared scaling helper (wrap scaleCellsToHeight / needsScalingInFullPage).
  - [ ] Port `_scaleProblematicTDs` logic to grid once shell heights are available; add dedicated tests for scaling behaviour.
- [ ] **Integrate in grid**: replace bespoke grid logic with shared helpers, keeping grid-specific guards.
- [ ] **Guard unsupported layouts**: ensure spans/dense flow bail early with recorder/log entries.

### 2. Table Maintenance
- [ ] Break `_evaluateRowForSplitting` and `_handleRowOverflow` into smaller helpers/modules.
- [ ] Align table logging with grid (reuse recorder output, minimise `console.log` noise).
- [ ] Ensure adapters stay thin; move heavy logic into `modules/`.

### 3. Recorded Parts Consumers
- [ ] Document `recordedParts` schema (Markdown snippet + in-code comment).
- [ ] Add TODO hooks/tests referencing the shared format (even if disabled).
- [ ] Confirm runtime paths never depend on `recordedParts` presence; log only when debug enabled.

### 4. Shared Splitter Kernel
- [x] Define adapter contract used by grid/table (rows provider, part builder, cell balancer).
- [x] Promote `needsScalingInFullPage` and related fallbacks into shared module.
- [x] Move row/cell balancing helpers (insert empty cells, rebuild row groups) into shared layer.
- [x] Ensure guards (rowSpan/dense flow/etc.) integrate with kernel without duplicating code.

### 5. Cross-Cutting TODOs
- [ ] Optimise width locking (batch read/write, cache computed sizes instead of per-call DOM queries).
- [ ] Investigate caching expensive computedStyle/lookups (shared Set/Map) so repeated splits reuse measurements.
- [ ] Evaluate moving `_collectGridTelemetryRows` into a shared telemetry helper.
- [ ] Track future visualisation ideas in separate doc (optional, keep backlog tidy).
- [ ] Decide on strategy for exposing dev-only markers vs production (attributes vs properties).
- [ ] Add TODO hooks/tests referencing the shared format (even if disabled).
- [ ] Confirm runtime paths never depend on `recordedParts` presence; log only when debug enabled.

### 4. Cross-Cutting TODOs
- [ ] Evaluate moving `_collectGridTelemetryRows` into a shared telemetry helper.
- [ ] Track future visualisation ideas in separate doc (optional, keep backlog tidy).
- [ ] Decide on strategy for exposing dev-only markers vs production (attributes vs properties).

## Notes
- Tests remain manual for now; ensure each milestone has clear verification steps.
- Keep doc updated as tasks complete (checklist) to maintain visibility.
