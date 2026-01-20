const RESOURCE_STATUS_ATTR = 'html2pdf4doc-resource-status';
const RESOURCE_ISSUE_EVENT = 'html2pdf4doc:resource-issue';

export default class Preprocess {

  constructor(config, DOM) {
    this._config = config;
    this._DOM = DOM;
    this._debugMode = config.debugMode;
    this._resourceIssues = [];
  }

  async run() {
    await this._awaitResources();
    return this._resourceIssues;
  }

  async _awaitResources() {
    const timeoutMs = this._config.resourceTimeout ?? this._config.resourceTimeoutMs ?? 2000;
    const rootSelector = this._config.initialRoot;
    const rootElement = rootSelector
      ? this._DOM.document.querySelector(rootSelector) || this._DOM.body
      : this._DOM.body;
    const rootScope = rootElement ? [rootElement, ...rootElement.querySelectorAll('*')] : [];

    // Fonts affect text metrics; wait for them before measuring layout.
    if (this._DOM.document.fonts?.ready) {
      await this._DOM.document.fonts.ready;
    }

    // IMG elements: use decode() when available to ensure pixels are ready.
    const imagePromises = [...rootElement.querySelectorAll('img')].map((img) => {
      return this._waitForImageElement(img, timeoutMs);
    });

    // SVG <image> elements: preload external href targets.
    const svgImagePromises = [...rootElement.querySelectorAll('svg image')].map((img) => {
      const href = img.getAttribute('href') || img.getAttribute('xlink:href');
      if (!href) {
        return Promise.resolve();
      }
      return this._preloadUrl(href, img, timeoutMs);
    });

    // Background images: collect URLs from computed styles.
    const backgroundPromises = rootScope.flatMap((element) => {
      const style = window.getComputedStyle(element);
      const urls = extractCssUrls(style.backgroundImage);
      return urls.map((url) => this._preloadUrl(url, element, timeoutMs));
    });

    // Object/Embed: wait for load/error; treat "load without content" as error.
    const objectPromises = [...rootElement.querySelectorAll('object, embed')].map((el) => {
      const basePromise = new Promise((resolve) => {
        el.addEventListener('load', () => {
          // Object may dispatch "load" even if the content failed to load.
          if (el.tagName === 'OBJECT' && !el.contentDocument) {
            this._markResourceStatus(el, 'error');
          }
          resolve();
        }, { once: true });
        el.addEventListener('error', () => {
          // Explicit error from the resource loader.
          this._markResourceStatus(el, 'error');
          resolve();
        }, { once: true });
      });
      return withTimeout(basePromise, timeoutMs, () => this._markResourceStatus(el, 'timeout'));
    });

    await Promise.all([
      ...imagePromises,
      ...svgImagePromises,
      ...backgroundPromises,
      ...objectPromises,
    ]);
  }

  _waitForImageElement(img, timeoutMs) {
    // If loading already ended with a broken image, mark it as error.
    if (img.complete && img.naturalWidth === 0) {
      this._markResourceStatus(img, 'error');
      return Promise.resolve();
    }
    const basePromise = img.decode
      ? img.decode().catch(() => {
          // decode() failure means image content is not usable.
          this._markResourceStatus(img, 'error');
        })
      : img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', () => {
              // Explicit error from the image loader.
              this._markResourceStatus(img, 'error');
              resolve();
            }, { once: true });
          });
    return withTimeout(basePromise, timeoutMs, () => this._markResourceStatus(img, 'timeout'));
  }

  _preloadUrl(url, element, timeoutMs) {
    // Preload as Image to reuse the browser cache for layout measurements.
    if (!url || url.startsWith('data:')) {
      return Promise.resolve();
    }
    const img = new Image();
    const basePromise = new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', () => {
        // If the preload fails, mark the original element.
        this._markResourceStatus(element, 'error');
        resolve();
      }, { once: true });
    });
    img.src = url;
    return withTimeout(basePromise, timeoutMs, () => this._markResourceStatus(element, 'timeout'));
  }

  _markResourceStatus(element, status) {
    if (!element || element.hasAttribute(RESOURCE_STATUS_ATTR)) {
      return;
    }
    // Status note: "error" is typical for failed or missing resources (e.g. file:// 404),
    // while "timeout" indicates a request that did not finish before the deadline.
    this._DOM.setAttribute(element, `[${RESOURCE_STATUS_ATTR}]`, status);
    if (this._debugMode) {
      // Debug-only log to show which element was affected.
      console.log(`[HTML2PDF4DOC] Resource status: ${status}`, element);
    }
    this._handleResourceIssue({ element, status });
  }

  _handleResourceIssue(issue) {
    if (!issue || !issue.element) {
      return;
    }
    const entry = {
      status: issue.status,
      element: issue.element,
      tag: issue.element.tagName,
    };
    this._resourceIssues.push(entry);
    this._warnResourceIssue(entry);
    this._emitResourceIssue(entry);
  }

  _warnResourceIssue(issue) {
    // Always warn so the caller can react even when debug mode is off.
    console.warn(`[HTML2PDF4DOC] Resource ${issue.status}`, issue.element);
  }

  _emitResourceIssue(issue) {
    this._DOM.document.dispatchEvent(new CustomEvent(RESOURCE_ISSUE_EVENT, { detail: issue }));
  }
}

// --- Utilities ---
function withTimeout(promise, timeoutMs, onTimeout) {
  if (!timeoutMs || timeoutMs <= 0) {
    return promise.catch(() => {});
  }
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      onTimeout();
      resolve();
    }, timeoutMs);
    promise
      .catch(() => {})
      .finally(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      });
  });
}

function extractCssUrls(value) {
  if (!value || value === 'none') {
    return [];
  }
  const urls = [];
  const regex = /url\((['"]?)(.*?)\1\)/g;
  let match;
  while ((match = regex.exec(value)) !== null) {
    if (match[2]) {
      urls.push(match[2]);
    }
  }
  return urls;
}
