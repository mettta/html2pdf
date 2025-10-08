// Shared helpers for recording pagination parts across elements.

export function createEntries({ owner = null, currentRows = [] } = {}) {
  return {
    owner,
    currentRows: Array.isArray(currentRows) ? currentRows : [],
    parts: [],
  };
}

export function ensurePartsArray(entries) {
  if (!entries) return undefined;
  if (!Array.isArray(entries.parts)) {
    entries.parts = [];
  }
  return entries.parts;
}

export function recordPart({
  entries,
  part,
  startIndex = null,
  endIndex = null,
  type = 'unknown',
  rows = [],
  meta = undefined,
}) {
  if (!entries || !part) return null;
  const parts = ensurePartsArray(entries);
  if (!parts) return null;

  const record = {
    part,
    type,
    startIndex,
    endIndex,
    rows: Array.isArray(rows) ? [...rows] : [],
  };

  if (meta && typeof meta === 'object' && Object.keys(meta).length) {
    record.meta = { ...meta };
  }

  parts.push(record);
  return record;
}
