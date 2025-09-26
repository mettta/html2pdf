// ♻️ flowfilters

import { debugFor } from '../utils/debugFor.js';
const _isDebug = debugFor('flowfilters');

// Cache marker so each element is evaluated at most once per run.
const FLOW_SKIP_FLAG = '__html2pdfFlowFilter';

const SKIP_RULES = [
  {
    test: (style) => style.display === 'none',
    cache: {
      reason: 'display:none',
      message: '* display:none — skipped',
    },
  },
  {
    test: (style) => style.position === 'absolute',
    cache: {
      reason: 'position:absolute',
      message: '* position:absolute — skipped',
    },
  },
  {
    test: (style) => style.position === 'fixed',
    cache: {
      reason: 'position:fixed',
      message: '* position:fixed — skipped',
    },
  },
  {
    test: (style) => style.visibility === 'collapse',
    cache: {
      reason: 'visibility:collapse',
      message: '* visibility:collapse — skipped',
    },
  },
];

function logSkip(node, context, cache, element, { cached } = { cached: false }) {
  if (!_isDebug(node)) return;
  const prefix = context ? `(${context}) ` : '';
  const suffix = cached ? ' (cached)' : '';
  console.info(`🚸 ${prefix}${cache.message}${suffix}`, [element]);
}

export function shouldSkipFlowElement(element, { context = '', computedStyle } = {}) {
  if (!element || !this || !this._DOM || !this._DOM.isElementNode(element)) {
    return false;
  }

  const cached = element[FLOW_SKIP_FLAG];
  if (cached) {
    logSkip(this, context, cached, element, { cached: true });
    return true;
  }

  const style = computedStyle ?? this._DOM.getComputedStyle(element);
  if (!style) {
    return false;
  }

  for (const rule of SKIP_RULES) {
    if (rule.test(style)) {
      element[FLOW_SKIP_FLAG] = rule.cache;
      logSkip(this, context, rule.cache, element);
      return true;
    }
  }

  return false;
}
