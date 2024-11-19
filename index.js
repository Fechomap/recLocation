// ==========================================
// CONFIGURACIÓN E IMPORTACIONES
// ==========================================
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const winston = require('winston');
const express = require('express');
const bodyParser = require('body-parser');

// ==========================================
// CONFIGURACIÓN DE LOGGER
// ==========================================
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// ==========================================
// CONFIGURACIÓN DE VARIABLES Y CONSTANTES
// ==========================================
const token = process.env.TELEGRAM_BOT_TOKEN;
const hereApiKey = process.env.HERE_API_KEY;
const adminGroupId = process.env.ADMIN_GROUP_ID;

// Validación de variables de entorno
if (!token) {
  logger.error('TELEGRAM_BOT_TOKEN no está configurado en el archivo .env');
  process.exit(1);
}

if (!hereApiKey) {
  logger.error('HERE_API_KEY no está configurada en el archivo .env');
  process.exit(1);
}

if (!adminGroupId) {
  logger.error('ADMIN_GROUP_ID no está configurado en el archivo .env');
  process.exit(1);
}

if (!process.env.ADMIN_IDS) {
  logger.error('ADMIN_IDS no está configurado en el archivo .env');
  process.exit(1);
}

const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];
if (adminIds.length === 0) {
  logger.warn('La lista de IDs de administradores está vacía.');
}

const locationLastUpdate = {}; // { chatId: { userId: timestamp } }


if (process.env.NODE_ENV === 'production') {
  const port = process.env.PORT || 8443;
  const url = process.env.APP_URL.replace(/\/$/, '');
  
  const app = express();
  app.use(express.json());
  
  // Configuración del bot sin puerto (usará el servidor Express)
  bot = new TelegramBot(token, {
    webHook: {
      autoOpen: false
    }
  });

  // Ruta para el webhook
  app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });

  // Ruta de health check
  app.get('/', (req, res) => {
    res.status(200).send('Bot is running');
  });

  // Iniciar servidor Express primero
  app.listen(port, '0.0.0.0', () => {
    logger.info(`Express server is listening on port ${port}`);
    
    // Configurar el webhook después de que el servidor esté corriendo
    const webhookUrl = `${url}/bot${token}`;
    bot.setWebHook(webhookUrl).then(() => {
      logger.info(`Webhook set on ${webhookUrl}`);
    }).catch(error => {
      logger.error('Error setting webhook:', error);
    });
  });
} else {
  bot = new TelegramBot(token, { polling: true });
  logger.info('Bot en modo polling');
}




// Estados y almacenamiento
const groupChats = {};
const userLocations = {}; // { chatId: { userId: { latitude, longitude } } }
const userNames = {}; // { userId: userName }
let destLatitude = parseFloat(process.env.DEST_LATITUDE) || null;
let destLongitude = parseFloat(process.env.DEST_LONGITUDE) || null;


// ==========================================
// FUNCIONES UTILITARIAS
// ==========================================
function isAdmin(userId) {
  const isAdminUser = adminIds.includes(userId.toString());
  logger.debug(`Verificación de admin para usuario ${userId}: ${isAdminUser}`);
  return isAdminUser;
}

async function calculateRoute(origin, destination) {
  try {
    logger.info(`Calculando ruta desde ${origin} hasta ${destination}`);
    const response = await axios.get('https://router.hereapi.com/v8/routes', {
      params: {
        transportMode: 'car',
        origin: origin,
        destination: destination,
        return: 'summary',
        apiKey: hereApiKey
      }
    });
    return response.data.routes[0].sections[0].summary;
  } catch (error) {
    logger.error('Error calculando ruta:', {
      error: error.message,
      origin,
      destination
    });
    throw error;
  }
}

