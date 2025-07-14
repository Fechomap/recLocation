// src/api/index.js
const express = require('express');
const hereService = require('../services/hereService');
const reportService = require('../services/reportService');
const storage = require('../storage');
const logger = require('../config/logger');

/**
 * Crea un router Express para la API
 * @param {Object} bot - Instancia del bot Telegram
 * @returns {Object} Router Express
 */
function startApiServer(bot) {
  const router = express.Router();

  // Middleware de autenticación API simple
  const authenticateApiRequest = (req, res, next) => {
    const apiToken = req.header('X-API-Token');
    if (!apiToken || apiToken !== process.env.API_TOKEN) {
      logger.warn(`Intento de acceso a API con token inválido: ${apiToken}`);
      return res.status(401).json({ error: 'Token de API inválido' });
    }
    next();
  };

  // Endpoint de health-check (sin autenticación para verificar que el servicio está activo)
  router.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Endpoint principal para calcular timing
  router.post('/api/timing', authenticateApiRequest, async(req, res) => {
    try {
      const { coordinates, chatId } = req.body;

      if (!coordinates || !chatId) {
        logger.warn('Solicitud de timing recibida sin coordenadas o chatId');
        return res.status(400).json({
          error: 'Faltan parámetros requeridos: coordinates o chatId'
        });
      }

      logger.info(
        `Solicitud de timing recibida para destino: ${coordinates}, enviando a: ${chatId}`
      );

      // Extraer coordenadas de destino
      const [destLatitude, destLongitude] = coordinates.split(',').map(Number);

      // Validar coordenadas
      if (
        isNaN(destLatitude) ||
        isNaN(destLongitude) ||
        destLatitude < -90 ||
        destLatitude > 90 ||
        destLongitude < -180 ||
        destLongitude > 180
      ) {
        logger.error(`Coordenadas inválidas: ${coordinates}`);
        return res.status(400).json({ error: 'Coordenadas inválidas' });
      }

      // Obtener ubicaciones de unidades
      const reportData = {};
      const groupChats = storage.getAllGroupChats();
      const userLocations = storage.getAllUserLocations();

      logger.info(
        `Grupos disponibles: ${Object.keys(groupChats).length}, Ubicaciones: ${Object.keys(userLocations).length}`
      );

      // Verificar si hay datos
      if (
        Object.keys(groupChats).length === 0 ||
        Object.keys(userLocations).length === 0
      ) {
        logger.warn('No hay grupos o ubicaciones registradas');

        await bot.sendMessage(
          chatId,
          '❌ No hay unidades con ubicaciones registradas para calcular tiempos de llegada.',
          {
            parse_mode: 'Markdown'
          }
        );

        return res.json({
          success: false,
          message: 'No hay datos de ubicación disponibles'
        });
      }

      // Procesar cada grupo y sus unidades
      for (const [groupId, groupName] of Object.entries(groupChats)) {
        const users = userLocations[groupId];
        if (!users || Object.keys(users).length === 0) continue;

        if (!reportData[groupName]) reportData[groupName] = [];

        // Calcular ruta para cada unidad
        for (const [userId, loc] of Object.entries(users)) {
          try {
            // Evitar procesar usuarios duplicados
            const isAlreadyProcessed = Object.values(reportData).some(
              usersArray => usersArray.some(user => user.userId === userId)
            );

            if (isAlreadyProcessed) {
              logger.info(
                `Usuario ${userId} ya procesado, omitiendo duplicado`
              );
              continue;
            }

            logger.debug(
              `Calculando ruta para usuario ${userId} desde ${loc.latitude},${loc.longitude} hasta ${destLatitude},${destLongitude}`
            );

            const route = await hereService.calculateRoute(
              `${loc.latitude},${loc.longitude}`,
              `${destLatitude},${destLongitude}`
            );

            reportData[groupName].push({
              userName: storage.getUserName(userId),
              distanceKm: (route.length / 1000).toFixed(2),
              durationMin: Math.round(route.duration / 60),
              userId,
              groupId
            });

            logger.info(
              `Ruta calculada para usuario ${storage.getUserName(userId)}: ${route.length / 1000}km, ${Math.round(route.duration / 60)}min`
            );
          } catch (error) {
            logger.error(
              `Error calculando ruta para usuario ${userId}: ${error.message}`
            );
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

        await bot.sendMessage(
          chatId,
          '❌ No hay unidades con ubicaciones registradas para calcular tiempos de llegada.',
          {
            parse_mode: 'Markdown'
          }
        );

        return res.json({
          success: false,
          message: 'No hay datos válidos para generar reporte'
        });
      }

      // Generar y enviar reporte
      const reportMessage = reportService.formatTimingReport(reportData);
      await bot.sendMessage(chatId, reportMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });

      logger.info(`Reporte de timing enviado exitosamente a ${chatId}`);
      return res.json({ success: true });
    } catch (error) {
      logger.error('Error en API de timing:', {
        error: error.message,
        stack: error.stack
      });
      return res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = { startApiServer };
