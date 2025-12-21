// 🧭 selector heuristics (user intent, best-effort interpretation)

import { debugFor } from '../utils/debugFor.js';
const _isDebug = debugFor('selectorHeuristics');

// todo use DOM functions

/**
 * Resolves elements affected by selector-based constraints defined in config.
 *
 * The user provides CSS selectors to express *intent* (e.g. preferred page breaks,
 * no-hanging rules, special structural cases), but does not fully control the HTML structure.
 *
 * This method:
 *  - treats config selectors as **heuristic rules**, not strict CSS truth
 *  - uses CSS matching only to collect initial candidates
 *  - applies additional structural/content validation where selectors are ambiguous
 *    (e.g. :only-child, :first-child, :last-child with surrounding text)
 *  - produces the final set of elements that the layout engine can safely rely on
 *
 * In other words: selectors define *where to look*, this method decides *what actually applies*.
 *
 * This function is the single entry point for applying user-defined heuristic selectors.
 *
 * @this {Node}
 */
export function resolveConfigSelectorConstraints(selectors, target, context) {
  const out = [];
  const seen = new Set();

  _isDebug(this) && console.group(context);
  selectors.forEach(selector => {
    const nodes = this._DOM.getAllElements(selector, target); // NodeList
    const isHeuristicSelector = this.isHeuristicSelector(selector);
    _isDebug(this) && isHeuristicSelector && console.log(`🪄 [heuristic selector]`, selector, `\n${nodes.length} elements found`);

    for (const n of nodes) {
      if (isHeuristicSelector && !this.validateHeuristicSelectorMatch(n, selector)) {
        // _isDebug(this) && console.warn(
        //   'Selector constraint filtered element',
        //   {
        //     selector,
        //     element: n,
        //     reason: this.explainHeuristicSelectorMismatch(n, selector),
        //   }
        // );
        continue;
      }
      if (seen.has(n)) continue;
      seen.add(n);
      out.push(n);
    }
  });

  _isDebug(this) && console.log(context, out.length ? out : 'has no elements');
  _isDebug(this) && console.groupEnd(context);

  return out;
}

/**
 * Returns true if the selector should be treated as a heuristic signal rather than strict CSS.
 *
 * Rationale:
 * Some CSS structural pseudo-classes are ambiguous when HTML contains meaningful text nodes.
 * In such cases selectors are interpreted as heuristics expressing user intent.
 *
 * Heuristic selectors currently supported:
 *  - :only-child  ("the only meaningful child")
 *  - :first-child ("the first meaningful child")
 *  - :last-child  ("the last meaningful child")
 *
 * @this {Node}
 */
export function isHeuristicSelector(selector) {
  return /:(only-child|first-child|last-child)\b/.test(selector);
}

/**
 * Returns true if `el` has no other *significant* sibling nodes under the same parent.
 *
 * Significant nodes:
 *  - any element siblings (nodeType === 1) => NOT allowed
 *  - any non-whitespace text siblings (nodeType === 3 with trim() !== '') => NOT allowed
 *
 * Allowed:
 *  - whitespace-only text nodes (indentation/newlines) when `allowWhitespaceText` is true
 *  - comments can be ignored (configurable)
 *
 * This is a DOM-level check (uses parent.childNodes), meant to "tighten" cases where CSS :only-child
 * would otherwise ignore text nodes and match incorrectly.
 *
 * @this {Node}
 */
export function hasNoSignificantSiblingNodes(el, {
  allowWhitespaceText = true,
  ignoreComments = true,
} = {}) {
  const parent = el && el.parentNode;
  if (!parent) return false;

  for (let n = parent.firstChild; n; n = n.nextSibling) {
    // Skip the element itself
    if (n === el) continue;

    // Any extra element node means "not alone"
    if (n.nodeType === Node.ELEMENT_NODE) {
      return false;
    }

    // Text node: allow only whitespace (indentation/newlines), if configured
    if (n.nodeType === Node.TEXT_NODE) {
      if (!allowWhitespaceText) return false;
      if (n.nodeValue && n.nodeValue.trim() !== "") return false;
      continue;
    }

    // Comment node: optionally ignore
    if (n.nodeType === Node.COMMENT_NODE) {
      if (ignoreComments) continue;
      return false;
    }

    // Any other node types are treated as significant by default
    return false;
  }

  return true;
}

