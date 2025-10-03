# Grid Split Test Cases

This list captures end-to-end scenarios for validating grid splitting logic from basic monotonic layouts to guarded edge cases. Each case notes the intent, the representative setup, and the primary expectations.

## Legend
- **Purpose**: What behavior or regression the case protects.
- **Setup**: Key CSS/HTML ingredients for the fixture.
- **Expectations**: Assertions the test should perform (page counts, element placement, warnings, etc.).
- **Notes**: Links to helpers, warnings to spy on, or follow-up work.

## Baseline Monotonic Grids
- **TC-GRID-001 — Fits On One Page**
  **Purpose**: Ensure splitter leaves monotonic grids untouched when height budget is sufficient.
  **Setup**: Simple `display: grid` with `grid-auto-flow: row`, all grid uniform rows totaling less than page height; include sibling blocks before/after.
  **Expectations**: Single page output, all cells remain in original DOM order, no warnings.
  **Notes**: Reuse helper assertions from `case01` style tests.
- **TC-GRID-002 — Page Break On Row Boundary / Clean Cut**
  **Purpose**: Happy-path split where virtual rows map cleanly to pages and first slice is shorter than a full repeat.
  **Setup**: 29 cells arranged 4 per row; document height causes first page to contain rows 0-3 (without any page height compensation), second page rows 4-19, third page rows 20-29.
  **Expectations**: 3 pages, `data-testid` markers confirm row allocation, grid clones keep original classes/styles.
  **Notes**: Mirrors existing `case01`; keep as regression guard.
- **TC-GRID-003 — Alignment Variants**
  **Purpose**: Verify row grouping resilient to `align-items`/`justify-items` variations that stretch, center, or end-align content.
  **Setup**: Duplicate TC-GRID-002 fixture but toggle alignment per row (stretch, center, end).
  **Expectations**: Same page allocation as baseline; no row misclassification.
  **Notes**: Covers regressions when measuring row heights.
- **TC-GRID-004 — Mixed Row Heights**
  **Purpose**: Ensure we respect varying `grid-auto-rows` / intrinsic heights while still splitting only at row boundaries.
  **Setup**: Grid with tall content in one row (e.g., paragraph) so first slice height nearly equals full row height; mix fixed and auto rows.
  **Expectations**: First chunk may equal full-row height, but row ordering preserved; total page count predictable.
  **Notes**: Protects against incorrect "first part shorter" assumption.
- **TC-GRID-005 — Scrollable Before/After Flow**
  **Purpose**: Confirm other document blocks remain stable when grid clones are inserted.
  **Setup**: Long document with intro text, grid in middle, outro text; grid requires splitting.
  **Expectations**: Intro stays on page 1, outro starts right after last grid clone; no duplicate or missing siblings.
  **Notes**: Guard for DOM insertion regressions.

## Row Content Slicing
- **TC-GRID-010 — Single Row Needs Slicing**
  **Purpose**: Exercise row-level slicing when one grid row exceeds page height.
  **Setup**: Grid with one row containing tall text block triggering slicers; other rows small.
  **Expectations**: Row content divided across consecutive pages with preserved ordering inside clones.
  **Notes**: Ensure slicer reuse from table splitter works for grids.
- **TC-GRID-011 — Mixed Content Slicing**
  **Purpose**: Validate slicers with heterogeneous content (text, inline images, lists) inside one grid cell.
  **Setup**: Single-row grid cell contains multi-node content requiring multiple split points.
  **Expectations**: Each clone keeps structural integrity (lists not broken mid-item), markers span pages in order.
  **Notes**: Refs existing `case7` / `case8` fixtures.
- **TC-GRID-012 — Unsplittable Block Forces Push**
  **Purpose**: Ensure we push entire row to next page when cell contains unsplittable element (e.g., large SVG).
  **Setup**: Row with image taller than remaining space but shorter than full page.
  **Expectations**: Row moves intact to next page; warning or diagnostic emitted about unsplittable content.
  **Notes**: Check `needsScalingInFullPage` handling.
- **TC-GRID-013 — Scaling Oversized Asset**
  **Purpose**: Regression guard for scaling fallback when even full page is insufficient.
  **Setup**: Row with `data-testid="like_image"` style asset requiring scaling (see `case9`).
  **Expectations**: Asset scaled, row spans multiple pages if needed, no infinite loop.
  **Notes**: Assert presence of scaling class/attribute.
- **TC-GRID-014 — Multi-Row Slice With Carryover**
  **Purpose**: Verify splitting when two consecutive rows overflow the same page and ensure carryover resets budgets properly.
  **Setup**: Grid where page budget causes last row of page N and first row of page N+1 to be clones of the same parent wrapper.
  **Expectations**: No empty clones; content resumes seamlessly on next page.
  **Notes**: Targets regressions with bookkeeping of height budgets.

