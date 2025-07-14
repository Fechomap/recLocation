// src/services/hereService.js
const axios = require('axios');
const config = require('../config');
const logger = require('../config/logger');

/**
 * Servicio para interactuar con la API de HERE Maps
 */
const hereService = {
  /**
   * Calcula ruta entre dos puntos
   * @param {string} origin - Coordenadas de origen en formato "latitud,longitud"
   * @param {string} destination - Coordenadas de destino en formato "latitud,longitud"
   * @returns {Object} Resumen de la ruta con distancia y duración
   */
  async calculateRoute(origin, destination) {
    try {
      logger.info(`Calculando ruta desde ${origin} hasta ${destination}`);
      const response = await axios.get('https://router.hereapi.com/v8/routes', {
        params: {
          transportMode: 'car',
          origin,
          destination,
          return: 'summary',
          apiKey: config.HERE_API_KEY
        }
      });

      if (!response.data.routes || response.data.routes.length === 0) {
        throw new Error('No se encontró ninguna ruta');
      }

      return response.data.routes[0].sections[0].summary;
    } catch (error) {
      logger.error('Error calculando ruta:', {
        error: error.message,
        origin,
        destination
      });
      throw error;
    }
  },

  /**
   * Obtiene detalles de ubicación usando geocodificación inversa
   * @param {number} latitude - Coordenada de latitud
   * @param {number} longitude - Coordenada de longitud
   * @returns {Object} Detalles de ubicación con colonia y municipio
   */
  async getLocationDetails(latitude, longitude) {
    try {
      const response = await axios.get(
        'https://revgeocode.search.hereapi.com/v1/revgeocode',
        {
          params: {
            at: `${latitude},${longitude}`,
            lang: 'es',
            apiKey: config.HERE_API_KEY
          }
        }
      );

      if (response.data.items && response.data.items.length > 0) {
        const location = response.data.items[0];
        const address = location.address;

        // Extraer colonia y municipio
        const district = address.district || address.subdistrict || 'N/A'; // Colonia
        const city = address.city || address.county || 'N/A'; // Municipio

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
};

module.exports = hereService;
