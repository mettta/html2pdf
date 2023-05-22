import _emulateContent from './content';

import DocumentObjectModel from './DOM';
import config from './config';
import Style from './style';
import Layout from './layout';
import Pages from './pages';
import Paper from './paper';
import Preview from './preview';
import SELECTOR from './selector';

window.addEventListener("load", function (event) {
  console.time("printTHIS");

  _emulateContent();

  const DOM = new DocumentObjectModel(window.document);

  DOM.insertStyle(new Style(config()).create());

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

  // window.document.body.prepend(paper.createFrontpage());
  // window.document.body.prepend(paper.create(3, 5));

  // const layout = new Layout({
  //   DOM: DOM,
  //   selector: SELECTOR
  // });

  // console.log(layout.root);
  // console.log(layout.paperFlow);
  // console.log(layout.contentFlow);

  layout.create();

  const pages = new Pages({
    DOM,
    layout: layout,
    referenceHeight: paper.bodyHeight,
    referenceWidth: paper.bodyWidth,
  }).calculate();

  console.log('pages', pages);

  new Preview({
    DOM,
    selector: SELECTOR,
    layout: layout,
    paper: paper,
    pages: pages,
  }).create();

  console.timeEnd("printTHIS");
});
