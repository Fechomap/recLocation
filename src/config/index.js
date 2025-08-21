// src/config/index.js
/**
 * Configuración centralizada de la aplicación
 * Maneja variables de entorno y validaciones
 */
const config = {
  // Configuración del bot
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
  HERE_API_KEY: process.env.HERE_API_KEY,
  ADMIN_GROUP_ID: process.env.ADMIN_GROUP_ID,
  ADMIN_IDS: process.env.ADMIN_IDS
    ? process.env.ADMIN_IDS.split(',').map(id => id.trim())
    : [],

  // Configuración de entorno
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  PORT: process.env.PORT || process.env.RAILWAY_PORT || 8443,

  // URL de la aplicación - utiliza RAILWAY_STATIC_URL si está disponible
  APP_URL:
    process.env.APP_URL ||
    (process.env.RAILWAY_STATIC_URL
      ? `https://${process.env.RAILWAY_STATIC_URL}`
      : ''),

  /**
   * Valida la configuración requerida
   * Lanza error si faltan variables críticas
   */
  validateConfig() {
    const requiredVars = [
      'TELEGRAM_BOT_TOKEN',
      'MAPBOX_ACCESS_TOKEN',
      'HERE_API_KEY',
      'ADMIN_GROUP_ID',
      'ADMIN_IDS'
    ];

    const missingVars = requiredVars.filter(varName => !this[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Variables de entorno requeridas faltantes: ${missingVars.join(', ')}`
      );
    }

    // En producción, verificar que tengamos una URL para el webhook
    if (this.IS_PRODUCTION && !this.APP_URL) {
      throw new Error(
        'No se pudo determinar una URL pública para el webhook. Asegúrate de que Railway esté configurado correctamente o define APP_URL manualmente.'
      );
    }

    if (this.ADMIN_IDS.length === 0) {
      console.warn('Advertencia: La lista ADMIN_IDS está vacía');
    }

    return true;
  }
};

module.exports = config;