function formatTimingReport(reportData) {
  // Crear un array plano con todos los usuarios y su información de grupo
  let allUsers = [];
  const currentTime = Date.now();

  for (const [groupName, users] of Object.entries(reportData)) {
    users.forEach(user => {
      if (!user.error) {
        // Calcular tiempo desde última actualización
        const lastUpdate = locationLastUpdate[user.groupId]?.[user.userId] || 0;
        const timeSinceUpdate = Math.floor((currentTime - lastUpdate) / (60 * 1000)); // Convertir a minutos

        allUsers.push({
          ...user,
          groupName,
          timeSinceUpdate
        });
      }
    });
  }

  // Ordenar todos los usuarios por tiempo de llegada
  allUsers.sort((a, b) => a.durationMin - b.durationMin);

  // Crear el mensaje del reporte
  let reportMessage = `📍 *Reporte General de Timing*\n\n`;

  // Agregar usuarios ordenados
  allUsers.forEach((user, index) => {
    const safeUserName = escapeMarkdown(user.userName);
    const safeGroupName = escapeMarkdown(user.groupName);

    let userReport = `${index + 1}. 🚚 *${safeGroupName}* - ${safeUserName}:\n` +
                     `   - Dist: *${user.distanceKm}* km\n` +
                     `   - ETA: *${user.durationMin}* minutos\n`;

    // Agregar información de última actualización solo si han pasado más de 5 minutos
    if (user.timeSinceUpdate >= 5) {
      userReport += `   - ultima act: ${user.timeSinceUpdate} min\n`;
    }

    reportMessage += userReport + '\n';
  });

  // Agregar usuarios con error al final
  let errorUsers = [];
  for (const [groupName, users] of Object.entries(reportData)) {
    users.forEach(user => {
      if (user.error) {
        errorUsers.push({
          ...user,
          groupName
        });
      }
    });
  }

  if (errorUsers.length > 0) {
    reportMessage += `\n❌ *Usuarios con error*:\n`;
    errorUsers.forEach(user => {
      const safeUserName = escapeMarkdown(user.userName);
      const safeGroupName = escapeMarkdown(user.groupName);
      reportMessage += `- ${safeGroupName} - ${safeUserName}: ${user.error}\n`;
    });
  }

  return reportMessage;
}


