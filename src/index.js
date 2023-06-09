import HTML2PDF4DOC from './app';
import Preloader from './preloader';

const CONSOLE_CSS_LABEL_IND = 'border:1px solid #aa0000;'
                            + 'background:#EEEEEE;'
                            + 'color:#aa0000;'

// test
// import _emulateContent from './content';

// params
const customConfig = document.currentScript.dataset;
const app = new HTML2PDF4DOC(customConfig);
const preloader = new Preloader();

// add listener

window.addEventListener("load", function (event) {
  console.log("🔥 on Load Event ");
  console.time("printTHIS");
  app.render();
  console.timeEnd("printTHIS");
})

if (customConfig.preloader === 'true') {
  window.addEventListener("%c DOMContentLoaded", function (event) {
    preloader.create();
  });
  window.addEventListener("load", function (event) {
    preloader.remove();
  })
}
