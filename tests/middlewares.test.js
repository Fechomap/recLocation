// tests/middlewares.test.js
const authMiddleware = require('../src/middlewares/authMiddleware');
const config = require('../src/config');

// Mock config
jest.mock('../src/config');
const mockedConfig = config;

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock setup
    mockedConfig.ADMIN_IDS = ['123456789', '987654321', '555666777'];
  });

  describe('isAdmin', () => {
    test('should return true for admin user (string ID)', () => {
      const result = authMiddleware.isAdmin('123456789');
      expect(result).toBe(true);
    });

    test('should return true for admin user (number ID)', () => {
      const result = authMiddleware.isAdmin(123456789);
      expect(result).toBe(true);
    });

    test('should return false for non-admin user (string ID)', () => {
      const result = authMiddleware.isAdmin('999888777');
      expect(result).toBe(false);
    });

    test('should return false for non-admin user (number ID)', () => {
      const result = authMiddleware.isAdmin(999888777);
      expect(result).toBe(false);
    });

    test('should handle multiple admin IDs correctly', () => {
      expect(authMiddleware.isAdmin('123456789')).toBe(true);
      expect(authMiddleware.isAdmin('987654321')).toBe(true);
      expect(authMiddleware.isAdmin('555666777')).toBe(true);
      expect(authMiddleware.isAdmin('111222333')).toBe(false);
    });

    test('should handle empty admin list', () => {
      mockedConfig.ADMIN_IDS = [];
      
      const result = authMiddleware.isAdmin('123456789');
      expect(result).toBe(false);
    });

    test('should handle large user IDs', () => {
      mockedConfig.ADMIN_IDS = ['12345678901234567890'];
      
      const result = authMiddleware.isAdmin('12345678901234567890');
      expect(result).toBe(true);
    });

    test('should handle negative user IDs', () => {
      mockedConfig.ADMIN_IDS = ['-100123456789'];
      
      expect(authMiddleware.isAdmin('-100123456789')).toBe(true);
      expect(authMiddleware.isAdmin(-100123456789)).toBe(true);
    });

    test('should be case sensitive for string comparison', () => {
      mockedConfig.ADMIN_IDS = ['123456789'];
      
      expect(authMiddleware.isAdmin('123456789')).toBe(true);
      expect(authMiddleware.isAdmin('123456789 ')).toBe(false); // with space
    });

    test('should handle zero as user ID', () => {
      mockedConfig.ADMIN_IDS = ['0'];
      
      expect(authMiddleware.isAdmin(0)).toBe(true);
      expect(authMiddleware.isAdmin('0')).toBe(true);
    });

    test('should convert number to string for comparison', () => {
      mockedConfig.ADMIN_IDS = ['123456789'];
      
      // Should work regardless of input type
      expect(authMiddleware.isAdmin(123456789)).toBe(true);
      expect(authMiddleware.isAdmin('123456789')).toBe(true);
    });
  });

  describe('adminOnly', () => {
    let mockBot;

    beforeEach(() => {
      mockBot = {
        sendMessage: jest.fn()
      };
    });

    test('should return true and not send message for admin user', () => {
      const mockMessage = {
        chat: { id: 123456789 },
        from: { id: 123456789 }
      };

      const result = authMiddleware.adminOnly(mockBot, mockMessage);

      expect(result).toBe(true);
      expect(mockBot.sendMessage).not.toHaveBeenCalled();
    });

    test('should return false and send error message for non-admin user', () => {
      const mockMessage = {
        chat: { id: 123456789 },
        from: { id: 999888777 }
      };

      const result = authMiddleware.adminOnly(mockBot, mockMessage);

      expect(result).toBe(false);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456789,
        '❌ No tienes permiso para usar este comando.'
      );
    });

    test('should work with group chats', () => {
      const mockMessage = {
        chat: { id: -100123456789, type: 'group' },
        from: { id: 987654321 }
      };

      const result = authMiddleware.adminOnly(mockBot, mockMessage);

      expect(result).toBe(true);
      expect(mockBot.sendMessage).not.toHaveBeenCalled();
    });

    test('should work with supergroup chats', () => {
      const mockMessage = {
        chat: { id: -1001234567890, type: 'supergroup' },
        from: { id: 555666777 }
      };

      const result = authMiddleware.adminOnly(mockBot, mockMessage);

      expect(result).toBe(true);
      expect(mockBot.sendMessage).not.toHaveBeenCalled();
    });

    test('should handle different chat types for non-admin users', () => {
      const mockMessage = {
        chat: { id: -100123456789, type: 'group' },
        from: { id: 999888777 }
      };

      const result = authMiddleware.adminOnly(mockBot, mockMessage);

      expect(result).toBe(false);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        -100123456789,
        '❌ No tienes permiso para usar este comando.'
      );
    });

    test('should handle missing from.id gracefully', () => {
      const mockMessage = {
        chat: { id: 123456789 },
        from: { } // missing id
      };

      const result = authMiddleware.adminOnly(mockBot, mockMessage);

      expect(result).toBe(false);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456789,
        '❌ No tienes permiso para usar este comando.'
      );
    });

    test('should handle null/undefined user ID', () => {
      const mockMessageNull = {
        chat: { id: 123456789 },
        from: { id: null }
      };

      const mockMessageUndefined = {
        chat: { id: 123456789 },
        from: { id: undefined }
      };

      expect(authMiddleware.adminOnly(mockBot, mockMessageNull)).toBe(false);
      expect(authMiddleware.adminOnly(mockBot, mockMessageUndefined)).toBe(false);
      expect(mockBot.sendMessage).toHaveBeenCalledTimes(2);
    });

    test('should use isAdmin method internally', () => {
      const isAdminSpy = jest.spyOn(authMiddleware, 'isAdmin');
      
      const mockMessage = {
        chat: { id: 123456789 },
        from: { id: 123456789 }
      };

      authMiddleware.adminOnly(mockBot, mockMessage);

      expect(isAdminSpy).toHaveBeenCalledWith(123456789);
      
      isAdminSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    test('should maintain consistent behavior between isAdmin and adminOnly', () => {
      const mockBot = { sendMessage: jest.fn() };
      const adminUserId = 123456789;
      const regularUserId = 999888777;

      const mockAdminMessage = {
        chat: { id: 123456789 },
        from: { id: adminUserId }
      };

      const mockRegularMessage = {
        chat: { id: 123456789 },
        from: { id: regularUserId }
      };

      // Test admin user
      expect(authMiddleware.isAdmin(adminUserId)).toBe(true);
      expect(authMiddleware.adminOnly(mockBot, mockAdminMessage)).toBe(true);

      // Test regular user
      expect(authMiddleware.isAdmin(regularUserId)).toBe(false);
      expect(authMiddleware.adminOnly(mockBot, mockRegularMessage)).toBe(false);
    });

    test('should handle edge case with string vs number consistency', () => {
      mockedConfig.ADMIN_IDS = ['123456789'];
      const mockBot = { sendMessage: jest.fn() };

      const mockMessageStringId = {
        chat: { id: 123456789 },
        from: { id: '123456789' }
      };

      const mockMessageNumberId = {
        chat: { id: 123456789 },
        from: { id: 123456789 }
      };

      // Both should work
      expect(authMiddleware.adminOnly(mockBot, mockMessageStringId)).toBe(true);
      expect(authMiddleware.adminOnly(mockBot, mockMessageNumberId)).toBe(true);
      expect(mockBot.sendMessage).not.toHaveBeenCalled();
    });

    test('should handle real-world admin ID patterns', () => {
      // Telegram user IDs are typically 9-10 digits
      mockedConfig.ADMIN_IDS = [
        '123456789',    // 9 digits
        '1234567890',   // 10 digits
        '98765432',     // 8 digits
        '-100123456789' // Group ID (negative)
      ];

      expect(authMiddleware.isAdmin(123456789)).toBe(true);
      expect(authMiddleware.isAdmin(1234567890)).toBe(true);
      expect(authMiddleware.isAdmin(98765432)).toBe(true);
      expect(authMiddleware.isAdmin(-100123456789)).toBe(true);
      expect(authMiddleware.isAdmin(111111111)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle bot.sendMessage errors gracefully', () => {
      const mockBot = {
        sendMessage: jest.fn().mockImplementation(() => {
          throw new Error('Bot error');
        })
      };

      const mockMessage = {
        chat: { id: 123456789 },
        from: { id: 999888777 }
      };

      expect(() => authMiddleware.adminOnly(mockBot, mockMessage)).toThrow('Bot error');
    });

    test('should handle malformed config.ADMIN_IDS', () => {
      mockedConfig.ADMIN_IDS = null;

      expect(() => authMiddleware.isAdmin('123456789')).toThrow();
    });

    test('should handle undefined config.ADMIN_IDS', () => {
      mockedConfig.ADMIN_IDS = undefined;

      expect(() => authMiddleware.isAdmin('123456789')).toThrow();
    });
  });
});