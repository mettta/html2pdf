import HTML2PDF4DOC from './app';

const HTML2PDF4DOC_VERSION = '0.0.1';
console.info(`HTML2PDF4DOC v${HTML2PDF4DOC_VERSION}`);

new HTML2PDF4DOC(document.currentScript.dataset).render();
