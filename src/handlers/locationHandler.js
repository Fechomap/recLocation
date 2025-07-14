// src/handlers/locationHandler.js
const storage = require('../storage');
const logger = require('../config/logger');

/**
 * Manejador de eventos de ubicación
 * @param {Object} bot - Instancia del bot
 * @returns {Function} Manejador de evento
 */
module.exports = bot => {
  return msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const { latitude, longitude } = msg.location;

    logger.info('Nueva ubicación recibida', {
      userId,
      chatId,
      latitude,
      longitude
    });

    // Si es un chat privado, registrar el chatId como el userId para mantener coherencia
    if (msg.chat.type === 'private') {
      const userName = storage.getUserName(userId);
      // Registrar como un "grupo" personal
      storage.setGroupChat(userId, `Personal - ${userName}`);

      // Actualizar ubicaciones para el ID del usuario
      storage.setUserLocation(userId, userId, { latitude, longitude });
    } else {
      // Para grupos, usar la lógica existente
      if (!storage.getGroupChat(chatId)) {
        storage.setGroupChat(chatId, msg.chat.title || `Grupo ${chatId}`);
        logger.info(
          `Grupo registrado automáticamente: ${storage.getGroupChat(chatId)}`
        );
      }

      // Actualizar ubicaciones para el grupo
      storage.setUserLocation(chatId, userId, { latitude, longitude });
    }

    logger.debug('Actualización de ubicación registrada', {
      userId,
      chatId,
      location: { latitude, longitude }
    });
  };
};
