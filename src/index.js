import HTML2PDF4DOC from './app';
import Preloader from './preloader';
import Preprocess from './preprocess';

const HTML2PDF4DOC_VERSION = '0.0.1';
console.info(`HTML2PDF4DOC v${HTML2PDF4DOC_VERSION}`);

// test
// import _emulateContent from './content';

// params
const customConfig = document.currentScript.dataset;
const app = new HTML2PDF4DOC(customConfig);
const preloader = new Preloader(customConfig);
const preprocess = new Preprocess(customConfig);

if (customConfig.preloader === 'true') {
  window.addEventListener("DOMContentLoaded", function (event) {
    preloader.create();
  });
  window.addEventListener("load", function (event) {
    preloader.remove();
  })
}

var promises = [];

document.addEventListener("DOMContentLoaded", (event) => {
  // console.log("DOMContentLoaded");

  const windowLoadPromise = new Promise(resolve => {
    window.addEventListener("load", (event) => {
      // console.log("EVENT: window load");
      resolve();
    });
  });
  promises.push(windowLoadPromise);
  promises.push(preprocess.run());

  Promise.all(promises)
    .then(values => {
      app.render();
    })
    .catch(error => {
      console.error(error);
    });
});
