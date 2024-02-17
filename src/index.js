import App from './app';

const HTML2PDF4DOC_VERSION = '0.0.1';
console.info(`HTML2PDF4DOC v${HTML2PDF4DOC_VERSION}`);

// new App(document.currentScript.dataset).render();

console.log('🏁 index.js');
const dataset = document.currentScript.dataset;
console.log('🏁 dataset', dataset);
const app = new App(dataset);

export function init() {
  console.log('🏁🏁🏁 init');
  app.render();
}
