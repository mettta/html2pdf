import _emulateContent from './_emulateContent';

import DocumentObjectModel from './DOM';
import config from './config';
import Style from './style';
import Layout from './layout';
import Pages from './pages';
import Paper from './paper';
import Preview from './preview';
import Template from './template';



window.addEventListener("load", function (event) {
  console.time("printTHIS");

  _emulateContent();

  const DOM = new DocumentObjectModel(window.document);

  DOM.insertStyle(new Style(config()).create());

  const template = new Template(DOM);

  console.log(template.frontpage);
  console.log(template.header);
  console.log(template.footer);

  const paper = new Paper({ DOM, template });

  console.log(paper.paperHeight);
  console.log(paper.headerHeight);
  console.log(paper.footerHeight);
  console.log(paper.bodyHeight);
  console.log(paper.frontpageFactor);

  // window.document.body.prepend(paper.createFrontpage());
  // window.document.body.prepend(paper.create(3, 5));

  const layout = new Layout(DOM);

  console.log(layout.root);
  console.log(layout.paperFlow);
  console.log(layout.contentFlow);

  layout.create();

  const pages = new Pages({
    DOM,
    contentFlow: layout.contentFlow,
    referenceHeight: paper.bodyHeight,
  }).calculate();

  // pages.calculate();

  console.log(pages);

  new Preview({
    DOM,
    contentFlow: layout.contentFlow,
    paperFlow: layout.paperFlow,
    paper: paper,
    pages: pages,
  }).create();




  // new Layout(store).create();
  // new Pages(store).calculate();
  // new Preview(store).create();


  console.timeEnd("printTHIS");
});