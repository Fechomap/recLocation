// src/services/mapboxService.js
const axios = require('axios');
const config = require('../config');
const logger = require('../config/logger');

/**
 * Servicio para interactuar con la API de Mapbox
 */
const mapboxService = {
  /**
   * Calcula ruta entre dos puntos
   * @param {string} origin - Coordenadas de origen en formato "latitud,longitud"
   * @param {string} destination - Coordenadas de destino en formato "latitud,longitud"
   * @returns {Object} Resumen de la ruta con distancia y duración
   */
  async calculateRoute(origin, destination) {
    try {
      logger.info(`Calculando ruta desde ${origin} hasta ${destination}`);

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
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`,
        {
          params: {
            types: 'address,neighborhood,locality,place,district',
            country: 'mx',
            language: 'es',
            access_token: config.MAPBOX_ACCESS_TOKEN
          }
        }
      );

      if (response.data.features && response.data.features.length > 0) {
        const features = response.data.features;

        // Debug: mostrar los tipos de lugar que devuelve Mapbox
        logger.debug('Respuesta completa de Mapbox Geocoding:', {
          coordinates: `${latitude},${longitude}`,
          features: features.map(f => ({
            text: f.text,
            place_type: f.place_type,
            place_name: f.place_name,
            context: f.context
          }))
        });

        // Buscar colonia y alcaldía usando la jerarquía correcta
        let colonia = 'N/A';
        let alcaldia = 'N/A';

        // Buscar en features directos
        for (const feature of features) {
          // Primero buscar neighborhood (colonia real)
          if (
            feature.place_type.includes('neighborhood') &&
            colonia === 'N/A'
          ) {
            colonia = feature.text;
          }
          // La alcaldía está en locality
          if (feature.place_type.includes('locality') && alcaldia === 'N/A') {
            alcaldia = feature.text;
          }
        }

        // Si no encontramos en features directos, buscar en context del primer feature
        if (features.length > 0 && features[0].context) {
          for (const contextItem of features[0].context) {
            // Buscar colonia real en neighborhood del context
            if (
              contextItem.id.startsWith('neighborhood.') &&
              colonia === 'N/A'
            ) {
              colonia = contextItem.text;
            }
            // Buscar alcaldía en locality del context
            if (contextItem.id.startsWith('locality.') && alcaldia === 'N/A') {
              alcaldia = contextItem.text;
            }
          }
        }

        // Fallback: si no hay colonia, usar la calle (address)
        if (colonia === 'N/A') {
          for (const feature of features) {
            if (feature.place_type.includes('address')) {
              colonia = feature.text;
              break;
            }
          }
        }

        return {
          colonia: colonia.toUpperCase(),
          municipio: alcaldia.toUpperCase()
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

module.exports = mapboxService;
