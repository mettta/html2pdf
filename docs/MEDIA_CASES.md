# IMAGES

## IMAGE types for test coverage
Inline vs CSS vs Media vs Special

### 1) Inline content images
* `<img>` — [core]
* `<picture>` + `<source>` responsive — [core]
* `<figure>` + `<figcaption>` — [core]
* Inline `<svg>` — [core]
* `<canvas>` with drawn bitmap — [rare]
* `<video poster="…">` as static image placeholder — [rare]
* `<embed>` / `<object>` embedding SVG/bitmap — [rare]
* MathML `<mglyph>` inside `<math>` — [rare]

### 2) CSS / decorative images
* `background-image` (single/multiple) — [core]
* `::before` / `::after` with `content: url(...)` — [core]
* `list-style-image` (custom list marker) — [rare]
* `border-image` — [rare]
* `mask-image` / `clip-path` with image — [rare]
* `cursor: url(...)` — [rare, usually irrelevant for print]
* `filter: url(...)` (SVG filters loading external resources) — [rare]

### 3) Media fallbacks / generated
* Poster frame for `<video>` — [rare]
* Generated preview of `<object>` / `<embed>` — [rare]

### 4) Special attributes / resources
* Favicon `<link rel="icon">` — [rare, typically not in printed content]
* `meta property="og:image"` (OpenGraph) — [rare, not rendered but can leak into export)

## Test cases for IMAGE

### 1. Position relative to page break

* At the edge of the page:
    * exactly at the border (top matches the bottom edge of the previous page)
    * overflowing (need to decide: move it entirely or cut/scale it)
* In the middle of the page:
    * fits completely

### 2. Size/fit (without scaling)

* Normal: fits width and height
    * of current page
    * of remaining space
* Height > remaining height on the current page
* Height > full page height
    * At the edge of the page
    * after moving to the next page
    * In the middle of the page
* Width > page width (or container width)
    * At the edge of the page
    * In the middle of the page:
      the width of the image overflows, but in terms of height, it (or its parent) fits, and we can skip checking this element.
* Both width and height exceed limits
* Extreme aspect ratios:
    * ultra-wide (panorama)
    * ultra-tall (long infographics)

### 3. Scaling/size styles

* `max-width: 100%` + `height: auto`
* Specified fixed width/height in px
* Relative units: %, vw, vh, em
* CSS aspect ratio (with/without intrinsic size)
* object-fit: `contain` / `cover` / `fill` / `none` / `scale-down`
* Container restrictions: `max-height`/`max-width`
* Scaling ‘to fit’ when moving to a new page
* “scaling forbidden”

### 4. Container and surroundings

* Inside a figure with figcaption (long/short caption)
* Inside a block container with padding/borders/margins (box accounting)
* Inside a flex container: row/column, flex-wrap on/off, align-items various
* Inside CSS Grid: fixed/auto rows, auto placement
* Inside a table:
    * in a cell that falls on a table row break
    * rowspan/colspan across the page border
* Inside a list (`li`) — IMAGE block placement within list
* Inside an element with a border and shadow — visual clipping on the page
* (extra) Inside columns (column-count/column-width) — interaction with column and page breaks

* Inside inline/invisible element
    * only child
    * the first
    * the last

### 5. float / positioning

* `float: left/right` with surrounding text — what is carried over together/separately
* `clear: before/after` an image at the edge of the page
* position: `relative`/`absolute`/`fixed`/`sticky`: printed IMAGE behavior (presence/repetition/position)
* `z-index` overlapping page headers/footers (IMAGE not hidden/cut)
* `transform: rotate/scale` (visual size ≠ layout box): computed IMAGE box not cut
* `filter`: does not affect layout, IMAGE not distorted/cut at page boundary

### 6. Page break rules

* `page-break-inside: avoid / break-inside`: avoid on img/figure
* `page-break-before/after` (break-before/after) around IMAGE
* “Keep with caption” (not implemented): check indivisibility of figure
* Group ‘image + caption + source’ as an indivisible block (keep-with-next/prev simulation)

### 7. Image types / source

* Raster: PNG/JPEG/WebP/AVIF (including transparency)
* SVG:
    * with intrinsic size
    * without intrinsic size (requires CSS dimensions)
* srcset/sizes (responsive) — chosen resource changes final size
* data: URL and blob: URL
* CORS-restricted but cached locally
    * layout box remains consistent (width/height preserved)
    * visual placeholder (icon/alt text/empty frame) is shown correctly without breaking pagination
* EXIF orientation (portrait/landscape, auto-rotation on render)

### 8. Loading / stability

* loading="lazy" vs pagination (lazy images before/after page breaking)
* Missing naturalWidth/Height at layout time → late reflow
* Broken link (404) — behavior of container/alt block
* Very large file (slow decode) — timing/determinism of pagination

### 9. Alternatives / semantics / accessibility

* alt: short/long — does not affect IMAGE box/placeholder size
* figure > figcaption before/after, multi-paragraph caption — treated as one IMAGE block
* Image as a link (`<a><img></a>`) — handling clickable block across pages
* Image map (clickable areas):
    * OR split across page break → coordinate correctness
    * OR coordinates correct within one page (not split)

### 10. Backgrounds and pseudo-elements

* Background image on a block (background-image) with:
    * `background-size: cover/contain`
    * `background-attachment: fixed/scroll` in print
    * repeating backgrounds (repeat) — clipped at page boundary
* Pseudo-elements `::before`/`::after` with background images
* Pseudo-elements `::before`/`::after` with `content: url(...)` (distinct from background-image)
* list-style-image for list markers — image marker not split/clipped at page break
* Multiple backgrounds on the same element

### 11. Writing direction / scripts

* `direction`: rtl.
* writing-mode: vertical-rl / vertical-lr: correct logical axis, IMAGE transferred as a block.
* Mixed languages around IMAGE — ignore neighbors, only verify IMAGE placement.

### 12. footnotes (not implemented)

* Footnote inside figcaption: stays on the same page as IMAGE block

### 13. (removed)

### 14. Combined IMAGE edge cases
* Multiple consecutive IMAGEs: each placed cleanly, no overlaps/cuts.
* IMAGE inside details/summary (open/closed).
* IMAGE inside pre/code.
* IMAGE in a card with shadow/border-radius: no clipping at page edge.

### 15. Performance / determinism
* Many large IMAGEs on a page: memory/speed, stable placement between runs.
* Re-pagination (resize/print scaling): IMAGE placement remains stable.
* With vs without cache: same IMAGE placement points.

## 16. TODO
* Find all media with overflow width and process them beforehand?  Then we will measure and adjust them by height.
