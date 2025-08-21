// tests/commands.test.js
const helpCmd = require('../src/commands/helpCmd');
const adminCmd = require('../src/commands/adminCmd');
const storage = require('../src/storage');
const { isAdmin } = require('../src/middlewares/authMiddleware');

// Mock dependencies
jest.mock('../src/storage');
jest.mock('../src/middlewares/authMiddleware');

const mockedStorage = storage;
const mockedIsAdmin = isAdmin;

describe('Help Command', () => {
  let mockBot;
  let helpHandler;

  beforeEach(() => {
    jest.clearAllMocks();

    mockBot = {
      sendMessage: jest.fn()
    };

    helpHandler = helpCmd(mockBot);
  });

  test('should send help message with correct content', () => {
    const mockMessage = {
      chat: { id: 123456789 },
      from: { id: 123456789 }
    };

    helpHandler(mockMessage);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      123456789,
      expect.stringContaining('📌 *Comandos Disponibles* 📌'),
      { parse_mode: 'Markdown' }
    );

    const [, message] = mockBot.sendMessage.mock.calls[0];
    expect(message).toContain('/loc');
    expect(message).toContain('/timing');
    expect(message).toContain('/geo');
    expect(message).toContain('/changeOP');
    expect(message).toContain('/help');
    expect(message).toContain('/changeOPs');
  });

  test('should include usage instructions in help message', () => {
    const mockMessage = {
      chat: { id: 123456789 },
      from: { id: 123456789 }
    };

    helpHandler(mockMessage);

    const [, message] = mockBot.sendMessage.mock.calls[0];
    expect(message).toContain('*Cómo usar:*');
    expect(message).toContain('latitud,longitud');
    expect(message).toContain('19.356247,-98.984018');
  });

  test('should work with different chat types', () => {
    const groupMessage = {
      chat: { id: -100123456789, type: 'group' },
      from: { id: 123456789 }
    };

    helpHandler(groupMessage);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      -100123456789,
      expect.stringContaining('📌 *Comandos Disponibles* 📌'),
      { parse_mode: 'Markdown' }
    );
  });
});

