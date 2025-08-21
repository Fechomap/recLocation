// tests/config.test.js
const config = require('../src/config');

describe('Config Module', () => {
  describe('validateConfig', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    test('should validate successfully with all required variables', () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test_token';
      process.env.MAPBOX_ACCESS_TOKEN = 'test_token';
      process.env.ADMIN_GROUP_ID = '-100123456789';
      process.env.ADMIN_IDS = '123456789,987654321';

      const testConfig = require('../src/config');
      expect(() => testConfig.validateConfig()).not.toThrow();
    });

    test('should throw error when TELEGRAM_BOT_TOKEN is missing', () => {
      delete process.env.TELEGRAM_BOT_TOKEN;

      const testConfig = require('../src/config');
      expect(() => testConfig.validateConfig()).toThrow(
        'Variables de entorno requeridas faltantes'
      );
    });

    test('should parse ADMIN_IDS correctly', () => {
      expect(config.ADMIN_IDS).toEqual(['123456789', '987654321']);
    });

    test('should set correct production flag', () => {
      expect(config.IS_PRODUCTION).toBe(false);
    });
  });
});
