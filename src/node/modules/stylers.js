/**
 * @this {Node}
 */
export function insertStyle(style, context = '') {
  const head = this._DOM.getElement('head');
  const body = this._DOM.body;

  if (!head && !body) {
    console.error('Check the structure of your document. We didn`t find HEAD and BODY tags. HTML2PDF4DOC expects valid HTML.');
    return
  };

  const styleElement = this.create('style', style);
  if (styleElement) {
    this._DOM.setAttribute(styleElement, this._selector.style, context);
  } else {
    console.error('Failed to create print styles');
    return
  }

  if (head) {
    this._DOM.insertAtEnd(head, styleElement);
  } else if (body) {
    this._DOM.insertBefore(body, styleElement);
  } else {
    this.strictAssert(false, 'We expected to find the HEAD and BODY tags.');
  }
}
