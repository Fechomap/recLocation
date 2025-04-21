// src/bot/commands.js
const locationCmd = require('../commands/locationCmd');
const helpCmd = require('../commands/helpCmd');
const adminCmd = require('../commands/adminCmd');
const timingCmd = require('../commands/timingCmd');
const geoCmd = require('../commands/geoCmd');
const diagnosticTool = require('../utils/diagnosticTool');
const logger = require('../config/logger');

/**
 * Registra todos los comandos del bot
 * @param {Object} bot - Instancia del bot
 */
function registerCommands(bot) {
  logger.info('Registrando comandos del bot');

  // Comando loc con manejo de errores
  bot.onText(/\/loc/, (msg) => {
    try {
      logger.debug(`Comando /loc recibido de usuario ${msg.from.id}`);
      locationCmd(bot)(msg);
    } catch (error) {
      logger.error(`Error al procesar comando /loc: ${error.message}`);
    }
  });
  
  // Comando help con manejo de errores
  bot.onText(/\/help/, (msg) => {
    try {
      logger.debug(`Comando /help recibido de usuario ${msg.from.id}`);
      helpCmd(bot)(msg);
    } catch (error) {
      logger.error(`Error al procesar comando /help: ${error.message}`);
    }
  });
  
  // Comandos administrativos con manejo de errores
  bot.onText(/\/changeOP (.+)/, (msg, match) => {
    try {
      logger.debug(`Comando /changeOP recibido de usuario ${msg.from.id}`);
      adminCmd.handleChangeOP(bot)(msg, match);
    } catch (error) {
      logger.error(`Error al procesar comando /changeOP: ${error.message}`);
    }
  });
  
  bot.onText(/\/changeOPs (.+)/, (msg, match) => {
    try {
      logger.debug(`Comando /changeOPs recibido de usuario ${msg.from.id}`);
      adminCmd.handleChangeOPs(bot)(msg, match);
    } catch (error) {
      logger.error(`Error al procesar comando /changeOPs: ${error.message}`);
    }
  });
  
  // Comando getdestination
  bot.onText(/\/getdestination/, (msg) => {
    const chatId = msg.chat.id;
    logger.info(`Solicitud de información sobre destino por ${msg.from.id}`);
    
    const message = `ℹ️ *Información sobre el destino*\n\n` +
                    `En la nueva versión del bot, las coordenadas de destino se solicitan cada vez que ejecutas el comando /timing.\n\n` +
                    `No se almacenan coordenadas fijas. Para calcular distancias y tiempos, simplemente usa el comando /timing y sigue las instrucciones.`;

    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });
  });

  // Registrar comando timing con manejo de errores
  bot.onText(/\/timing/, (msg) => {
    try {
      logger.debug(`Comando /timing recibido de usuario ${msg.from.id}`);
      timingCmd(bot)(msg);
    } catch (error) {
      logger.error(`Error al procesar comando /timing: ${error.message}`);
    }
  });
  
  // Registrar comando geo con manejo de errores
  bot.onText(/\/geo/, (msg) => {
    try {
      logger.debug(`Comando /geo recibido de usuario ${msg.from.id}`);
      geoCmd(bot)(msg);
    } catch (error) {
      logger.error(`Error al procesar comando /geo: ${error.message}`);
    }
  });

  // Registrar comando de diagnóstico
  bot.onText(/\/diagnostico/, (msg) => {
    try {
      logger.debug(`Comando /diagnostico recibido de usuario ${msg.from.id}`);
      diagnosticTool(bot)(msg);
    } catch (error) {
      logger.error(`Error al procesar comando /diagnostico: ${error.message}`);
    }
  });

  logger.info('Comandos registrados exitosamente');
}

module.exports = registerCommands;