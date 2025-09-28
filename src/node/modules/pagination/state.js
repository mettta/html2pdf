// Shared pagination state helpers for table/grid.

export function updateRowGroups(entries, index, newGroups) {
  if (!entries || !Array.isArray(entries.rows)) return;
  entries.rows.splice(index, 1, ...newGroups);
}

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
