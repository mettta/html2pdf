export default class Preprocess {

  constructor(customConfig) {
    this._debugMode = customConfig.debugMode; // Only enabled via user configuration
  }

  run() {
    let objects = [...document.querySelectorAll('object')];
    this._debugMode && console.log(objects);

    let promises = [];

    objects.forEach((object) => {
      if (object.contentDocument.readyState === 'complete') {
        this._debugMode && console.log('I was loaded', object);
        return;
      }
      const promise = new Promise(resolve => {
        object.addEventListener("load", (event) => {
          this._debugMode && console.log("EVENT: object load", object);
          resolve();
        });
      });
      promises.push(promise);
    });

    return Promise.all(promises);
  }
}
