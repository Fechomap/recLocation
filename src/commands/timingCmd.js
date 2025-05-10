// src/commands/timingCmd.js
const logger = require('../config/logger');
const config = require('../config');
const storage = require('../storage');
const hereService = require('../services/hereService');
const reportService = require('../services/reportService');
const { isAdmin } = require('../middlewares/authMiddleware');

/**
 * Implementación del comando /timing para calcular distancias y tiempos
 * @param {Object} bot - Instancia del bot
 * @returns {Function} Manejador de comando
 */
module.exports = (bot) => {
  return async (msg) => {
    const chatId = msg.chat.id;
    const fromId = msg.from.id;

    logger.info(`Comando timing solicitado por usuario ${fromId}`);
    
    // Añadir logs de diagnóstico
    logger.debug("==== DEBUG INFO ====");
    logger.debug(`Grupos registrados: ${JSON.stringify(storage.getAllGroupChats())}`);
    logger.debug(`Ubicaciones registradas: ${JSON.stringify(storage.getAllUserLocations())}`);
    logger.debug("===================");

    if (!isAdmin(fromId)) {
      logger.warn(`Usuario no autorizado ${fromId} intentó usar /timing`);
      bot.sendMessage(chatId, '❌ No tienes permiso para usar este comando.');
      return;
    }

    // Función para solicitar coordenadas de destino
    const askForCoordinates = async () => {
      return new Promise((resolve) => {
        // Envía el mensaje sin usar reply_markup
        bot.sendMessage(
          chatId,
          '📍 Por favor, envía las coordenadas de destino en formato "latitud,longitud"'
        );
    
        // Listener para capturar el siguiente mensaje del mismo usuario en el chat
        const listener = (replyMsg) => {
          // Asegurarse de que el mensaje sea del mismo chat y del mismo usuario que inició el comando
          if (replyMsg.chat.id === chatId && replyMsg.from.id === fromId && replyMsg.text) {
            const text = replyMsg.text.replace(/\s+/g, '');
            const coordPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
            if (!coordPattern.test(text)) {
              bot.sendMessage(chatId, '❌ Formato de coordenadas no reconocido. Por favor, ingresa las coordenadas en el formato "latitud,longitud"');
              // Remover listener y resolver como nulo para detener el proceso
              bot.removeListener('message', listener);
              resolve(null);
              return;
            }
            const [latStr, lonStr] = text.split(',');
            const destLatitude = parseFloat(latStr);
            const destLongitude = parseFloat(lonStr);
    
            if (isNaN(destLatitude) || isNaN(destLongitude)) {
              bot.sendMessage(chatId, '❌ Las coordenadas ingresadas no son válidas.');
              bot.removeListener('message', listener);
              resolve(null);
              return;
            }
    
            // Validar rango de coordenadas
            if (destLatitude < -90 || destLatitude > 90 || destLongitude < -180 || destLongitude > 180) {
              bot.sendMessage(chatId, '❌ Las coordenadas ingresadas están fuera de los rangos válidos.');
              bot.removeListener('message', listener);
              resolve(null);
              return;
            }
    
            // Una vez validado, removemos el listener y resolvemos la promesa
            bot.removeListener('message', listener);
            resolve({ destLatitude, destLongitude });
          }
        };
    
        bot.on('message', listener);
    
        // Tiempo límite de 5 minutos para esperar la respuesta
        setTimeout(() => {
          bot.removeListener('message', listener);
          resolve(null);
        }, 5 * 60 * 1000);
      });
    };

    try {
      bot.sendMessage(chatId, '🔄 Por favor, proporciona las coordenadas de destino...');
      
      const coordinates = await askForCoordinates();
      
      if (!coordinates) {
        logger.warn('No se proporcionaron coordenadas válidas para el timing');
        return;
      }
      
      const { destLatitude, destLongitude } = coordinates;
      logger.debug(`Coordenadas obtenidas: ${destLatitude},${destLongitude}`);
      
      // Mostrar las coordenadas que se van a usar
      const mapsUrl = `https://www.google.com/maps?q=${destLatitude},${destLongitude}`;
      await bot.sendMessage(chatId, 
        `✅ *Utilizando coordenadas:*\n\n` +
        `Coordenadas: \`${destLatitude},${destLongitude}\`\n` +
        `Ver en Google Maps: ${mapsUrl}\n\n` +
        `🔄 Calculando tiempos y distancias...`, 
        {
          parse_mode: 'Markdown',
          disable_web_page_preview: false
        }
      );

      const reportData = {};
      const groupChats = storage.getAllGroupChats();
      const userLocations = storage.getAllUserLocations();

      // Procesar ubicaciones de grupos
      for (const [groupId, groupName] of Object.entries(groupChats)) {
        const users = userLocations[groupId];
        if (!users || Object.keys(users).length === 0) {
          logger.debug(`Grupo ${groupName} sin ubicaciones`);
          continue;
        }
      
        logger.info(`Procesando grupo ${groupName}`);
        
        // Crear la entrada para este grupo
        if (!reportData[groupName]) {
          reportData[groupName] = [];
        }
      
        // Procesar cada usuario del grupo
        for (const [userId, loc] of Object.entries(users)) {
          try {
            // Evitar procesar usuarios duplicados
            const isAlreadyProcessed = Object.values(reportData).some(
              usersArray => usersArray.some(user => user.userId === userId)
            );
            
            if (isAlreadyProcessed) {
              logger.info(`Usuario ${userId} ya procesado, omitiendo duplicado`);
              continue;
            }
      
            logger.debug(`Calculando ruta para usuario ${userId} desde ${loc.latitude},${loc.longitude} hasta ${destLatitude},${destLongitude}`);
            const route = await hereService.calculateRoute(
              `${loc.latitude},${loc.longitude}`,
              `${destLatitude},${destLongitude}`
            );
      
            const distanceKm = (route.length / 1000).toFixed(2);
            const durationMin = Math.round(route.duration / 60);
            const userName = storage.getUserName(userId);
      
            reportData[groupName].push({
              userName,
              distanceKm,
              durationMin,
              userId,
              groupId
            });
      
            logger.info(`Ruta calculada para usuario ${userName}`, {
              distance: distanceKm,
              duration: durationMin
            });
      
          } catch (error) {
            logger.error(`Error calculando ruta para usuario ${userId}`, {
              error: error.message
            });
            reportData[groupName].push({
              userName: storage.getUserName(userId),
              error: 'Error al calcular la ruta.',
              userId,
              groupId
            });
          }
        }
      }

      if (Object.keys(reportData).length === 0) {
        logger.warn('No hay datos para generar el reporte de timing');
        bot.sendMessage(chatId, '❌ No hay usuarios con ubicaciones registradas.');
        return;
      }

      const reportMessage = reportService.formatTimingReport(reportData);

      // Enviar al grupo de administradores
      await bot.sendMessage(config.ADMIN_GROUP_ID, reportMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });

      if (chatId.toString() !== config.ADMIN_GROUP_ID.toString()) {
        bot.sendMessage(chatId, '✅ El reporte de timing ha sido enviado al Grupo Administrador.');
      }

      logger.info('Reporte de timing ordenado generado y enviado exitosamente');
    } catch (error) {
      logger.error('Error general en comando timing:', { error: error.message, stack: error.stack });
      bot.sendMessage(chatId, '❌ Error al generar el reporte. Por favor, inténtalo más tarde.');
    }
  };
};