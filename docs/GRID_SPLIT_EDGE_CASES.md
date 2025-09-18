# Grid Split Edge Cases & Strategies

Goal: map out grid-specific risks before we extend the splitter beyond simple monotonic layouts. Each section captures detection heuristics, current behavior, and future plans.

## 1. Cloning the grid container
- **Risk**: selectors tied to child order (`:nth-child`, `:last-child`), JS hooks expecting full child list, or layout relying on contiguous content.
- **Detection**: static analysis is hard; for now assume simple selectors. Review inline styles / data attributes if needed.
- **Current strategy**: clone the grid wrapper, keep classes/inline styles, move only the rows. Document potential mismatch; add warning when custom inline styles are present.
- **Future**: consider keeping metadata (original index) to help consumer scripts if necessary.

## 2. Grouping children into virtual rows
- **Baseline**: detect rows by offset top with a small tolerance. Works for `grid-auto-flow: row` monotonic layouts.
- **Edge cases**:
  - `grid-auto-flow: column` or `row dense`: items reflow column-first or reordered tightly.
  - `grid-row` / `grid-column` with explicit `span`.
  - Implicit row creation (large `grid-row-start` gaps).
- **Detection**: check `grid-auto-flow`, inspect `gridRowStart/End`, `gridColumnStart/End` for `span`, `auto`. Identify row index gaps.
- **Current strategy**: if monotonic assumptions break, log warning and skip splitting (leave grid intact).
- **Future**: fallback into table-like processing only when we can preserve layout (e.g., treat a span as unsplittable block).

## 3. Auto-flow variations
- **Scenario**: `grid-auto-flow: column` or `dense` may change row order.
- **Detection**: `getComputedStyle(grid).gridAutoFlow`.
- **Strategy**: Do not split for now; log once. Later, handle column flow separately.

## 4. Template areas
- **Scenario**: `grid-template-areas` relies on full grid coverage.
- **Detection**: `gridTemplateAreas !== none`.
- **Strategy**: skip splitting; warn. Future: copy the template text for each slice, removing unused areas.

## 5. Span > 1 (rowspan/colspan equivalents)
- **Scenario**: items span multiple rows/cols; partial slices distort layout.
- **Detection**: `gridRowEnd`/`gridColumnEnd` contains `span` or numeric gaps.
- **Strategy**: treat the whole span block as atomic; if it does not fit → move to next page, possibly scale.
- **Future**: reuse table ROWSPAN logic once we have content slicing.

## 6. Implicit tracks and gaps
- **Scenario**: `grid-row-start: 4` with only two explicit rows triggers implicit track creation; slicing may alter spacing.
- **Detection**: compare declared template rows vs highest row index.
- **Strategy**: log and conservatively avoid splitting.
- **Future**: insert placeholder rows or normalize indices during clone to maintain gaps.

## 7. Complex width/height dependencies
- **Scenario**: items use `grid-area`, `minmax`, `subgrid`, or `fit-content` relying on siblings.
- **Detection**: inspect `gridTemplateColumns/Rows`; detect `subgrid`, `auto-fit`/`auto-fill`, `fit-content`.
- **Strategy**: document as unsupported; return unsplit with warning.
- **Future**: research how browsers compute track sizing and whether duplicating template text suffices.

## 8. Nested grids / absolute positioning
- **Nested grids**: treat inner grids as normal children; monitor heights.
- **Absolute positioned items**: height = 0 → may disappear from layout.
- **Strategy**: if child has `position:absolute`, consider moving it along but warn. For nested grids, ensure they carry `flagNoBreak` to avoid splitting inside inadvertently.

## 9. Content that cannot be broken
- **Examples**: large images/SVG, charts.
- **Strategy**: once row slicing is available, trigger fallback similar to Table: move full row to next page, scale content if even full page fails.
- **Detection**: via slicers (`getSplitPoints` returning null) or by measuring child height > window.

## 10. CSS selectors sensitive to order
- **Scenario**: the page relies on `:nth-child` order.
- **Detection**: hard; could scan stylesheets but expensive.
- **Strategy**: document limitation. Optionally add debug mode note when grid children contain IDs/classes hinting at numbering (e.g., `data-row-index`).

## Roadmap summary
- Add detection guards (auto-flow, spans, template areas) and warnings.
- Implement fallback behavior (move row, scale) for oversized content.
- Plan slicing of row content to re-use Table slicers.
- Consider providing helper that returns whether grid is “safe to split” so callers can decide.

## 11. Shared named lines / custom properties
- **Scenario**: templates use named grid lines (`[col1-start]`) or custom properties controlling placement.
- **Detection**: `gridTemplateColumns/Rows` contain brackets or `var(...)` usages.
- **Strategy**: treat as advanced layout; warn and skip splitting for now. Later, we may need to replicate definitions per slice.

## 12. Runtime mutations
- **Scenario**: frameworks mutate grid content after split (e.g., React re-render).
- **Detection**: beyond our control; note in docs that splitting manipulates DOM directly.
- **Strategy**: expose stable hooks (data attributes, original node kept as final slice) so re-rendering can rehydrate.

## 13. Debug-only guards (current implementation)
- grid-auto-flow must start with `row`.
- grid-template-areas must be `none`.
- No `span` in `grid-row-end`/`grid-column-end`.
- These checks currently result in "skip splitting"; revisit once dedicated support is in place.

