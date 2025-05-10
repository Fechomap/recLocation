// src/commands/locationCmd.js
const logger = require('../config/logger');
const storage = require('../storage');

/**
 * Comando para solicitar ubicación
 * @param {Object} bot - Instancia del bot
 * @returns {Function} Manejador de comando
 */
module.exports = (bot) => {
  return (msg) => {
    const chatId = msg.chat.id;
    logger.info(`Comando /loc recibido en chat ${chatId}`);

    if (msg.chat.type === 'private') {
      bot.sendMessage(chatId, '📍 Por favor, envía tu ubicación en tiempo real de manera ilimitada.');
    } else {
      if (!storage.getGroupChat(chatId)) {
        storage.setGroupChat(chatId, msg.chat.title || `Grupo ${chatId}`);
        logger.info(`Nuevo grupo registrado: ${storage.getGroupChat(chatId)}`);
      }
      bot.sendMessage(chatId, '📍 Por favor, envía tu ubicación en tiempo real directamente en el chat.');
    }
  };
};