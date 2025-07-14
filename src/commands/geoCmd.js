// src/commands/geoCmd.js
const logger = require('../config/logger');
const config = require('../config');
const storage = require('../storage');
const hereService = require('../services/hereService');
const reportService = require('../services/reportService');
const { isAdmin } = require('../middlewares/authMiddleware');

/**
 * Implementación del comando /geo para obtener ubicaciones actuales
 * @param {Object} bot - Instancia del bot
 * @returns {Function} Manejador de comando
 */
module.exports = bot => {
  return async msg => {
    const chatId = msg.chat.id;
    const fromId = msg.from.id;

    logger.info(`Comando geo solicitado por usuario ${fromId}`);

    if (!isAdmin(fromId)) {
      logger.warn(`Usuario no autorizado ${fromId} intentó usar /geo`);
      bot.sendMessage(chatId, '❌ No tienes permiso para usar este comando.');
      return;
    }

    try {
      bot.sendMessage(
        chatId,
        '🔄 Obteniendo información de ubicación de las unidades...'
      );

      const reportData = {};
      const currentTime = Date.now();
      const groupChats = storage.getAllGroupChats();
      const userLocations = storage.getAllUserLocations();

      logger.debug(
        `Datos para procesar: ${Object.keys(groupChats).length} grupos, ${Object.keys(userLocations).length} ubicaciones`
      );

      // Recorrer todos los grupos con sus ubicaciones
      for (const [groupId, groupName] of Object.entries(groupChats)) {
        const users = userLocations[groupId];
        if (!users || Object.keys(users).length === 0) {
          logger.debug(
            `Grupo ${groupName} (${groupId}) sin ubicaciones registradas`
          );
          continue;
        }

        logger.info(`Procesando grupo ${groupName}`);
        reportData[groupName] = [];

        // Procesar cada usuario del grupo
        for (const [userId, loc] of Object.entries(users)) {
          try {
            // Obtener detalles de ubicación
            logger.debug(
              `Obteniendo detalles para usuario ${userId} en ${loc.latitude},${loc.longitude}`
            );
            const locationDetails = await hereService.getLocationDetails(
              loc.latitude,
              loc.longitude
            );

            // Calcular tiempo desde última actualización
            const lastUpdate =
              storage.getLocationLastUpdate(groupId, userId) || 0;
            const timeSinceUpdate = Math.floor(
              (currentTime - lastUpdate) / (60 * 1000)
            ); // Convertir a minutos

            reportData[groupName].push({
              userName: storage.getUserName(userId),
              location: locationDetails,
              timeSinceUpdate
            });

            logger.info(
              `Información de ubicación obtenida para usuario ${userId}`,
              {
                location: locationDetails
              }
            );
          } catch (error) {
            logger.error(`Error procesando ubicación para usuario ${userId}`, {
              error: error.message
            });
            // Añadir usuario con error al reporte
            reportData[groupName].push({
              userName: storage.getUserName(userId),
              location: { colonia: 'ERROR', municipio: 'ERROR' },
              timeSinceUpdate: 0,
              error: error.message
            });
          }
        }
      }

      if (Object.keys(reportData).length === 0) {
        logger.warn('No hay datos para generar el reporte geo');
        bot.sendMessage(
          chatId,
          '❌ No hay usuarios con ubicaciones registradas.'
        );
        return;
      }

      const reportMessage = reportService.formatGeoReport(reportData);

      // Enviar al grupo de administradores
      await bot.sendMessage(config.ADMIN_GROUP_ID, reportMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });

      if (chatId.toString() !== config.ADMIN_GROUP_ID.toString()) {
        bot.sendMessage(
          chatId,
          '✅ El reporte de ubicaciones ha sido enviado al Grupo Administrador.'
        );
      }

      logger.info('Reporte geo generado y enviado exitosamente');
    } catch (error) {
      logger.error('Error general en comando geo:', {
        error: error.message,
        stack: error.stack
      });
      bot.sendMessage(
        chatId,
        '❌ Error al generar el reporte de ubicaciones. Por favor, inténtalo más tarde.'
      );
    }
  };
};
