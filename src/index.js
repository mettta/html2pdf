import { VERSION } from './version.js';
console.info(`HTML2PDF4DOC version: ${VERSION}`);

import App from './app.js';

const dataset = document.currentScript.dataset;
const app = new App(dataset);

const isManualInit = dataset.init === "manual";
isManualInit && console.info(`HTML2PDF4DOC in manual initialization mode`);

!isManualInit && app.render();

export function init() {
  isManualInit && app.render();
}
