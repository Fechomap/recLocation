// src/config/logger.js
const winston = require('winston');

/**
 * Sistema de logging centralizado
 * Usa Winston para niveles, formatos y destinos configurables
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
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

// En desarrollo, mostrar log más detallado
if (process.env.NODE_ENV !== 'production') {
  logger.level = 'debug';
}

module.exports = logger;