## Guarded Layouts (Expect Skip + Warning)
- **TC-GRID-020 — Auto-Flow Column**
  **Purpose**: Confirm we abort splitting when `grid-auto-flow: column`.
  **Setup**: Grid using column flow with reordered items.
  **Expectations**: Grid remains single block, warning logged once.
  **Notes**: Spy on logger or helper collecting warnings.
- **TC-GRID-021 — Auto-Flow Dense**
  **Purpose**: Guard for `grid-auto-flow: row dense`.
  **Setup**: Dense auto-placement with gaps filled.
  **Expectations**: No split, warning captured.
  **Notes**: Ensures detection hook stays active.
- **TC-GRID-022 — Template Areas**
  **Purpose**: Ensure templates relying on `grid-template-areas` are skipped.
  **Setup**: Define areas mapping multiple rows, request split.
  **Expectations**: Warning, untouched grid.
  **Notes**: Adds coverage for doc section 4.
- **TC-GRID-023 — Row Span > 1**
  **Purpose**: Validate spans trigger "treat as atomic" behavior.
  **Setup**: Item with `grid-row: span 2` crossing rows.
  **Expectations**: Entire grid skipped (or row moved intact depending on policy) + warning.
  **Notes**: Regression for span detection.
- **TC-GRID-024 — Named Lines / Auto-Fit Tracks**
  **Purpose**: Guard against advanced track definitions (`[line-name]`, `auto-fit`, `fit-content`).
  **Setup**: Template columns using named lines and `auto-fit`.
  **Expectations**: Skip splitting, warning message referencing unsupported track sizing.
  **Notes**: Aligns with doc section 7 & 11.
- **TC-GRID-025 — Implicit Track Gaps**
  **Purpose**: Detect scenario where `grid-row-start` jumps numbers creating implicit rows.
  **Setup**: Items starting at row 4 with only two explicit rows.
  **Expectations**: Skip splitting, warning explaining implicit tracks.
  **Notes**: Ensures guard logic stays intact.

## Mixed Content & Integration
- **TC-GRID-030 — Nested Grid Child**
  **Purpose**: Ensure inner grids carry `flagNoBreak` (or equivalent) and outer split still works.
  **Setup**: Outer monotonic grid; one cell contains nested grid taller than page.
  **Expectations**: Outer grid splits by rows, nested grid remains intact within each slice.
  **Notes**: Asserts no double splitting.
- **TC-GRID-031 — Absolute Positioned Child**
  **Purpose**: Regression guard for zero-height positioned children.
  **Setup**: Cell with `position: absolute` element overlapping content.
  **Expectations**: Splitter either copies positioned node correctly or emits skip warning; final render matches baseline screenshot.
  **Notes**: Snapshot test recommended.
- **TC-GRID-032 — Adjacent Grids In Flow**
  **Purpose**: Validate multiple grids in the same document do not interfere with one another.
  **Setup**: Two monotonic grids back-to-back, both requiring splits.
  **Expectations**: Each grid produces its own clone sequence; page count matches sum of both scenarios.
  **Notes**: Catches shared state leakage.
- **TC-GRID-033 — Grid With Media Queries**
  **Purpose**: Ensure responsive templates (different tracks under test viewport) still split correctly.
  **Setup**: Grid with media query switching from 4-column to 2-column layout at test width.
  **Expectations**: Splitting logic uses computed layout; assertions anchored to viewport-specific arrangement.
  **Notes**: Requires deterministic viewport in test harness.
- **TC-GRID-034 — Runtime Mutation After Split**
  **Purpose**: Simulate framework re-render after splitter runs to verify data attributes/metadata survive.
  **Setup**: Trigger mutation (e.g., script modifying a cell) post-split.
  **Expectations**: DOM remains consistent; no duplicate clones or missing nodes.
  **Notes**: Helps document runtime mutation limitation from edge-case doc.

## Diagnostics & Observability
- **TC-GRID-040 — Warning Telemetry Smoke**
  **Purpose**: Central test ensuring warnings funnel to telemetry/log sink with useful payload (grid id, reason).
  **Setup**: Trigger one skip guard (e.g., template areas) under instrumentation.
  **Expectations**: Warning contains guard code, grid selector, and is emitted only once.
  **Notes**: Useful for contract tests with consumer apps.
- **TC-GRID-041 — Safe-To-Split Helper**
  **Purpose**: Once helper exists, verify it flags same conditions as runtime splitter.
  **Setup**: Call helper on fixtures from TC-GRID-020…025 and a passing monotonic case.
  **Expectations**: Boolean matches actual runtime behavior.
  **Notes**: Placeholder until helper is implemented.

## Coverage Gaps / Future Work
Track these as TODO items when new capabilities land.
- CSS subgrid support once implemented.
- Interaction with `grid-template-columns` using CSS custom properties resolved at runtime.
- Scaling strategy for multi-page charts (once design finalized).
- Performance regression test covering multiple large grids in one document.
