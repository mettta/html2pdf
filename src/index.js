import HTML2PDF4DOC from './app';
import Preloader from './preloader';

// preloader
const preloader = new Preloader();
preloader.create();

// test
import _emulateContent from './content';

// params
const customConfig = document.currentScript.dataset;

// add listener
window.addEventListener("DOMContentLoaded", function (event) {
  console.log("on DOMContentLoaded Event");
  console.time("printTHIS");

  // _emulateContent();

  const app = new HTML2PDF4DOC(customConfig);
  app.render();

  preloader.remove();

  console.timeEnd("printTHIS");
});

window.addEventListener("load", function (event) {
  console.log("on Load Event");
})
