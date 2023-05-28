import HTML2PDF4DOC from './app';

// test
// import _emulateContent from './content';

// params
const customConfig = document.currentScript.dataset;

// add listener
window.addEventListener("DOMContentLoaded", function (event) {
  console.log("on DOMContentLoaded Event");
  console.time("printTHIS");

  const app = new HTML2PDF4DOC(customConfig);
  app.render();

  console.timeEnd("printTHIS");
});

window.addEventListener("load", function (event) {
  console.log("on Load Event");
})
