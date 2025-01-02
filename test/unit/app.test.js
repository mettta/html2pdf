import { expect } from 'chai';
import { JSDOM } from 'jsdom';

describe('App DOM Initialization', () => {
  it('should create a valid DOM structure', () => {
    const dom = new JSDOM(`<html><body><div id="app"></div></body></html>`);
    const app = dom.window.document.getElementById('app');

    expect(app).to.exist;
    expect(app.tagName).to.equal('DIV');
    expect(app.id).to.equal('app');
  });
});
