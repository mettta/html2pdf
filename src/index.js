import { VERSION } from './version.js';
console.info(`[HTML2PDF4DOC] Version:`, VERSION);

import App from './app.js';

const script = document.currentScript;
const dataset = script && script.dataset;

let app = null;
let isManualInit = false;

if (!dataset) {
  console.warn(
    `[HTML2PDF4DOC] ⛔ Unable to read parameters from the current <script> tag. ` +
    `Please include the library as a classic <script> (without type="module" and without dynamic injection). ` +
    `Use data-* attributes to pass configuration if needed.`
  );
} else {
  app = new App(dataset);
  isManualInit = dataset.init === "manual";
  isManualInit && console.info(`HTML2PDF4DOC in manual initialization mode`);
  !isManualInit && app.render();
}

export function init() {
  isManualInit && app && app.render();
}
