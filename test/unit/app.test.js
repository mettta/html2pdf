import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import App from '../../src/app.js';
import config from '../../src/config.js';
import debugConfig from '../../src/debugConfig.js';

describe('App class', () => {
  let dom;

  beforeEach(() => {
    // Создаём виртуальное DOM окружение с JSDOM
    dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
    global.window = dom.window;
    global.document = dom.window.document;
  });

  afterEach(() => {
    // Убираем глобальные объекты после каждого теста
    delete global.window;
    delete global.document;
  });

  describe('constructor', () => {
    it('should correctly initialize properties in the constructor', () => {
      const params = { debugMode: true, preloader: 'true' };
      const app = new App(params);

      expect(app.params).to.equal(params);
      expect(app.debugMode).to.be.true;
      expect(app.preloader).to.equal('true');
      expect(app.selector).to.exist;
    });
  });

  // describe('config merging', () => {
  //   it('should merge config and debugConfig into this.config', async () => {
  //     const params = { debugMode: true };
  //     const app = new App(params); // Здесь App должен сам объединить конфигурации

  //     // Уберите вызов DOMContentLoaded, чтобы проверить логику
  //     // напрямую (временно).
  //     app.config = { ...config(params), debugConfig };

  //     // Ожидаемая структура config
  //     const expectedConfig = {
  //       ...config(params),
  //       debugConfig,
  //     };

  //     // Проверяем, что ключи совпадают
  //     expect(app.config).to.have.keys(Object.keys(expectedConfig));

  //     // // Проверяем значения
  //     // Object.keys(expectedConfig).forEach((key) => {
  //     //   expect(app.config[key]).to.deep.equal(expectedConfig[key]);
  //     // });
  //   });
  // });
});
