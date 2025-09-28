# Grid/Table Refactor Roadmap — 28 Sep

## Current Baseline
- Both `grid` and `table` expose `__html2pdfRecordedParts` and share the `parts.recorder` format.
- Grid still lacks deep row/cell slicing parity with table (scaling fallbacks, span handling).
- Table splitting works but large methods remain monolithic and hard to reason about.

## Immediate Objectives

### 1. Grid Feature Parity
- [ ] **Audit gaps**: document cases where grid fails vs table (deep cell split, scaling, spans, dense flow).
- [ ] **Extract shared slicers**: lift reusable helpers from table (row slicing, cell slicing, scaling) into modules.
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

### 4. Cross-Cutting TODOs
- [ ] Evaluate moving `_collectGridTelemetryRows` into a shared telemetry helper.
- [ ] Track future visualisation ideas in separate doc (optional, keep backlog tidy).
- [ ] Decide on strategy for exposing dev-only markers vs production (attributes vs properties).

## Notes
- Tests remain manual for now; ensure each milestone has clear verification steps.
- Keep doc updated as tasks complete (checklist) to maintain visibility.
