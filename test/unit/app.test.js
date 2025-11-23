import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import App from '../../src/app.js';
import buildAppConfig from '../../src/appConfig.js';

describe('App class', () => {
  let dom;

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
    global.window = dom.window;
    global.document = dom.window.document;
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
  });

  describe('constructor', () => {
    it('should correctly initialize properties in the constructor', () => {
      const params = { debugMode: true, preloader: 'true' };
      const app = new App(params);

      expect(app.params).to.deep.equal(params);
      expect(app.debugMode).to.be.true;
      expect(app.preloader).to.equal('true');
      expect(app.selector).to.exist;
    });
  });

  describe('buildAppConfig', () => {
    it('enables asserts and markup flags when forced debug mode is active', () => {
      const params = { forcedDebugMode: 'true' };
      const builtConfig = buildAppConfig(params);

      expect(builtConfig.forcedDebugMode).to.be.true;
      expect(builtConfig.debugMode).to.be.true;
      expect(builtConfig.consoleAssert).to.be.true;
      expect(builtConfig.markupDebugMode).to.be.true;
      expect(builtConfig.debugConfig.testSignals.forcedModeLog).to.be.true;
    });

    it('keeps test signal disabled without forced debug mode', () => {
      const params = { debugMode: 'true' };
      const builtConfig = buildAppConfig(params);

      expect(builtConfig.forcedDebugMode).to.be.false;
      expect(builtConfig.debugMode).to.be.true;
      expect(builtConfig.consoleAssert).to.be.false;
      expect(builtConfig.markupDebugMode).to.be.false;
      expect(builtConfig.debugConfig.testSignals.forcedModeLog).to.be.false;
    });
  });

});
