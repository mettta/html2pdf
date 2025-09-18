## Prompt Context
- Refactor existing `Table` paginator into reusable modules; extend the same concepts to `Grid` (and later `TableLike`).
- Keep code and documentation in English.
- Prefer small, finished commits; record open ideas and test backlogs in docs in addition to concise TODO comments.

## Project Snapshot
- `html2pdf` renders HTML into paginated print/PDF previews, ensuring stable geometry and configurable headers.
- Splitting happens per element type (tables, grids, paragraphs) using shared DOM helpers in `src/node/modules/`.
- `docs/PLAN_TABLE_REFACTOR.md` describes invariants and milestones for the refactor already underway.
- Table already supports continuation signposts and deep row splitting; Grid currently only splits between simple rows.