function escapeMarkdown(text) {
  // Escapa caracteres especiales de Markdown
  return text.replace(/([*_`\[\]])/g, '\\$1');
}

// Función para obtener detalles de ubicación usando HERE Maps
async function getLocationDetails(latitude, longitude) {
  try {
    const response = await axios.get('https://revgeocode.search.hereapi.com/v1/revgeocode', {
      params: {
        at: `${latitude},${longitude}`,
        lang: 'es',
        apiKey: hereApiKey
      }
    });

    if (response.data.items && response.data.items.length > 0) {
      const location = response.data.items[0];
      const address = location.address;

      // Extraer colonia y municipio
      const district = address.district || address.subdistrict || 'N/A';  // Colonia
      const city = address.city || address.county || 'N/A';  // Municipio

      return {
        colonia: district.toUpperCase(),
        municipio: city.toUpperCase()
      };
    }
    
    return {
      colonia: 'NO DISPONIBLE',
      municipio: 'NO DISPONIBLE'
    };
  } catch (error) {
    logger.error('Error obteniendo detalles de ubicación:', {
      error: error.message,
      coordinates: `${latitude},${longitude}`
    });
    throw error;
  }
}

// Función para formatear el reporte de geolocalización
function formatGeoReport(reportData) {
  const currentTime = Date.now();
  let reportMessage = `📍 *Reporte General de Geo*\n\n`;
  let index = 1;

  for (const [groupName, users] of Object.entries(reportData)) {
    users.forEach(user => {
      const safeUserName = escapeMarkdown(user.userName);
      const safeGroupName = escapeMarkdown(groupName);
      
      let userReport = `${index}. 🚚 *${safeGroupName}* - ${safeUserName}:\n`;
      userReport += `   - Lugar: col. ${user.location.colonia}, Mun ${user.location.municipio}\n`;
      
      // Agregar tiempo desde última actualización si es mayor a 5 minutos
      if (user.timeSinceUpdate >= 5) {
        userReport += `   - ultima act: ${user.timeSinceUpdate} min\n`;
      }

      reportMessage += userReport + '\n';
      index++;
    });
  }

  return reportMessage;
}

// ==========================================
// MANEJADORES DE COMANDOS
// ==========================================
function handleSetDestination(msg, match) {
  const chatId = msg.chat.id;
  const fromId = msg.from.id;

  logger.info(`Intento de setear destino por usuario ${fromId}`);

  if (!isAdmin(fromId)) {
    logger.warn(`Usuario no autorizado ${fromId} intentó usar /setdestination`);
    bot.sendMessage(chatId, '❌ No tienes permiso para usar este comando.');
    return;
  }

  const text = match[1].replace(/\s+/g, ''); // Elimina todos los espacios
  const coordPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;

  if (!coordPattern.test(text)) {
    logger.warn(`Formato inválido de coordenadas: ${text}`);
    bot.sendMessage(chatId, '❌ Formato de coordenadas no reconocido. Por favor, ingresa las coordenadas en el formato "latitud,longitud"');
    return;
  }

  const [latStr, lonStr] = text.split(',');
  const newDestLatitude = parseFloat(latStr);
  const newDestLongitude = parseFloat(lonStr);

  if (isNaN(newDestLatitude) || isNaN(newDestLongitude)) {
    logger.error(`Error al parsear coordenadas: ${latStr}, ${lonStr}`);
    bot.sendMessage(chatId, '❌ Las coordenadas ingresadas no son válidas.');
    return;
  }

  // Validar rango de coordenadas
  if (newDestLatitude < -90 || newDestLatitude > 90 || newDestLongitude < -180 || newDestLongitude > 180) {
    logger.error(`Coordenadas fuera de rango: ${newDestLatitude}, ${newDestLongitude}`);
    bot.sendMessage(chatId, '❌ Las coordenadas ingresadas están fuera de los rangos válidos.');
    return;
  }

  destLatitude = newDestLatitude;
  destLongitude = newDestLongitude;

  const mapsUrl = `https://www.google.com/maps?q=${destLatitude},${destLongitude}`;
  const message = `✅ *Coordenadas de destino actualizadas*\n\n` +
                  `Coordenadas: \`${destLatitude},${destLongitude}\`\n` +
                  `Ver en Google Maps: ${mapsUrl}`;

  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    disable_web_page_preview: false
  });

  logger.info(`Destino actualizado a: ${destLatitude}, ${destLongitude}`);
}

async function handleTiming(msg) {
  const chatId = msg.chat.id;
  const fromId = msg.from.id;

  logger.info(`Comando timing solicitado por usuario ${fromId}`);

  if (!isAdmin(fromId)) {
    logger.warn(`Usuario no autorizado ${fromId} intentó usar /timing`);
    bot.sendMessage(chatId, '❌ No tienes permiso para usar este comando.');
    return;
  }

  try {
    if (isNaN(destLatitude) || isNaN(destLongitude)) {
      logger.error('Intento de timing sin coordenadas de destino configuradas');
      bot.sendMessage(chatId, '❌ Las coordenadas de destino no están configuradas correctamente.');
      return;
    }

    bot.sendMessage(chatId, '🔄 Calculando tiempos y distancias, ordenados por tiempo de llegada...');

    const reportData = {};
    for (const [groupId, groupName] of Object.entries(groupChats)) {
      const users = userLocations[groupId];
      if (!users || Object.keys(users).length === 0) continue;

      logger.info(`Procesando grupo ${groupName}`);
      reportData[groupName] = [];

      // Procesar cada usuario del grupo
      for (const [userId, loc] of Object.entries(users)) {
        try {
          const route = await calculateRoute(
            `${loc.latitude},${loc.longitude}`,
            `${destLatitude},${destLongitude}`
          );

          const distanceKm = (route.length / 1000).toFixed(2);
          const durationMin = Math.round(route.duration / 60);
          const userName = userNames[userId] || `Usuario ${userId}`;

          reportData[groupName].push({
            userName,
            distanceKm,
            durationMin,
            userId,
            groupId // Agregar el ID del grupo
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
            userName: userNames[userId] || `Usuario ${userId}`,
            error: 'Error al calcular la ruta.',
            userId,
            groupId // Agregar el ID del grupo
          });
        }
      }
    }

    if (Object.keys(reportData).length === 0) {
      logger.warn('No hay datos para generar el reporte');
      bot.sendMessage(chatId, '❌ No hay usuarios con ubicaciones registradas.');
      return;
    }

    const reportMessage = formatTimingReport(reportData);

    // Enviar al grupo de administradores
    await bot.sendMessage(adminGroupId, reportMessage, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });

    if (chatId.toString() !== adminGroupId.toString()) {
      bot.sendMessage(chatId, '✅ El reporte ordenado ha sido enviado al Grupo Administrador.');
    }

    logger.info('Reporte de timing ordenado generado y enviado exitosamente');
  } catch (error) {
    logger.error('Error general en comando timing:', { error: error.message });
    bot.sendMessage(chatId, '❌ Error al generar el reporte. Por favor, inténtalo más tarde.');
  }
}


