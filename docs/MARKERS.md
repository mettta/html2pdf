# Markers System

The Markers system is the unified way to annotate DOM elements during pagination.
It separates internal logic from debug/test DOM attributes.

## Goals
- Keep the resulting DOM as close to the original as possible.
- Avoid layout thrashing by minimizing attribute writes during normal runs.
- Provide optional, explicit DOM markers for debug and tests.

## Core Concepts
- **Marks**: logical markers stored in an internal WeakMap (not in the DOM).
- **Registry**: indexed collections for structural markers (pageStart/pageEnd/pageNumber).
- **DOM attributes**: written only in debug/test mode.

## Modes
- **Normal**: marks + registry only (no DOM attributes).
- **Debug/Test**: DOM attributes are written when `data-markup-debug-mode="true"`.

## Mark Categories
- **runtime-only**: used by logic only; never required in DOM.
- **structural**: pageStart/pageEnd/pageNumber; also registered in the registry.
- **debug-only**: visual hints (e.g. processed), only meaningful in DOM.

Mark definitions live in `src/node/markers/defs.js`.

## How to Write Markers
Use marker helpers (preferred) or `setMark` directly:
- Marker helpers live in `src/node/markers/`.
- `setMark`/`clearMark` live in `src/node/markers/api.js`.

Example:
```js
this.setMark(element, 'noHanging');
this.markPageStart(element, pageNum);
```

## How to Read Markers
- Use selectors helpers (e.g. `isNoBreak`, `isSlice`) which read from marks.
- For structural markers, use the registry:
  - `getRegisteredPageEnds()`
  - `getRegisteredPageNumberForElement(element)`

## DOM Attributes
DOM attributes are for debug/test visibility only.
Enable them via HTML:
```html
<script
  data-markup-debug-mode="true"
  src=".../html2pdf4doc.js"></script>
```

## Contract Summary
- Logic reads marks/registry, not DOM attributes.
- DOM attributes are optional and must not be required by the algorithm.
