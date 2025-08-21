// src/services/mapboxRouteService.js
const axios = require('axios');
const config = require('../config');
const logger = require('../config/logger');

/**
 * Servicio para cálculo de rutas usando Mapbox
 */
const mapboxRouteService = {
  /**
   * Calcula ruta entre dos puntos
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
  }
};

module.exports = mapboxRouteService;
