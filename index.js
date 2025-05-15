// index.js - Punto de entrada principal
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { initializeBot } = require('./src/bot');
const registerCommands = require('./src/bot/commands');
const registerHandlers = require('./src/handlers');
const config = require('./src/config');
const logger = require('./src/config/logger');

// Importar API
const { startApiServer } = require('./src/api');

/**
 * Inicia el bot y configura el servidor Express si es necesario
 */
async function startBot() {
  try {
    // Validar configuración
    config.validateConfig();
    
    logger.info('Iniciando Bot de Seguimiento de Ubicación');
    logger.info(`Entorno: ${config.IS_PRODUCTION ? 'Producción' : 'Desarrollo'}`);
    
    // Para debugging en producción
    if (config.IS_PRODUCTION) {
      logger.info(`APP_URL configurada: ${config.APP_URL}`);
      logger.info(`RAILWAY_STATIC_URL: ${process.env.RAILWAY_STATIC_URL}`);
    }
    
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
    
    // Configurar servidor Express
    const app = express();
    app.use(express.json());
    
    // Ruta de health check básica (para monitoreo y diagnóstico)
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', time: new Date().toISOString() });
    });
    
    // IMPORTANTE: Montar el router de API correctamente en la aplicación
    const apiRouter = startApiServer(bot);
    app.use(apiRouter);  // Esto es lo que se corrigió - ahora el router se monta correctamente
    
    // En producción, configurar webhook para Telegram
    if (config.IS_PRODUCTION) {
      // Ruta para webhook de Telegram
      const webhookPath = `/bot${config.TELEGRAM_BOT_TOKEN}`;
      app.post(webhookPath, (req, res) => {
        bot.processUpdate(req.body);
        res.sendStatus(200);
      });
      
      // Ruta raíz para verificación de estado
      app.get('/', (req, res) => {
        res.status(200).send('Bot en funcionamiento');
      });
    }
    
    // Iniciar servidor Express
    const PORT = config.PORT || 3000;
    app.listen(PORT, '0.0.0.0', async () => {
      logger.info(`Servidor Express escuchando en puerto ${PORT}`);
      
      // En producción, configurar el webhook para Telegram
      if (config.IS_PRODUCTION) {
        const webhookUrl = `${config.APP_URL}/bot${config.TELEGRAM_BOT_TOKEN}`;
        try {
          await bot.setWebHook(webhookUrl);
          logger.info(`Webhook configurado en ${webhookUrl}`);
        } catch (error) {
          logger.error('Error al configurar webhook:', error);
        }
      } else {
        logger.info('Bot ejecutándose en modo polling');
      }
    });
    
    logger.info('Bot iniciado exitosamente');
    console.log('🤖 Bot en funcionamiento...');
  } catch (error) {
    logger.error('Error al iniciar el bot:', error);
    process.exit(1);
  }
}

// Iniciar el bot
startBot();