function handleChangeOP(msg, match) {
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

  userNames[userId] = newName;
  logger.info(`Nombre de usuario actualizado`, { userId, newName });
  bot.sendMessage(chatId, `✅ Nombre asignado al usuario ${userId}: ${newName}`);
}

function handleLocation(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const { latitude, longitude } = msg.location;

  logger.info(`Nueva ubicación recibida`, {
    userId,
    chatId,
    latitude,
    longitude
  });

  // Actualizar ubicaciones
  if (!userLocations[chatId]) {
    userLocations[chatId] = {};
  }
  userLocations[chatId][userId] = { latitude, longitude };

  // Actualizar timestamp de última actualización
  if (!locationLastUpdate[chatId]) {
    locationLastUpdate[chatId] = {};
  }
  locationLastUpdate[chatId][userId] = Date.now();

  logger.debug(`Actualización de ubicación registrada`, {
    userId,
    chatId,
    timestamp: locationLastUpdate[chatId][userId]
  });
}

function handleHelp(msg) {
  const chatId = msg.chat.id;
  logger.info(`Comando help solicitado por usuario ${msg.from.id}`);

  const helpMessage = `
📌 *Comandos Disponibles* 📌

/loc - *Registrar tu ubicación en tiempo real*  
/timing - *Calcular distancia y tiempo hacia las coordenadas de destino actuales*  
/geo - *Obtener ubicación actual (colonia y municipio) de todas las unidades*
/setdestination - *Establecer nuevas coordenadas de destino* (solo administradores)
/getdestination - *Mostrar las coordenadas de destino actuales*  
/changeOP - *Asignar un nombre personalizado a un usuario* (solo administradores)
/help - *Mostrar esta ayuda*

*Cómo usar:*
1. Envía /loc y comparte tu ubicación.
2. Los administradores pueden enviar /setdestination seguido de las nuevas coordenadas en el formato "latitud,longitud" para actualizar el destino.
3. Los administradores pueden enviar /timing para generar el reporte de todos los usuarios.

*Ejemplo de /setdestination:*
/setdestination 19.356247,-98.984018

*Nota:* Los nombres de usuarios personalizados pueden ser asignados por los administradores mediante el comando /changeOP <user_id> <new_name>.
  `;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
}