describe('Admin Commands', () => {
  let mockBot;
  let changeOpHandler;

  beforeEach(() => {
    jest.clearAllMocks();

    mockBot = {
      sendMessage: jest.fn()
    };

    changeOpHandler = adminCmd.handleChangeOP(mockBot);

    // Setup storage mock
    mockedStorage.setUserName.mockReturnValue(mockedStorage);
  });

  describe('changeOP Command', () => {
    test('should change operator name when user is admin', () => {
      mockedIsAdmin.mockReturnValue(true);

      const mockMessage = {
        chat: { id: 123456789 },
        from: { id: 123456789 }
      };
      const match = ['/changeOP 987654321 Juan Pérez', '987654321 Juan Pérez'];

      changeOpHandler(mockMessage, match);

      expect(mockedStorage.setUserName).toHaveBeenCalledWith(
        '987654321',
        'Juan Pérez'
      );
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456789,
        '✅ Nombre asignado al usuario 987654321: Juan Pérez'
      );
    });

    test('should reject command when user is not admin', () => {
      mockedIsAdmin.mockReturnValue(false);

      const mockMessage = {
        chat: { id: 123456789 },
        from: { id: 123456789 }
      };
      const match = ['/changeOP 987654321 Juan Pérez', '987654321 Juan Pérez'];

      changeOpHandler(mockMessage, match);

      expect(mockedStorage.setUserName).not.toHaveBeenCalled();
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456789,
        '❌ No tienes permiso para usar este comando.'
      );
    });

    test('should handle incorrect format with missing arguments', () => {
      mockedIsAdmin.mockReturnValue(true);

      const mockMessage = {
        chat: { id: 123456789 },
        from: { id: 123456789 }
      };
      const match = ['/changeOP 987654321', '987654321'];

      changeOpHandler(mockMessage, match);

      expect(mockedStorage.setUserName).not.toHaveBeenCalled();
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456789,
        '❌ Formato incorrecto. Usa: /changeOP <user_id> <new_name>'
      );
    });

    test('should handle invalid user ID', () => {
      mockedIsAdmin.mockReturnValue(true);

      const mockMessage = {
        chat: { id: 123456789 },
        from: { id: 123456789 }
      };
      const match = ['/changeOP abc123 Juan Pérez', 'abc123 Juan Pérez'];

      changeOpHandler(mockMessage, match);

      expect(mockedStorage.setUserName).not.toHaveBeenCalled();
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456789,
        '❌ El ID de usuario debe ser un número.'
      );
    });

    test('should handle multi-word names correctly', () => {
      mockedIsAdmin.mockReturnValue(true);

      const mockMessage = {
        chat: { id: 123456789 },
        from: { id: 123456789 }
      };
      const match = [
        '/changeOP 987654321 Juan Carlos Pérez González',
        '987654321 Juan Carlos Pérez González'
      ];

      changeOpHandler(mockMessage, match);

      expect(mockedStorage.setUserName).toHaveBeenCalledWith(
        '987654321',
        'Juan Carlos Pérez González'
      );
    });

    test('should handle names with special characters', () => {
      mockedIsAdmin.mockReturnValue(true);

      const mockMessage = {
        chat: { id: 123456789 },
        from: { id: 123456789 }
      };
      const match = [
        '/changeOP 987654321 María José Rodríguez-Pérez',
        '987654321 María José Rodríguez-Pérez'
      ];

      changeOpHandler(mockMessage, match);

      expect(mockedStorage.setUserName).toHaveBeenCalledWith(
        '987654321',
        'María José Rodríguez-Pérez'
      );
    });

    test('should handle numeric user IDs correctly', () => {
      mockedIsAdmin.mockReturnValue(true);

      const mockMessage = {
        chat: { id: 123456789 },
        from: { id: 123456789 }
      };
      const match = ['/changeOP 1234567890 Test User', '1234567890 Test User'];

      changeOpHandler(mockMessage, match);

      expect(mockedStorage.setUserName).toHaveBeenCalledWith(
        '1234567890',
        'Test User'
      );
    });

    test('should handle very long user IDs', () => {
      mockedIsAdmin.mockReturnValue(true);

      const mockMessage = {
        chat: { id: 123456789 },
        from: { id: 123456789 }
      };
      const match = [
        '/changeOP 12345678901234567890 Test User',
        '12345678901234567890 Test User'
      ];

      changeOpHandler(mockMessage, match);

      expect(mockedStorage.setUserName).toHaveBeenCalledWith(
        '12345678901234567890',
        'Test User'
      );
    });

    test('should handle empty name gracefully', () => {
      mockedIsAdmin.mockReturnValue(true);

      const mockMessage = {
        chat: { id: 123456789 },
        from: { id: 123456789 }
      };
      const match = ['/changeOP 987654321 ', '987654321 '];

      changeOpHandler(mockMessage, match);

      expect(mockedStorage.setUserName).toHaveBeenCalledWith('987654321', '');
    });
  });

  describe('Command Handler Creation', () => {
    test('should return a function when called with bot', () => {
      const handler = adminCmd.handleChangeOP(mockBot);
      expect(typeof handler).toBe('function');
    });

    test('should create independent handlers for different bots', () => {
      const mockBot1 = { sendMessage: jest.fn() };
      const mockBot2 = { sendMessage: jest.fn() };

      const handler1 = adminCmd.handleChangeOP(mockBot1);
      const handler2 = adminCmd.handleChangeOP(mockBot2);

      expect(handler1).not.toBe(handler2);
      expect(typeof handler1).toBe('function');
      expect(typeof handler2).toBe('function');
    });
  });

  describe('Error Handling', () => {
    test('should handle storage errors gracefully', () => {
      mockedIsAdmin.mockReturnValue(true);
      mockedStorage.setUserName.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const mockMessage = {
        chat: { id: 123456789 },
        from: { id: 123456789 }
      };
      const match = ['/changeOP 987654321 Juan Pérez', '987654321 Juan Pérez'];

      expect(() => changeOpHandler(mockMessage, match)).toThrow(
        'Storage error'
      );
    });

    test('should handle bot sendMessage errors gracefully', () => {
      mockedIsAdmin.mockReturnValue(false);
      mockBot.sendMessage.mockImplementation(() => {
        throw new Error('Bot error');
      });

      const mockMessage = {
        chat: { id: 123456789 },
        from: { id: 123456789 }
      };
      const match = ['/changeOP 987654321 Juan Pérez', '987654321 Juan Pérez'];

      expect(() => changeOpHandler(mockMessage, match)).toThrow('Bot error');
    });
  });

  describe('Authorization Flow', () => {
    test('should check admin status before any operation', () => {
      mockedIsAdmin.mockReturnValue(true);

      const mockMessage = {
        chat: { id: 123456789 },
        from: { id: 123456789 }
      };
      const match = ['/changeOP 987654321 Juan Pérez', '987654321 Juan Pérez'];

      changeOpHandler(mockMessage, match);

      expect(mockedIsAdmin).toHaveBeenCalledWith(123456789);
    });

    test('should not proceed with operation if not admin', () => {
      mockedIsAdmin.mockReturnValue(false);

      const mockMessage = {
        chat: { id: 123456789 },
        from: { id: 123456789 }
      };
      const match = ['/changeOP 987654321 Juan Pérez', '987654321 Juan Pérez'];

      changeOpHandler(mockMessage, match);

      expect(mockedStorage.setUserName).not.toHaveBeenCalled();
    });
  });
});
