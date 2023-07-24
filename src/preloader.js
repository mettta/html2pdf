const CONSOLE_CSS_LABEL_PRELOADER = 'border:1px dashed #cccccc;'
                                  + 'background:#ffffff;'
                                  + 'color:#cccccc;'

export default class Preloader {

  constructor(customConfig) {
    this.debugMode = customConfig.debugMode; // Only enabled via user configuration
    this.preloader;
    this.preloaderTarget = document.querySelector(customConfig.preloaderTarget) || document.body;
    this.preloaderBackground = customConfig.preloaderBackground || 'white';
  }

  create() {
    this.debugMode && console.groupCollapsed('%c Preloader ', CONSOLE_CSS_LABEL_PRELOADER);

    this._insertStyle();

    this.preloader = document.createElement('div');
    this.preloader.classList.add('lds-dual-ring');
    this.preloaderTarget.append(this.preloader);

    this.debugMode && console.groupEnd('%c Preloader ', CONSOLE_CSS_LABEL_PRELOADER);
  }

  remove() {
    if (!this.preloader) { return }

    let op = 1;  // initial opacity

    const fadeTimer = setInterval(() => {
        if (op <= 0.1){
            clearInterval(fadeTimer);
            this.preloader.remove();
        }
        this.preloader.style.opacity = op;
        op -= op * 0.1;
    }, 50);

    this.debugMode && console.log("%c Preloader removed ", CONSOLE_CSS_LABEL_PRELOADER);
  }

  _insertStyle() {
    const head = document.querySelector('head');
    const style = document.createElement('style');
    style.append(document.createTextNode(this._css()));
    style.setAttribute("data-preloader-style", '');
    head.append(style);
  }

  _css() {
    return `
    /* PRELOADER */
    .lds-dual-ring {
      position: absolute;
      z-index: 99999;
      top: 0; left: 0; bottom: 0; right: 0;
      background: ${this.preloaderBackground};
      display: flex;
      justify-content: center;
      align-items: center;
    }
    /*
    .lds-dual-ring:after {
      content: " ";
      display: block;
      width: 64px;
      height: 64px;
      margin: 8px;
      border-radius: 50%;
      border: 6px solid #eee;
      border-color: #eee transparent #eee transparent;
      animation: lds-dual-ring 1.2s linear infinite;
    }
    @keyframes lds-dual-ring {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    */
  `;
  }
}
