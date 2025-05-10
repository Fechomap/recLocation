// src/bot/index.js
const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const logger = require('../config/logger');

/**
 * Inicializa el bot de Telegram según el entorno
 * En producción: configura webhook
 * En desarrollo: elimina webhook existente y usa polling
 */
async function initializeBot() {
  const token = config.TELEGRAM_BOT_TOKEN;
  let bot;

  if (config.IS_PRODUCTION) {
    logger.info('Inicializando bot en modo producción con webhook');
    
    // Crear bot sin iniciar webhook automáticamente
    bot = new TelegramBot(token, {
      webHook: { autoOpen: false }
    });
    
    return bot; // El webhook se configurará después de iniciar Express
  } else {
    logger.info('Inicializando bot en modo desarrollo con polling');
    
    // En desarrollo, eliminar cualquier webhook existente
    try {
      const tempBot = new TelegramBot(token, { polling: false });
      // Intentar eliminar webhook sin verificar primero
      await tempBot.deleteWebhook();
      logger.info('Eliminado cualquier webhook existente (si lo había)');
    } catch (error) {
      logger.warn('Error al eliminar webhook:', error.message);
    }
    
    // Inicializar con polling
    bot = new TelegramBot(token, { 
      polling: {
        interval: 300,  // Intervalo de polling en ms
        autoStart: true,
        params: {
          timeout: 10
        }
      }
    });
    
    // Confirmar que el polling está activo
    bot.on('polling_error', (error) => {
      logger.error('Error de polling:', error);
    });
    
    logger.info('Bot ejecutándose en modo polling');
    
    return bot;
  }
}

module.exports = { initializeBot };