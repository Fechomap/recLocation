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
    
    // En desarrollo, primero verificar si hay un webhook y eliminarlo
    const tempBot = new TelegramBot(token, { polling: false });
    
    try {
      // Verificar si existe un webhook
      const webhookInfo = await tempBot.getWebhookInfo();
      
      if (webhookInfo && webhookInfo.url) {
        logger.info(`Encontrado webhook existente: ${webhookInfo.url}, eliminando...`);
        await tempBot.deleteWebhook();
        logger.info('Webhook eliminado correctamente');
      }
    } catch (error) {
      logger.warn('Error al verificar/eliminar webhook:', error.message);
    }
    
    // Inicializar con polling - configuración explícita para capturar todos los tipos de mensajes
    bot = new TelegramBot(token, { 
      polling: true,
      // Asegurarnos de recibir todos los tipos de actualizaciones
      allowedUpdates: ['message', 'edited_message', 'callback_query', 'inline_query']
    });
    
    // Agregar listener genérico para depuración
    bot.on('message', (msg) => {
      if (msg.text) {
        logger.debug(`Mensaje recibido: "${msg.text}" de usuario ${msg.from.id} en chat ${msg.chat.id}`);
      }
    });
    
    logger.info('Bot ejecutándose en modo polling');
    
    return bot;
  }
}

module.exports = { initializeBot };