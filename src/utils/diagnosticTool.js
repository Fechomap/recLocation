// src/utils/diagnosticTool.js
const logger = require('../config/logger');
const storage = require('../storage');
const config = require('../config');

/**
 * Comando de diagnóstico para verificar el estado del almacenamiento
 * @param {Object} bot - Instancia del bot
 * @returns {Function} Manejador de comando
 */
module.exports = bot => {
  return async msg => {
    const chatId = msg.chat.id;
    const fromId = msg.from.id;

    // Solo permitir a administradores usar este comando
    if (!config.ADMIN_IDS.includes(fromId.toString())) {
      logger.warn(`Usuario no autorizado ${fromId} intentó usar /diagnostico`);
      bot.sendMessage(
        chatId,
        '❌ Solo administradores pueden usar este comando.'
      );
      return;
    }

    try {
      logger.info(`Comando de diagnóstico solicitado por ${fromId}`);

      // Recopilar información de diagnóstico
      const groupChats = storage.getAllGroupChats();
      const userLocations = storage.getAllUserLocations();
      const userNames = storage.getAllUserNames();
      const locationLastUpdate = storage.getAllLocationLastUpdates();

      // Información general
      let diagnosticMessage = '📊 *Diagnóstico del Sistema*\n\n';

      // Información de grupos
      diagnosticMessage += `*Grupos Registrados:* ${Object.keys(groupChats).length}\n`;
      Object.entries(groupChats).forEach(([id, name]) => {
        diagnosticMessage += `   - ${name} (ID: ${id})\n`;
      });

      // Información de ubicaciones
      diagnosticMessage += '\n*Ubicaciones Registradas por Grupo:*\n';
      Object.entries(userLocations).forEach(([groupId, users]) => {
        const groupName = groupChats[groupId] || `Grupo ${groupId}`;
        diagnosticMessage += `   - ${groupName}: ${Object.keys(users).length} usuarios\n`;
      });

      // Información de usuarios
      diagnosticMessage += `\n*Usuarios Registrados:* ${Object.keys(userNames).length}\n`;
      const userList = Object.entries(userNames)
        .map(([id, name]) => `   - ${name} (ID: ${id})`)
        .join('\n');

      // Lista de usuarios (limitar si es muy larga)
      if (userList.length > 500) {
        diagnosticMessage += `${userList.substring(0, 500)}...\n   (lista truncada)\n`;
      } else {
        diagnosticMessage += `${userList}\n`;
      }

      // Última actualización
      diagnosticMessage += '\n*Últimas Actualizaciones:*\n';
      Object.entries(locationLastUpdate).forEach(([groupId, users]) => {
        const groupName = groupChats[groupId] || `Grupo ${groupId}`;
        const newestUpdate = Math.max(...Object.values(users));
        const timeAgo = Math.floor((Date.now() - newestUpdate) / (60 * 1000)); // minutos

        diagnosticMessage += `   - ${groupName}: Hace ${timeAgo} minutos\n`;
      });

      // Información de administradores
      diagnosticMessage += `\n*Administradores Configurados:* ${config.ADMIN_IDS.length}\n`;
      diagnosticMessage += `   - IDs: ${config.ADMIN_IDS.join(', ')}\n`;

      // Enviar mensaje
      await bot.sendMessage(chatId, diagnosticMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });

      logger.info('Diagnóstico completado y enviado exitosamente');
    } catch (error) {
      logger.error('Error al generar diagnóstico:', error);
      bot.sendMessage(
        chatId,
        '❌ Error al generar diagnóstico: ' + error.message
      );
    }
  };
};
