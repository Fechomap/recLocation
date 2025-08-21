// tests/services.test.js
const axios = require('axios');
const mapboxService = require('../src/services/mapboxService');
const reportService = require('../src/services/reportService');
const storage = require('../src/storage');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock storage
jest.mock('../src/storage');
const mockedStorage = storage;

describe('Mapbox Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateRoute', () => {
    test('should calculate route successfully', async() => {
      const mockResponse = {
        data: {
          routes: [
            {
              sections: [
                {
                  summary: {
                    length: 15000,
                    duration: 1800
                  }
                }
              ]
            }
          ]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await mapboxService.calculateRoute(
        '19.4326,-99.1332',
        '19.4284,-99.1276'
      );

      expect(result).toEqual({
        length: 15000,
        duration: 1800
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.mapbox.com/directions/v5/mapbox/driving/-99.1332,19.4326;-99.1276,19.4284',
        {
          params: {
            geometries: 'geojson',
            overview: 'simplified',
            access_token: expect.any(String)
          }
        }
      );
    });

    test('should throw error when no routes found', async() => {
      const mockResponse = {
        data: {
          routes: []
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await expect(
        mapboxService.calculateRoute('19.4326,-99.1332', '19.4284,-99.1276')
      ).rejects.toThrow('No se encontró ninguna ruta');
    });

    test('should handle API errors', async() => {
      const mockError = new Error('API Error');
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(
        mapboxService.calculateRoute('19.4326,-99.1332', '19.4284,-99.1276')
      ).rejects.toThrow('API Error');
    });
  });

  describe('getLocationDetails', () => {
    test('should get location details successfully', async() => {
      const mockResponse = {
        data: {
          items: [
            {
              address: {
                district: 'Roma Norte',
                city: 'Cuauhtémoc'
              }
            }
          ]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await mapboxService.getLocationDetails(19.4326, -99.1332);

      expect(result).toEqual({
        colonia: 'ROMA NORTE',
        municipio: 'CUAUHTÉMOC'
      });
    });

    test('should handle missing location data', async() => {
      const mockResponse = {
        data: {
          items: []
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await mapboxService.getLocationDetails(19.4326, -99.1332);

      expect(result).toEqual({
        colonia: 'NO DISPONIBLE',
        municipio: 'NO DISPONIBLE'
      });
    });

    test('should handle alternative address fields', async() => {
      const mockResponse = {
        data: {
          items: [
            {
              address: {
                subdistrict: 'Centro',
                county: 'Miguel Hidalgo'
              }
            }
          ]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await mapboxService.getLocationDetails(19.4326, -99.1332);

      expect(result).toEqual({
        colonia: 'CENTRO',
        municipio: 'MIGUEL HIDALGO'
      });
    });

    test('should handle geocoding API errors', async() => {
      const mockError = new Error('Geocoding API Error');
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(
        mapboxService.getLocationDetails(19.4326, -99.1332)
      ).rejects.toThrow('Geocoding API Error');
    });
  });
});

describe('Report Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset storage mock
    mockedStorage.getLocationLastUpdate.mockReturnValue(Date.now() - 300000); // 5 min ago
  });

  describe('formatTimingReport', () => {
    test('should format timing report correctly', () => {
      const reportData = {
        'Grupo A': [
          {
            userName: 'Juan Pérez',
            distanceKm: '15.5',
            durationMin: 25,
            userId: '123',
            groupId: 'group1'
          },
          {
            userName: 'María García',
            distanceKm: '8.2',
            durationMin: 12,
            userId: '456',
            groupId: 'group1'
          }
        ],
        'Grupo B': [
          {
            userName: 'Carlos López',
            distanceKm: '20.1',
            durationMin: 30,
            userId: '789',
            groupId: 'group2'
          }
        ]
      };

      const result = reportService.formatTimingReport(reportData);

      expect(result).toContain('📍 *Reporte General de Timing*');
      expect(result).toContain('1. 🚚 *Grupo A* - María García:');
      expect(result).toContain('2. 🚚 *Grupo A* - Juan Pérez:');
      expect(result).toContain('3. 🚚 *Grupo B* - Carlos López:');
      expect(result).toContain('Dist: *8.2* km');
      expect(result).toContain('ETA: *12* minutos');
    });

    test('should handle users with errors', () => {
      const reportData = {
        'Grupo A': [
          {
            userName: 'Juan Pérez',
            error: 'Error al calcular la ruta',
            userId: '123',
            groupId: 'group1'
          }
        ]
      };

      const result = reportService.formatTimingReport(reportData);

      expect(result).toContain('❌ *Usuarios con error*:');
      expect(result).toContain(
        '- Grupo A - Juan Pérez: Error al calcular la ruta'
      );
    });

    test('should show last update time when > 5 minutes', () => {
      // Mock storage to return old timestamp
      mockedStorage.getLocationLastUpdate.mockReturnValue(Date.now() - 600000); // 10 min ago

      const reportData = {
        'Grupo A': [
          {
            userName: 'Juan Pérez',
            distanceKm: '15.5',
            durationMin: 25,
            userId: '123',
            groupId: 'group1'
          }
        ]
      };

      const result = reportService.formatTimingReport(reportData);

      expect(result).toContain('ultima act: 10 min');
    });
  });

  describe('formatGeoReport', () => {
    test('should format geo report correctly', () => {
      const reportData = {
        'Grupo A': [
          {
            userName: 'Juan Pérez',
            location: {
              colonia: 'ROMA NORTE',
              municipio: 'CUAUHTÉMOC'
            },
            timeSinceUpdate: 3
          }
        ],
        'Grupo B': [
          {
            userName: 'María García',
            location: {
              colonia: 'CONDESA',
              municipio: 'CUAUHTÉMOC'
            },
            timeSinceUpdate: 8
          }
        ]
      };

      const result = reportService.formatGeoReport(reportData);

      expect(result).toContain('📍 *Reporte General de Geo*');
      expect(result).toContain('1. 🚚 *Grupo A* - Juan Pérez:');
      expect(result).toContain('Lugar: col. ROMA NORTE, Mun CUAUHTÉMOC');
      expect(result).toContain('2. 🚚 *Grupo B* - María García:');
      expect(result).toContain('ultima act: 8 min');
    });
  });

  describe('escapeMarkdown', () => {
    test('should escape markdown characters', () => {
      const input = 'Text with *bold* and _italic_ and [link]';
      const result = reportService.escapeMarkdown(input);

      expect(result).toBe(
        'Text with \\*bold\\* and \\_italic\\_ and \\[link\\]'
      );
    });

    test('should handle empty or null text', () => {
      expect(reportService.escapeMarkdown('')).toBe('');
      expect(reportService.escapeMarkdown(null)).toBe('');
      expect(reportService.escapeMarkdown(undefined)).toBe('');
    });

    test('should handle text without special characters', () => {
      const input = 'Simple text without special chars';
      const result = reportService.escapeMarkdown(input);

      expect(result).toBe(input);
    });
  });
});