/**
 * Returns true if there is significant (non-whitespace) text BEFORE `el` among the parent's childNodes.
 * Comments are ignored.
 *
 * @this {Node}
 */
export function hasSignificantLeadingText(el) {
  const parent = el && el.parentNode;
  if (!parent) return false;

  for (let n = parent.firstChild; n; n = n.nextSibling) {
    if (n === el) break;
    if (n.nodeType === Node.TEXT_NODE && n.nodeValue && n.nodeValue.trim() !== '') return true;
    if (n.nodeType === Node.COMMENT_NODE) continue;
    // Any other node types are treated as significant
    if (n.nodeType !== Node.ELEMENT_NODE && n.nodeType !== Node.TEXT_NODE && n.nodeType !== Node.COMMENT_NODE) return true;
  }

  return false;
}

/**
 * Returns true if there is significant (non-whitespace) text AFTER `el` among the parent's childNodes.
 * Comments are ignored.
 *
 * @this {Node}
 */
export function hasSignificantTrailingText(el) {
  const parent = el && el.parentNode;
  if (!parent) return false;

  let after = false;
  for (let n = parent.firstChild; n; n = n.nextSibling) {
    if (!after) {
      if (n === el) after = true;
      continue;
    }
    if (n.nodeType === Node.TEXT_NODE && n.nodeValue && n.nodeValue.trim() !== '') return true;
    if (n.nodeType === Node.COMMENT_NODE) continue;
    if (n.nodeType !== Node.ELEMENT_NODE && n.nodeType !== Node.TEXT_NODE && n.nodeType !== Node.COMMENT_NODE) return true;
  }

  return false;
}

/**
 * Post-match validation for heuristic selector rules.
 *
 * CSS selectors are used to collect candidate elements.
 * This function applies additional heuristic rules where selector semantics
 * are ambiguous in the presence of text nodes.
 *
 * @this {Node}
 */
export function validateHeuristicSelectorMatch(el, selector) {
  if (/:only-child\b/.test(selector)) {
    // Accept only if there are no other significant nodes under the same parent.
    return this.hasNoSignificantSiblingNodes(el, {
      allowWhitespaceText: true,
      ignoreComments: true,
    });
  }

  if (/:first-child\b/.test(selector)) {
    // CSS checks "first element child"; we additionally reject meaningful leading text.
    return !this.hasSignificantLeadingText(el);
  }

  if (/:last-child\b/.test(selector)) {
    // CSS checks "last element child"; we additionally reject meaningful trailing text.
    return !this.hasSignificantTrailingText(el);
  }

  return true;
}

/**
 * Returns a human-readable reason for why a candidate was filtered out.
 *
 * @this {Node}
 */
export function explainHeuristicSelectorMismatch(el, selector) {
  if (/:only-child\b/.test(selector)) return 'has significant sibling nodes (text/elements)';
  if (/:first-child\b/.test(selector)) return 'has significant leading text';
  if (/:last-child\b/.test(selector)) return 'has significant trailing text';
  return 'failed heuristic validation';
}

/**
 * Helper to filter a list of already-matched nodes for a given selector.
 * This helper mirrors the internal heuristic filtering logic but is not used by the engine itself.
 *
 * Not used internally.
 * Kept for potential external / future usage.
 *
 * @this {Node}
 */
export function filterHeuristicSelectorMatches(matches, selector) {
  if (!this.isHeuristicSelector(selector)) return matches;
  return matches.filter(el => this.validateHeuristicSelectorMatch(el, selector));
}