async function handleGeo(msg) {
  const chatId = msg.chat.id;
  const fromId = msg.from.id;

  logger.info(`Comando geo solicitado por usuario ${fromId}`);

  if (!isAdmin(fromId)) {
    logger.warn(`Usuario no autorizado ${fromId} intentó usar /geo`);
    bot.sendMessage(chatId, '❌ No tienes permiso para usar este comando.');
    return;
  }

  try {
    bot.sendMessage(chatId, '🔄 Obteniendo información de ubicación de las unidades...');

    const reportData = {};
    const currentTime = Date.now();

    for (const [groupId, groupName] of Object.entries(groupChats)) {
      const users = userLocations[groupId];
      if (!users || Object.keys(users).length === 0) continue;

      logger.info(`Procesando grupo ${groupName}`);
      reportData[groupName] = [];

      // Procesar cada usuario del grupo
      for (const [userId, loc] of Object.entries(users)) {
        try {
          // Obtener detalles de ubicación
          const locationDetails = await getLocationDetails(loc.latitude, loc.longitude);
          
          // Calcular tiempo desde última actualización
          const lastUpdate = locationLastUpdate[groupId]?.[userId] || 0;
          const timeSinceUpdate = Math.floor((currentTime - lastUpdate) / (60 * 1000)); // Convertir a minutos

          reportData[groupName].push({
            userName: userNames[userId] || `Usuario ${userId}`,
            location: locationDetails,
            timeSinceUpdate
          });

          logger.info(`Información de ubicación obtenida para usuario ${userId}`, {
            location: locationDetails
          });

        } catch (error) {
          logger.error(`Error procesando ubicación para usuario ${userId}`, {
            error: error.message
          });
        }
      }
    }

    if (Object.keys(reportData).length === 0) {
      logger.warn('No hay datos para generar el reporte geo');
      bot.sendMessage(chatId, '❌ No hay usuarios con ubicaciones registradas.');
      return;
    }

    const reportMessage = formatGeoReport(reportData);

    // Enviar al grupo de administradores
    await bot.sendMessage(adminGroupId, reportMessage, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });

    if (chatId.toString() !== adminGroupId.toString()) {
      bot.sendMessage(chatId, '✅ El reporte de ubicaciones ha sido enviado al Grupo Administrador.');
    }

    logger.info('Reporte geo generado y enviado exitosamente');
  } catch (error) {
    logger.error('Error general en comando geo:', { error: error.message });
    bot.sendMessage(chatId, '❌ Error al generar el reporte de ubicaciones. Por favor, inténtalo más tarde.');
  }
}


// ==========================================
// CONFIGURACIÓN DE COMANDOS
// ==========================================

// Comando setdestination
bot.onText(/^\/setdestination\s+(.+)$/, handleSetDestination);

// Comando getdestination
bot.onText(/\/getdestination/, (msg) => {
  const chatId = msg.chat.id;
  logger.info(`Solicitud de destino actual por ${msg.from.id}`);

  if (destLatitude !== null && destLongitude !== null) {
    const mapsUrl = `https://www.google.com/maps?q=${destLatitude},${destLongitude}`;
    const message = `📍 *Ubicación de ORIGEN*\n\n` +
                    `Coordenadas: \`${destLatitude}, ${destLongitude}\`\n` +
                    `Ver en Google Maps: ${mapsUrl}`;

    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: false
    });

    logger.info('Enlace de destino enviado', { mapsUrl });
  } else {
    logger.warn('Se solicitó destino pero no hay coordenadas configuradas');
    bot.sendMessage(chatId, '❌ Las coordenadas de destino no están configuradas.');
  }
});


// Comando loc
bot.onText(/\/loc/, (msg) => {
  const chatId = msg.chat.id;
  logger.info(`Comando /loc recibido en chat ${chatId}`);

  if (msg.chat.type === 'private') {
    bot.sendMessage(chatId, '📍 Por favor, envía tu ubicación en tiempo real de manera ilimitada.');
  } else {
    if (!groupChats[chatId]) {
      groupChats[chatId] = msg.chat.title || `Grupo ${chatId}`;
      logger.info(`Nuevo grupo registrado: ${groupChats[chatId]}`);
    }
    bot.sendMessage(chatId, '📍 Por favor, envía tu ubicación en tiempo real directamente en el chat.');
  }
});

// Comando timing
bot.onText(/\/timing/, handleTiming);

// Comando changeOP
bot.onText(/\/changeOP (.+)/, handleChangeOP);

// Comando help
bot.onText(/\/help/, handleHelp);

// Comando geo
bot.onText(/\/geo/, handleGeo);

// ==========================================
// MANEJADORES DE EVENTOS
// ==========================================
bot.on('location', handleLocation);
bot.on('edited_message', (msg) => {
  if (msg.location) {
    handleLocation(msg);
  }
});

// ==========================================
// INICIALIZACIÓN
// ==========================================
logger.info('Bot iniciado correctamente');
console.log('🤖 Bot en funcionamiento...');
