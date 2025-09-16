# Known Issues (to fix later)

This document tracks defects discovered during refactor that are deferred to a dedicated fix commit.

- src/DOM.js:314
  - Issue: `removeAttribute(...)` fallback branch calls `element.removeAttribute(attr)` where `attr` is undefined.
  - Impact: JavaScript ReferenceError at runtime when that code path executes.
  - Fix idea: remove the fallback or compute the attribute name; clarify API to only accept `.class`, `#id`, or `[attr]` forms.

- src/node/modules/getters.js:377
  - Issue: Spreading a DOM node into an array: `...curr` where `curr` is not iterable.
  - Impact: `TypeError: <Element> is not iterable` when unexpected children are present.
  - Fix idea: replace `...curr` with `[curr]` or stringify for logging.

- Pagination unification (planning)
  - Element-level paginator (Table/Grid) vs document-level paginator (`Pages.js`).
  - Action: evaluate unification after table refactor; avoid behavior change now.

