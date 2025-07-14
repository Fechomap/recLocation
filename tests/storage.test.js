// tests/storage.test.js
const Storage = require('../src/storage/index');

describe('Storage Service', () => {
  let storage;

  beforeEach(() => {
    // Reset storage before each test
    storage = require('../src/storage/index');
    storage.reset();
  });

  describe('Group Chat Management', () => {
    test('should set and get group chat', () => {
      const chatId = '-100123456789';
      const groupName = 'Test Group';

      storage.setGroupChat(chatId, groupName);
      const result = storage.getGroupChat(chatId);

      expect(result).toBe(groupName);
    });

    test('should return undefined for non-existent group chat', () => {
      const result = storage.getGroupChat('-100999999999');
      expect(result).toBeUndefined();
    });

    test('should get all group chats', () => {
      storage.setGroupChat('-100111111111', 'Group 1');
      storage.setGroupChat('-100222222222', 'Group 2');

      const allGroups = storage.getAllGroupChats();

      expect(allGroups).toEqual({
        '-100111111111': 'Group 1',
        '-100222222222': 'Group 2'
      });
    });

    test('should allow method chaining for setGroupChat', () => {
      const result = storage.setGroupChat('-100123456789', 'Test Group');
      expect(result).toBe(storage);
    });
  });

  describe('User Location Management', () => {
    test('should set and get user location', () => {
      const chatId = '-100123456789';
      const userId = '123456789';
      const location = { latitude: 19.4326, longitude: -99.1332 };

      storage.setUserLocation(chatId, userId, location);
      const result = storage.getUserLocation(chatId, userId);

      expect(result).toEqual(location);
    });

    test('should return undefined for non-existent user location', () => {
      const result = storage.getUserLocation('-100999999999', '999999999');
      expect(result).toBeUndefined();
    });

    test('should handle multiple users in same chat', () => {
      const chatId = '-100123456789';
      const user1 = '123456789';
      const user2 = '987654321';
      const location1 = { latitude: 19.4326, longitude: -99.1332 };
      const location2 = { latitude: 19.4284, longitude: -99.1276 };

      storage.setUserLocation(chatId, user1, location1);
      storage.setUserLocation(chatId, user2, location2);

      expect(storage.getUserLocation(chatId, user1)).toEqual(location1);
      expect(storage.getUserLocation(chatId, user2)).toEqual(location2);
    });

    test('should handle multiple chats', () => {
      const chat1 = '-100111111111';
      const chat2 = '-100222222222';
      const userId = '123456789';
      const location1 = { latitude: 19.4326, longitude: -99.1332 };
      const location2 = { latitude: 19.4284, longitude: -99.1276 };

      storage.setUserLocation(chat1, userId, location1);
      storage.setUserLocation(chat2, userId, location2);

      expect(storage.getUserLocation(chat1, userId)).toEqual(location1);
      expect(storage.getUserLocation(chat2, userId)).toEqual(location2);
    });

    test('should get all user locations', () => {
      const chatId = '-100123456789';
      const location1 = { latitude: 19.4326, longitude: -99.1332 };
      const location2 = { latitude: 19.4284, longitude: -99.1276 };

      storage.setUserLocation(chatId, '123456789', location1);
      storage.setUserLocation(chatId, '987654321', location2);

      const allLocations = storage.getAllUserLocations();

      expect(allLocations).toEqual({
        [chatId]: {
          '123456789': location1,
          '987654321': location2
        }
      });
    });

    test('should update existing user location', () => {
      const chatId = '-100123456789';
      const userId = '123456789';
      const initialLocation = { latitude: 19.4326, longitude: -99.1332 };
      const updatedLocation = { latitude: 19.4284, longitude: -99.1276 };

      storage.setUserLocation(chatId, userId, initialLocation);
      storage.setUserLocation(chatId, userId, updatedLocation);

      const result = storage.getUserLocation(chatId, userId);
      expect(result).toEqual(updatedLocation);
    });

    test('should allow method chaining for setUserLocation', () => {
      const result = storage.setUserLocation(
        '-100123456789',
        '123456789',
        { latitude: 19.4326, longitude: -99.1332 }
      );
      expect(result).toBe(storage);
    });
  });

  describe('User Name Management', () => {
    test('should set and get user name', () => {
      const userId = '123456789';
      const userName = 'Juan Pérez';

      storage.setUserName(userId, userName);
      const result = storage.getUserName(userId);

      expect(result).toBe(userName);
    });

    test('should return default name for non-existent user', () => {
      const userId = '999999999';
      const result = storage.getUserName(userId);

      expect(result).toBe(`Usuario ${userId}`);
    });

    test('should get all user names', () => {
      storage.setUserName('123456789', 'Juan Pérez');
      storage.setUserName('987654321', 'María García');

      const allNames = storage.getAllUserNames();

      expect(allNames).toEqual({
        '123456789': 'Juan Pérez',
        '987654321': 'María García'
      });
    });

    test('should update existing user name', () => {
      const userId = '123456789';
      storage.setUserName(userId, 'Juan Pérez');
      storage.setUserName(userId, 'Juan Carlos Pérez');

      const result = storage.getUserName(userId);
      expect(result).toBe('Juan Carlos Pérez');
    });

    test('should allow method chaining for setUserName', () => {
      const result = storage.setUserName('123456789', 'Juan Pérez');
      expect(result).toBe(storage);
    });
  });

  describe('Location Last Update Management', () => {
    test('should set timestamp when setting user location', () => {
      const chatId = '-100123456789';
      const userId = '123456789';
      const location = { latitude: 19.4326, longitude: -99.1332 };
      const beforeTime = Date.now();

      storage.setUserLocation(chatId, userId, location);
      const timestamp = storage.getLocationLastUpdate(chatId, userId);
      const afterTime = Date.now();

      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    test('should return 0 for non-existent location update', () => {
      const result = storage.getLocationLastUpdate('-100999999999', '999999999');
      expect(result).toBe(0);
    });

    test('should get all location last updates', () => {
      const chatId = '-100123456789';
      const location = { latitude: 19.4326, longitude: -99.1332 };

      storage.setUserLocation(chatId, '123456789', location);
      storage.setUserLocation(chatId, '987654321', location);

      const allUpdates = storage.getAllLocationLastUpdates();

      expect(allUpdates).toHaveProperty(chatId);
      expect(allUpdates[chatId]).toHaveProperty('123456789');
      expect(allUpdates[chatId]).toHaveProperty('987654321');
      expect(typeof allUpdates[chatId]['123456789']).toBe('number');
      expect(typeof allUpdates[chatId]['987654321']).toBe('number');
    });

    test('should update timestamp when location is updated', () => {
      const chatId = '-100123456789';
      const userId = '123456789';
      const location1 = { latitude: 19.4326, longitude: -99.1332 };
      const location2 = { latitude: 19.4284, longitude: -99.1276 };

      storage.setUserLocation(chatId, userId, location1);
      const firstTimestamp = storage.getLocationLastUpdate(chatId, userId);

      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        storage.setUserLocation(chatId, userId, location2);
        const secondTimestamp = storage.getLocationLastUpdate(chatId, userId);

        expect(secondTimestamp).toBeGreaterThan(firstTimestamp);
      }, 1);
    });
  });

  describe('Reset Functionality', () => {
    test('should reset all storage data', () => {
      // Add some data
      storage.setGroupChat('-100123456789', 'Test Group');
      storage.setUserName('123456789', 'Juan Pérez');
      storage.setUserLocation(
        '-100123456789',
        '123456789',
        { latitude: 19.4326, longitude: -99.1332 }
      );

      // Verify data exists
      expect(storage.getGroupChat('-100123456789')).toBe('Test Group');
      expect(storage.getUserName('123456789')).toBe('Juan Pérez');
      expect(storage.getUserLocation('-100123456789', '123456789')).toBeDefined();

      // Reset
      storage.reset();

      // Verify data is cleared
      expect(storage.getGroupChat('-100123456789')).toBeUndefined();
      expect(storage.getUserName('123456789')).toBe('Usuario 123456789');
      expect(storage.getUserLocation('-100123456789', '123456789')).toBeUndefined();
      expect(storage.getLocationLastUpdate('-100123456789', '123456789')).toBe(0);
    });

    test('should reset to empty objects', () => {
      storage.setGroupChat('-100123456789', 'Test Group');
      storage.reset();

      expect(storage.getAllGroupChats()).toEqual({});
      expect(storage.getAllUserLocations()).toEqual({});
      expect(storage.getAllUserNames()).toEqual({});
      expect(storage.getAllLocationLastUpdates()).toEqual({});
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete user workflow', () => {
      const chatId = '-100123456789';
      const userId = '123456789';
      const groupName = 'Test Group';
      const userName = 'Juan Pérez';
      const location = { latitude: 19.4326, longitude: -99.1332 };

      // Complete workflow
      storage
        .setGroupChat(chatId, groupName)
        .setUserName(userId, userName)
        .setUserLocation(chatId, userId, location);

      // Verify all data
      expect(storage.getGroupChat(chatId)).toBe(groupName);
      expect(storage.getUserName(userId)).toBe(userName);
      expect(storage.getUserLocation(chatId, userId)).toEqual(location);
      expect(storage.getLocationLastUpdate(chatId, userId)).toBeGreaterThan(0);
    });

    test('should handle multiple groups and users', () => {
      const groups = [
        { chatId: '-100111111111', name: 'Group 1' },
        { chatId: '-100222222222', name: 'Group 2' }
      ];
      const users = [
        { userId: '123456789', name: 'Juan Pérez' },
        { userId: '987654321', name: 'María García' }
      ];
      const location = { latitude: 19.4326, longitude: -99.1332 };

      // Set up data
      groups.forEach(group => {
        storage.setGroupChat(group.chatId, group.name);
        users.forEach(user => {
          storage.setUserName(user.userId, user.name);
          storage.setUserLocation(group.chatId, user.userId, location);
        });
      });

      // Verify structure
      const allGroups = storage.getAllGroupChats();
      const allLocations = storage.getAllUserLocations();
      const allNames = storage.getAllUserNames();

      expect(Object.keys(allGroups)).toHaveLength(2);
      expect(Object.keys(allLocations)).toHaveLength(2);
      expect(Object.keys(allNames)).toHaveLength(2);

      // Verify each group has all users
      groups.forEach(group => {
        expect(allLocations[group.chatId]).toBeDefined();
        expect(Object.keys(allLocations[group.chatId])).toHaveLength(2);
      });
    });
  });
});