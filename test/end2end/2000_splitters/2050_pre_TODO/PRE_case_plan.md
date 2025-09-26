## Matrix of Cases for Automated Tests

### A. PRE Position on the Page (Context)
1. PRE is the first element on the page (immediately after content-flow-start).
2. A fixed-height “pusher” block is placed before PRE (sweep heights around the boundary: from –50 to +50 px relative to “fits/doesn’t fit”, step = 1–2 px).
3. Paragraphs that themselves break are placed before PRE (verify that PRE still attempts to split rather than being moved whole).
4. PRE is the last element on the page (with/without trailing margins of its parent).

### B. PRE Geometry

Vary independently:
* **margin**: none / top only / bottom only / top + bottom (e.g., 0 / 12 / 24 / 48).
* **padding**: none / top / bottom / both.
* **border**: none / top / bottom / both (1–2 px is enough).
* **line-height**: base / increased (e.g., 1.0 / 1.25 / 1.5).
* **white-space**: pre (baseline). (If pre-wrap or break-spaces are ever planned, that’s a separate test package: the current splitting algorithm relies on \n, not visual wraps.)
* **splitLabelHeight**: 0 / 24 (if the label actually renders).
* **"decoration"**: Verify that first (bottom-cut) and last (top-cut) PRE chunks have their irrelevant frames (padding/border/margin) neutralized after splitting.

### C. Content Volume (Lines)
* Few lines (< minimum threshold) — must not split.
* Exactly at the threshold (first + last blocks).
* More than the threshold but still fits on one page.
* “Exactly at the boundary” (last line flush with the bottom).
* Does not fit:
    * splits into 2 parts;
    * splits into 3+ parts;
    * check that the first part leaves no artificial gap;
    * check that middle parts do not waste height on extra frames/labels (if present);
    * check that the last part ends correctly.

### D. Flags / Restrictions
* PRE with no-break — must not split and should move as a whole.
* PRE inside a container with a large parent “tail” — ensure the tail logic in pages.js does not intercept PRE behavior before attempting to split.

### E. Boundary-Value Regressions
* Test series with “pusher”, height step = 1 px:
    * no margin/padding/border;
    * margin-top only;
    * only bottom padding/border;
    * with a splitLabelHeight.
* For each run, record: whether pre.split() was called, whether splitters were produced, and the bottom gap of the first chunk (visually and in the model).
