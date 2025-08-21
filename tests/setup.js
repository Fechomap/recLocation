// tests/setup.js - Configuración global para tests
require('dotenv').config({ path: '.env.test' });

// Mock de variables de entorno para tests
process.env.TELEGRAM_BOT_TOKEN = 'test_token';
process.env.MAPBOX_ACCESS_TOKEN = 'test_mapbox_token';
process.env.ADMIN_GROUP_ID = '-100123456789';
process.env.ADMIN_IDS = '123456789,987654321';
process.env.NODE_ENV = 'test';
process.env.API_TOKEN = 'test_token';

// Configurar timeouts para tests
jest.setTimeout(10000);

// Mock global para console.log en tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
