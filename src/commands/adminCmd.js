// src/commands/adminCmd.js
const logger = require('../config/logger');
const { isAdmin } = require('../middlewares/authMiddleware');
const storage = require('../storage');

/**
 * Comandos administrativos del bot
 */
const adminCommands = {
  /**
   * Maneja el comando /changeOP para cambiar nombre de operador
   * @param {Object} bot - Instancia del bot
   * @returns {Function} Manejador de comando
   */
  handleChangeOP(bot) {
    return (msg, match) => {
      const chatId = msg.chat.id;
      const fromId = msg.from.id;

      logger.info(`Intento de cambio de nombre de operador por usuario ${fromId}`);

      if (!isAdmin(fromId)) {
        logger.warn(`Usuario no autorizado ${fromId} intentó usar /changeOP`);
        bot.sendMessage(chatId, '❌ No tienes permiso para usar este comando.');
        return;
      }

      const args = match[1].split(' ');
      if (args.length < 2) {
        logger.warn('Formato incorrecto en comando changeOP');
        bot.sendMessage(chatId, '❌ Formato incorrecto. Usa: /changeOP <user_id> <new_name>');
        return;
      }

      const userId = args[0];
      const newName = args.slice(1).join(' ');

      if (isNaN(userId)) {
        logger.error(`ID de usuario inválido: ${userId}`);
        bot.sendMessage(chatId, '❌ El ID de usuario debe ser un número.');
        return;
      }

      storage.setUserName(userId, newName);
      logger.info(`Nombre de usuario actualizado`, { userId, newName });
      bot.sendMessage(chatId, `✅ Nombre asignado al usuario ${userId}: ${newName}`);
    };
  },

  /**
   * Maneja el comando /changeOPs para registrar múltiples operadores
   * @param {Object} bot - Instancia del bot
   * @returns {Function} Manejador de comando
   */
  handleChangeOPs(bot) {
    return (msg, match) => {
      const chatId = msg.chat.id;
      const fromId = msg.from.id;

      logger.info(`Intento de cambio múltiple de nombres de operadores por usuario ${fromId}`);

      if (!isAdmin(fromId)) {
        logger.warn(`Usuario no autorizado ${fromId} intentó usar /changeOPs`);
        bot.sendMessage(chatId, '❌ No tienes permiso para usar este comando.');
        return;
      }

      try {
        const entries = match[1].split(',').map(entry => entry.trim());
        let successCount = 0;
        let failCount = 0;
        let responseMessage = '📝 *Resultado del registro múltiple:*\n\n';

        entries.forEach(entry => {
          const [userId, ...nameParts] = entry.split(':').map(part => part.trim());
          const newName = nameParts.join(':').trim(); // Une todas las partes del nombre en caso de que contenga ':'

          if (!userId || !newName) {
            failCount++;
            responseMessage += `❌ Entrada inválida: ${entry}\n`;
            return;
          }

          if (isNaN(userId)) {
            failCount++;
            responseMessage += `❌ ID inválido: ${userId}\n`;
            return;
          }

          storage.setUserName(userId, newName);
          successCount++;
          responseMessage += `✅ ID ${userId} registrado como: ${newName}\n`;
        });

        responseMessage += `\n📊 *Resumen:*\n`;
        responseMessage += `✅ Registros exitosos: ${successCount}\n`;
        if (failCount > 0) {
          responseMessage += `❌ Registros fallidos: ${failCount}\n`;
        }

        logger.info(`Cambio múltiple completado`, {
          successCount,
          failCount
        });

        bot.sendMessage(chatId, responseMessage, { parse_mode: 'Markdown' });
      } catch (error) {
        logger.error('Error en cambio múltiple de operadores:', error);
        bot.sendMessage(chatId, '❌ Error en el procesamiento. Verifica el formato: /changeOPs id1:nombre1, id2:nombre2');
      }
    };
  }
};

module.exports = adminCommands;