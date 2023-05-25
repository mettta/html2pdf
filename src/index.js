import HTML2PDF4DOC from './app';

// test
import _emulateContent from './content';

// params
const customConfig = document.currentScript.dataset;
console.log(customConfig, 'document.currentScript')

window.addEventListener("load", function (event) {
  console.time("printTHIS");

  // _emulateContent();

  const app = new HTML2PDF4DOC(customConfig);
  app.render();

  console.timeEnd("printTHIS");
});
