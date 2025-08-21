// src/services/hereService.js
const axios = require('axios');
const config = require('../config');
const logger = require('../config/logger');

/**
 * Servicio para interactuar con la API de HERE Maps
 */
const hereService = {
  /**
   * Obtiene detalles de ubicación usando geocodificación inversa
   * @param {number} latitude - Coordenada de latitud
   * @param {number} longitude - Coordenada de longitud
   * @returns {Object} Detalles de ubicación con colonia y municipio
   */
  async getLocationDetails(latitude, longitude) {
    try {
      logger.info(
        `Obteniendo detalles de ubicación ${latitude},${longitude} (HERE Maps)`
      );
      logger.debug(
        `Using HERE API Key: ${config.HERE_API_KEY ? 'Present' : 'Missing'}`
      );

      const response = await axios.get(
        'https://revgeocode.search.hereapi.com/v1/revgeocode',
        {
          params: {
            at: `${latitude},${longitude}`,
            lang: 'es',
            apikey: config.HERE_API_KEY
          }
        }
      );

      if (response.data.items && response.data.items.length > 0) {
        const location = response.data.items[0];
        const address = location.address;

        // Extraer colonia y municipio usando la nueva estructura
        const district = address.district || address.subdistrict || 'N/A'; // Colonia
        const city = address.city || address.county || 'N/A'; // Municipio/Alcaldía

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
      logger.error('Error obteniendo detalles de ubicación con HERE Maps:', {
        error: error.message,
        coordinates: `${latitude},${longitude}`
      });
      throw error;
    }
  }
};

module.exports = hereService;
