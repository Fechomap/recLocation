// src/middlewares/authMiddleware.js
const config = require('../config');
const logger = require('../config/logger');

/**
 * Middleware de autenticación y autorización
 */
const authMiddleware = {
  /**
   * Verifica si un usuario es administrador
   * @param {number|string} userId - ID del usuario a verificar
   * @returns {boolean} True si el usuario es administrador
   */
  isAdmin(userId) {
    const isAdminUser = config.ADMIN_IDS.includes(userId.toString());
    logger.debug(`Verificación de admin para usuario ${userId}: ${isAdminUser}`);
    return isAdminUser;
  },

  /**
   * Middleware para restringir comandos solo a administradores
   * @param {Object} bot - Instancia del bot
   * @param {Object} msg - Mensaje de Telegram
   * @returns {boolean} True si el usuario tiene permiso, false si no
   */
  adminOnly(bot, msg) {
    const chatId = msg.chat.id;
    const fromId = msg.from.id;

    if (!this.isAdmin(fromId)) {
      logger.warn(`Usuario no autorizado ${fromId} intentó usar un comando restringido`);
      bot.sendMessage(chatId, '❌ No tienes permiso para usar este comando.');
      return false;
    }
    
    return true;
  }
};

module.exports = authMiddleware;