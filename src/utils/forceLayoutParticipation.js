/**
 * Sanitize third-party HTML for deterministic layout & printing.
 *
 * Purpose:
 * - Disable native and JS-based lazy loading.
 * - Ensure all layout-relevant resources are allowed to load eagerly.
 * - Prevent CSS optimizations that skip layout/paint outside the viewport.
 *
 * Must be called:
 * - After DOM is fully built (DOM available),
 * - BEFORE the browser makes lazy / layout-skipping decisions.
 */
export function forceLayoutParticipation({
  kickReload = false,
} = {}) {
  // console.log('🧲 forceLayoutParticipation');

  // --- CSS: force full layout participation ---
  const style = document.createElement('style');
  style.setAttribute('data-html2pdf-sanitize', '');
  style.textContent = 'html2pdf4doc-content-flow * { contain: none !important; content-visibility: visible !important; }'
  document.head.appendChild(style);

  // --- IMG: disable lazy + unpack JS-lazy attributes ---
  const DATA_SRC_ATTRS = ['data-src', 'data-lazy-src', 'data-original', 'data-url'];
  const DATA_SRCSET_ATTRS = ['data-srcset', 'data-lazy-srcset'];

  const pickAttr = (el, names) => {
    for (const n of names) {
      const v = el.getAttribute(n);
      if (v && v.trim()) return v.trim();
    }
    return '';
  };

  for (const img of document.images) {
    // Native lazy
    if (img.getAttribute('loading') === 'lazy') {
      img.setAttribute('loading', 'eager');
    }

    // JS-lazy src
    if (!img.getAttribute('src')) {
      const src = pickAttr(img, DATA_SRC_ATTRS);
      if (src) img.setAttribute('src', src);
    }

    // JS-lazy srcset
    if (!img.getAttribute('srcset')) {
      const srcset = pickAttr(img, DATA_SRCSET_ATTRS);
      if (srcset) img.setAttribute('srcset', srcset);
    }

    // Optional late-execution fallback: force reload
    if (kickReload) {
      const src = img.getAttribute('src');
      const srcset = img.getAttribute('srcset');
      if (src) {
        img.setAttribute('src', '');
        img.setAttribute('src', src);
      }
      if (srcset) {
        img.setAttribute('srcset', '');
        img.setAttribute('srcset', srcset);
      }
    }
  }

  // --- <picture><source>: unpack JS-lazy srcset ---
  for (const source of document.querySelectorAll('picture source')) {
    if (!source.getAttribute('srcset')) {
      const srcset = pickAttr(source, DATA_SRCSET_ATTRS);
      if (srcset) source.setAttribute('srcset', srcset);
    }
  }
}
