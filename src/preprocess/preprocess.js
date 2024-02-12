export default class Preprocess {

  constructor(config) {
    this._debugMode = config.debugMode;
  }

  run() {

    let objects = [...document.querySelectorAll('object')];
    this._debugMode && console.log(objects);

    let promises = [];

    objects.forEach((object) => {

      // * This one has a false positive:
      // if (object.contentDocument.readyState === 'complete') {
      //   this._debugMode && console.log('I was loaded', object.clientHeight, object.clientWidth, object);
      //   return;
      // }

      // * This check is expected to be done after
      // * Layout updates the DOM by changing its content part.
      // * Therefore it will be possible to register and wait for the load event.
      const promise = new Promise(resolve => {
        object.addEventListener("load", (event) => {
          this._debugMode && console.log("⏰ EVENT: object load", object.clientHeight, object.clientWidth, object);
          resolve();
        });
      });
      promises.push(promise);
    });

    return Promise.all(promises);
  }
}
