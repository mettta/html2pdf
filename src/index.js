import App from './app';

const HTML2PDF4DOC_VERSION = '0.0.1';
console.info(`HTML2PDF4DOC v${HTML2PDF4DOC_VERSION}`);

const dataset = document.currentScript.dataset;
const app = new App(dataset);

const isManualInit = dataset.init === "manual";
isManualInit && console.info(`HTML2PDF4DOC in manual initialization mode`);

!isManualInit && app.render();

export function init() {
  isManualInit && app.render();
}
