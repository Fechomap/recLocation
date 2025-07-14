// src/commands/helpCmd.js
const logger = require('../config/logger');

/**
 * Comando de ayuda
 * @param {Object} bot - Instancia del bot
 * @returns {Function} Manejador de comando
 */
module.exports = bot => {
  return msg => {
    const chatId = msg.chat.id;
    logger.info(`Comando help solicitado por usuario ${msg.from.id}`);

    const helpMessage = `
📌 *Comandos Disponibles* 📌

/loc - *Registrar tu ubicación en tiempo real*  
/timing - *Calcular distancia y tiempo hacia coordenadas de destino* (se te pedirán las coordenadas)  
/geo - *Obtener ubicación actual (colonia y municipio) de todas las unidades*
/changeOP - *Asignar un nombre personalizado a un usuario* (solo administradores)
/help - *Mostrar esta ayuda*
/changeOPs - *Registrar múltiples operadores (formato: id1:nombre1, id2:nombre2)*

*Cómo usar:*
1. Envía /loc y comparte tu ubicación.
2. Los administradores pueden enviar /timing para calcular las distancias de las unidades a un destino específico.
   Cuando ejecutas /timing, el bot te pedirá que ingreses las coordenadas de destino.
3. Ingresa las coordenadas en el formato "latitud,longitud" (ejemplo: 19.356247,-98.984018).

*Nota:* Los nombres de usuarios personalizados pueden ser asignados por los administradores mediante el comando /changeOP <user_id> <new_name>.
    `;

    bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  };
};
