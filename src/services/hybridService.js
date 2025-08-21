// src/services/hybridService.js
const axios = require('axios');
const config = require('../config');
const logger = require('../config/logger');

/**
 * Servicio híbrido que combina HERE Maps y Mapbox
 * - HERE Maps: Para geocoding (mejor precisión en colonias)
 * - Mapbox: Para rutas y ETA (mejor rendimiento)
 */
const hybridService = {
  /**
   * Calcula ruta entre dos puntos usando Mapbox
   * @param {string} origin - Coordenadas de origen en formato "latitud,longitud"
   * @param {string} destination - Coordenadas de destino en formato "latitud,longitud"
   * @returns {Object} Resumen de la ruta con distancia y duración
   */
  async calculateRoute(origin, destination) {
    try {
      logger.info(
        `Calculando ruta desde ${origin} hasta ${destination} (Mapbox)`
      );

      // Convertir formato de coordenadas para Mapbox (longitud,latitud)
      const [originLat, originLng] = origin.split(',');
      const [destLat, destLng] = destination.split(',');
      const originCoords = `${originLng},${originLat}`;
      const destCoords = `${destLng},${destLat}`;

      const response = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords};${destCoords}`,
        {
          params: {
            geometries: 'geojson',
            overview: 'simplified',
            access_token: config.MAPBOX_ACCESS_TOKEN
          }
        }
      );

      if (!response.data.routes || response.data.routes.length === 0) {
        throw new Error('No se encontró ninguna ruta');
      }

      const route = response.data.routes[0];
      return {
        duration: Math.round(route.duration),
        length: Math.round(route.distance)
      };
    } catch (error) {
      logger.error('Error calculando ruta con Mapbox:', {
        error: error.message,
        origin,
        destination
      });
      throw error;
    }
  },

  /**
   * Obtiene detalles de ubicación usando HERE Maps
   * @param {number} latitude - Coordenada de latitud
   * @param {number} longitude - Coordenada de longitud
   * @returns {Object} Detalles de ubicación con colonia y municipio
   */
  async getLocationDetails(latitude, longitude) {
    try {
      logger.info(
        `Obteniendo detalles de ubicación ${latitude},${longitude} (HERE Maps)`
      );

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

        // Extraer colonia y municipio usando la estructura de HERE Maps
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
      logger.error('Error obteniendo detalles de ubicación con HERE Maps:', {
        error: error.message,
        coordinates: `${latitude},${longitude}`
      });
      throw error;
    }
  }
};

module.exports = hybridService;
