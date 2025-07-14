// tests/handlers.test.js
const locationHandler = require('../src/handlers/locationHandler');
const storage = require('../src/storage');

// Mock storage
jest.mock('../src/storage');
const mockedStorage = storage;

describe('Location Handler', () => {
  let mockBot;
  let handler;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock bot
    mockBot = {
      sendMessage: jest.fn(),
      sendLocation: jest.fn()
    };

    // Create handler instance
    handler = locationHandler(mockBot);

    // Setup storage mocks
    mockedStorage.getUserName.mockReturnValue('Usuario Test');
    mockedStorage.getGroupChat.mockReturnValue(null);
    mockedStorage.setGroupChat.mockReturnValue(mockedStorage);
    mockedStorage.setUserLocation.mockReturnValue(mockedStorage);
  });

  describe('Private Chat Location Handling', () => {
    test('should handle private chat location correctly', () => {
      const mockMessage = {
        chat: {
          id: 123456789,
          type: 'private'
        },
        from: {
          id: 123456789
        },
        location: {
          latitude: 19.4326,
          longitude: -99.1332
        }
      };

      handler(mockMessage);

      // Verify storage calls for private chat
      expect(mockedStorage.getUserName).toHaveBeenCalledWith(123456789);
      expect(mockedStorage.setGroupChat).toHaveBeenCalledWith(
        123456789,
        'Personal - Usuario Test'
      );
      expect(mockedStorage.setUserLocation).toHaveBeenCalledWith(
        123456789,
        123456789,
        { latitude: 19.4326, longitude: -99.1332 }
      );
    });

    test('should use user-specific name for private chat group', () => {
      mockedStorage.getUserName.mockReturnValue('Juan Pérez');

      const mockMessage = {
        chat: {
          id: 987654321,
          type: 'private'
        },
        from: {
          id: 987654321
        },
        location: {
          latitude: 19.4284,
          longitude: -99.1276
        }
      };

      handler(mockMessage);

      expect(mockedStorage.setGroupChat).toHaveBeenCalledWith(
        987654321,
        'Personal - Juan Pérez'
      );
    });
  });

  describe('Group Chat Location Handling', () => {
    test('should handle existing group chat location', () => {
      // Mock existing group
      mockedStorage.getGroupChat.mockReturnValue('Grupo Existente');

      const mockMessage = {
        chat: {
          id: -100123456789,
          type: 'group',
          title: 'Test Group'
        },
        from: {
          id: 123456789
        },
        location: {
          latitude: 19.4326,
          longitude: -99.1332
        }
      };

      handler(mockMessage);

      // Should not call setGroupChat for existing group
      expect(mockedStorage.setGroupChat).not.toHaveBeenCalled();
      expect(mockedStorage.setUserLocation).toHaveBeenCalledWith(
        -100123456789,
        123456789,
        { latitude: 19.4326, longitude: -99.1332 }
      );
    });

    test('should register new group chat automatically', () => {
      // Mock non-existing group
      mockedStorage.getGroupChat.mockReturnValue(null);

      const mockMessage = {
        chat: {
          id: -100987654321,
          type: 'group',
          title: 'New Test Group'
        },
        from: {
          id: 123456789
        },
        location: {
          latitude: 19.4326,
          longitude: -99.1332
        }
      };

      handler(mockMessage);

      // Should register new group
      expect(mockedStorage.setGroupChat).toHaveBeenCalledWith(
        -100987654321,
        'New Test Group'
      );
      expect(mockedStorage.setUserLocation).toHaveBeenCalledWith(
        -100987654321,
        123456789,
        { latitude: 19.4326, longitude: -99.1332 }
      );
    });

    test('should handle group without title', () => {
      mockedStorage.getGroupChat.mockReturnValue(null);

      const mockMessage = {
        chat: {
          id: -100555555555,
          type: 'group'
          // No title provided
        },
        from: {
          id: 123456789
        },
        location: {
          latitude: 19.4326,
          longitude: -99.1332
        }
      };

      handler(mockMessage);

      // Should use default group name
      expect(mockedStorage.setGroupChat).toHaveBeenCalledWith(
        -100555555555,
        'Grupo -100555555555'
      );
    });

    test('should handle supergroup chat type', () => {
      mockedStorage.getGroupChat.mockReturnValue('Supergroup Test');

      const mockMessage = {
        chat: {
          id: -1001234567890,
          type: 'supergroup',
          title: 'Test Supergroup'
        },
        from: {
          id: 123456789
        },
        location: {
          latitude: 19.4326,
          longitude: -99.1332
        }
      };

      handler(mockMessage);

      // Should handle supergroup like regular group
      expect(mockedStorage.setUserLocation).toHaveBeenCalledWith(
        -1001234567890,
        123456789,
        { latitude: 19.4326, longitude: -99.1332 }
      );
    });
  });

  describe('Location Data Handling', () => {
    test('should handle integer coordinates', () => {
      const mockMessage = {
        chat: {
          id: 123456789,
          type: 'private'
        },
        from: {
          id: 123456789
        },
        location: {
          latitude: 19,
          longitude: -99
        }
      };

      handler(mockMessage);

      expect(mockedStorage.setUserLocation).toHaveBeenCalledWith(
        123456789,
        123456789,
        { latitude: 19, longitude: -99 }
      );
    });

    test('should handle high precision coordinates', () => {
      const mockMessage = {
        chat: {
          id: 123456789,
          type: 'private'
        },
        from: {
          id: 123456789
        },
        location: {
          latitude: 19.432608123456789,
          longitude: -99.133247987654321
        }
      };

      handler(mockMessage);

      expect(mockedStorage.setUserLocation).toHaveBeenCalledWith(
        123456789,
        123456789,
        { 
          latitude: 19.432608123456789, 
          longitude: -99.133247987654321 
        }
      );
    });

    test('should handle negative coordinates', () => {
      const mockMessage = {
        chat: {
          id: 123456789,
          type: 'private'
        },
        from: {
          id: 123456789
        },
        location: {
          latitude: -34.6037,
          longitude: -58.3816
        }
      };

      handler(mockMessage);

      expect(mockedStorage.setUserLocation).toHaveBeenCalledWith(
        123456789,
        123456789,
        { latitude: -34.6037, longitude: -58.3816 }
      );
    });
  });

  describe('Multiple Users in Group', () => {
    test('should handle multiple users sending locations to same group', () => {
      mockedStorage.getGroupChat.mockReturnValue('Test Group');

      const chatId = -100123456789;
      const users = [
        { id: 111111111, lat: 19.4326, lng: -99.1332 },
        { id: 222222222, lat: 19.4284, lng: -99.1276 },
        { id: 333333333, lat: 19.4200, lng: -99.1300 }
      ];

      users.forEach(user => {
        const mockMessage = {
          chat: {
            id: chatId,
            type: 'group',
            title: 'Test Group'
          },
          from: {
            id: user.id
          },
          location: {
            latitude: user.lat,
            longitude: user.lng
          }
        };

        handler(mockMessage);
      });

      // Should call setUserLocation for each user
      expect(mockedStorage.setUserLocation).toHaveBeenCalledTimes(3);
      users.forEach(user => {
        expect(mockedStorage.setUserLocation).toHaveBeenCalledWith(
          chatId,
          user.id,
          { latitude: user.lat, longitude: user.lng }
        );
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle channel type (though unlikely)', () => {
      mockedStorage.getGroupChat.mockReturnValue(null);

      const mockMessage = {
        chat: {
          id: -1001234567890,
          type: 'channel',
          title: 'Test Channel'
        },
        from: {
          id: 123456789
        },
        location: {
          latitude: 19.4326,
          longitude: -99.1332
        }
      };

      handler(mockMessage);

      // Should treat as group (not private)
      expect(mockedStorage.setGroupChat).toHaveBeenCalledWith(
        -1001234567890,
        'Test Channel'
      );
    });

    test('should handle user updating location multiple times', () => {
      const mockMessage = {
        chat: {
          id: 123456789,
          type: 'private'
        },
        from: {
          id: 123456789
        },
        location: {
          latitude: 19.4326,
          longitude: -99.1332
        }
      };

      // First location update
      handler(mockMessage);

      // Second location update
      mockMessage.location = { latitude: 19.4284, longitude: -99.1276 };
      handler(mockMessage);

      // Should be called twice
      expect(mockedStorage.setUserLocation).toHaveBeenCalledTimes(2);
      expect(mockedStorage.setUserLocation).toHaveBeenLastCalledWith(
        123456789,
        123456789,
        { latitude: 19.4284, longitude: -99.1276 }
      );
    });

    test('should handle zero coordinates', () => {
      const mockMessage = {
        chat: {
          id: 123456789,
          type: 'private'
        },
        from: {
          id: 123456789
        },
        location: {
          latitude: 0,
          longitude: 0
        }
      };

      handler(mockMessage);

      expect(mockedStorage.setUserLocation).toHaveBeenCalledWith(
        123456789,
        123456789,
        { latitude: 0, longitude: 0 }
      );
    });
  });

  describe('Handler Function Creation', () => {
    test('should return a function when called with bot', () => {
      const handler = locationHandler(mockBot);
      expect(typeof handler).toBe('function');
    });

    test('should create independent handlers for different bots', () => {
      const mockBot1 = { sendMessage: jest.fn() };
      const mockBot2 = { sendMessage: jest.fn() };

      const handler1 = locationHandler(mockBot1);
      const handler2 = locationHandler(mockBot2);

      expect(handler1).not.toBe(handler2);
      expect(typeof handler1).toBe('function');
      expect(typeof handler2).toBe('function');
    });
  });
});