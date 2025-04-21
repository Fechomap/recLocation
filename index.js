// index.js - Punto de entrada principal
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { initializeBot } = require('./src/bot');
const registerCommands = require('./src/bot/commands');
const registerHandlers = require('./src/handlers');
const config = require('./src/config');
const logger = require('./src/config/logger');

/**
 * Inicia el bot y configura el servidor Express si es necesario
 */
async function startBot() {
  try {
    // Validar configuración
    config.validateConfig();
    
    logger.info('Iniciando Bot de Seguimiento de Ubicación');
    logger.info(`Entorno: ${config.IS_PRODUCTION ? 'Producción' : 'Desarrollo'}`);
    
    // Inicializar bot según el entorno
    const bot = await initializeBot();
    
    // Registrar todos los comandos
    registerCommands(bot);
    
    // Registrar todos los manejadores de eventos
    registerHandlers(bot);
    
    // Añadir prueba directa de comandos para diagnóstico
    logger.info('Configurando prueba de comandos directa');
    bot.onText(/\/test/, (msg) => {
      logger.info(`PRUEBA: Comando /test recibido de ${msg.from.id} en chat ${msg.chat.id}`);
      bot.sendMessage(msg.chat.id, '✅ La prueba de comando funcionó correctamente');
    });
    
    // Configurar servidor Express para webhook en producción
    if (config.IS_PRODUCTION) {
      const app = express();
      app.use(express.json());
      
      // Ruta para webhook
      const webhookPath = `/bot${config.TELEGRAM_BOT_TOKEN}`;
      app.post(webhookPath, (req, res) => {
        bot.processUpdate(req.body);
        res.sendStatus(200);
      });
      
      // Ruta de verificación de estado
      app.get('/', (req, res) => {
        res.status(200).send('Bot en funcionamiento');
      });
      
      // Iniciar servidor Express
      app.listen(config.PORT, '0.0.0.0', async () => {
        logger.info(`Servidor Express escuchando en puerto ${config.PORT}`);
        
        // Configurar el webhook después de que el servidor esté corriendo
        const webhookUrl = `${config.APP_URL}${webhookPath}`;
        await bot.setWebHook(webhookUrl);
        logger.info(`Webhook configurado en ${webhookUrl}`);
      });
    } else {
      logger.info('Bot ejecutándose en modo polling');
    }
    
    logger.info('Bot iniciado exitosamente');
    console.log('🤖 Bot en funcionamiento...');
  } catch (error) {
    logger.error('Error al iniciar el bot:', error);
    process.exit(1);
  }
}

// Iniciar el bot
startBot();