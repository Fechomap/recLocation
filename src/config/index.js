// src/config/index.js
/**
 * Configuración centralizada de la aplicación
 * Maneja variables de entorno y validaciones
 */
const config = {
    // Configuración del bot
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    HERE_API_KEY: process.env.HERE_API_KEY,
    ADMIN_GROUP_ID: process.env.ADMIN_GROUP_ID,
    ADMIN_IDS: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [],
    
    // Configuración de entorno
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    PORT: process.env.PORT || 8443,
    APP_URL: process.env.APP_URL?.replace(/\/$/, '') || '',
    
    /**
     * Valida la configuración requerida
     * Lanza error si faltan variables críticas
     */
    validateConfig: function() {
      const requiredVars = [
        'TELEGRAM_BOT_TOKEN',
        'HERE_API_KEY',
        'ADMIN_GROUP_ID',
        'ADMIN_IDS'
      ];
      
      const missingVars = requiredVars.filter(varName => !this[varName]);
      
      if (missingVars.length > 0) {
        throw new Error(`Variables de entorno requeridas faltantes: ${missingVars.join(', ')}`);
      }
      
      if (this.IS_PRODUCTION && !this.APP_URL) {
        throw new Error('APP_URL es requerida en modo producción');
      }
      
      if (this.ADMIN_IDS.length === 0) {
        console.warn('Advertencia: La lista ADMIN_IDS está vacía');
      }
      
      return true;
    }
  };
  
  module.exports = config;