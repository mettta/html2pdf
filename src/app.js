
import config from './config';
import SELECTOR from './selector';
import Style from './style';
import DocumentObjectModel from './DOM';
import Layout from './layout';
import Pages from './pages';
import Paper from './paper';
import Preview from './preview';

export default class HTML2PDF4DOC {
  constructor(params) {
    this.params = params
  }

  config() {
    return {
      // Parameters affect the base config,
      ...config(this.params),
      // and then also redefine the base config.
      ...this.params
    }
  }

  render() {

    const DOM = new DocumentObjectModel(window.document);
    DOM.insertStyle(new Style(this.config()).create());

    const layout = new Layout({
      DOM: DOM,
      selector: SELECTOR
    });

    const paper = new Paper({
      DOM: DOM,
      selector: SELECTOR
    });

    // console.log(paper.paperHeight);
    // console.log(paper.headerHeight);
    // console.log(paper.footerHeight);
    // console.log(paper.bodyHeight);
    // console.log(paper.frontpageFactor);
    //
    // window.document.body.prepend(paper.createFrontpage());
    // window.document.body.prepend(paper.create(3, 5));
    //
    // const layout = new Layout({
    //   DOM: DOM,
    //   selector: SELECTOR
    // });
    //
    // console.log(layout.root);
    // console.log(layout.paperFlow);
    // console.log(layout.contentFlow);

    layout.create();

    console.log('%c ✔ layout.create() ', 'background:cyan');

    const pages = new Pages({
      DOM,
      layout: layout,
      referenceHeight: paper.bodyHeight,
      referenceWidth: paper.bodyWidth,
    }).calculate();

    console.log('%c ✔ Pages.calculate() ', 'background:cyan');

    console.log('pages', pages);

    new Preview({
      DOM,
      selector: SELECTOR,
      layout: layout,
      paper: paper,
      pages: pages,
    }).create();

    console.log('%c ✔ Preview.create() ', 'background:cyan');
  }
}
