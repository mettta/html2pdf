// Shared pagination state helpers for table/grid.

/**
 * 🤖 Swap the original row entry with generated slices inside cached table/grid entries.
 * 🤖 Geometry: ensures subsequent measurements operate on the freshly inserted row fragments.
 */
export function applyRowSlicesToEntriesAfterRowSplit(entries, index, rowSlices) {
  if (!entries || !Array.isArray(entries.rows)) return;
  entries.rows.splice(index, 1, ...rowSlices);
}

/**
 * 🤖 Scan rows for ROWSPAN/COLSPAN/inconsistent cell counts and report guard flags.
 * 🤖 Geometry: tracks structural irregularities that can break slicing so callers can fall back early.
 */
export function computeRowFlags({ rows, DOM, cellTagFilter, guardCallback }) {
  if (!Array.isArray(rows)) return {};
  let hasRowspan = false;
  let hasColspan = false;
  let inconsistentCells = false;

  let prevCellCount = null;
  rows.forEach((row) => {
    const cells = Array.isArray(row) ? row : Array.from(DOM.getChildren(row) || []);
    if (prevCellCount == null) prevCellCount = cells.length;
    if (cells.length !== prevCellCount) {
      inconsistentCells = true;
    }
    cells.forEach((cell) => {
      const tag = DOM.getElementTagName(cell);
      if (!cellTagFilter || cellTagFilter(tag, cell)) {
        const rowspan = parseInt(cell.getAttribute?.('rowspan'));
        if (Number.isFinite(rowspan) && rowspan > 1) {
          hasRowspan = true;
        }
        const colspan = parseInt(cell.getAttribute?.('colspan'));
        if (Number.isFinite(colspan) && colspan > 1) {
          hasColspan = true;
        }
      }
    });
  });

  const flags = { hasRowspan, hasColspan, inconsistentCells };
  guardCallback?.(flags);
  return flags;
}
