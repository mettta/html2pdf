import HTML2PDF4DOC from './app';
import Preloader from './preloader';

const HTML2PDF4DOC_VERSION = '0.0.1';
console.info(`HTML2PDF4DOC v${HTML2PDF4DOC_VERSION}`);

// test
// import _emulateContent from './content';

// params
const customConfig = document.currentScript.dataset;
const app = new HTML2PDF4DOC(customConfig);
const preloader = new Preloader(customConfig);

// add listener

window.addEventListener("load", function (event) {
  app.render();
})

if (customConfig.preloader === 'true') {
  window.addEventListener("DOMContentLoaded", function (event) {
    preloader.create();
  });
  window.addEventListener("load", function (event) {
    preloader.remove();
  })
}
