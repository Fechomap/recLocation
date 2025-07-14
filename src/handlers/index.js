// src/handlers/index.js
const locationHandler = require('./locationHandler');
const logger = require('../config/logger');

/**
 * Registra todos los manejadores de eventos del bot
 * @param {Object} bot - Instancia del bot
 */
function registerHandlers(bot) {
  logger.info('Registrando manejadores de eventos');

  // Manejar actualizaciones de ubicación
  bot.on('location', locationHandler(bot));

  // Manejar mensajes editados con ubicación
  bot.on('edited_message', msg => {
    if (msg.location) {
      locationHandler(bot)(msg);
    }
  });

  logger.info('Manejadores de eventos registrados');
}

module.exports = registerHandlers;
