// tests/api.test.js
const request = require('supertest');
const express = require('express');
const { startApiServer } = require('../src/api');

// Mock del bot de Telegram
const mockBot = {
  sendMessage: jest.fn(),
  sendLocation: jest.fn()
};

describe('API Server', () => {
  let app;
  let apiRouter;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    apiRouter = startApiServer(mockBot);
    app.use(apiRouter);

    // Limpiar mocks
    jest.clearAllMocks();
  });

  describe('POST /api/timing', () => {
    test('should respond with 401 for missing API token', async() => {
      const timingData = {
        coordinates: '40.7128,-74.0060',
        chatId: '123456789'
      };

      const response = await request(app)
        .post('/api/timing')
        .send(timingData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Token de API inválido');
    });

    test('should respond with 400 for missing required fields', async() => {
      const incompleteData = {
        chatId: '123456789'
        // falta coordinates
      };

      const response = await request(app)
        .post('/api/timing')
        .set('X-API-Token', 'test_token')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /health', () => {
    test('should return health status', async() => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('time');
    });
  });
});
