import { TelegramSender, sendStockAnalysisToTelegram } from '../../src/telegram_sender';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

// Мокаем telegram модули
jest.mock('telegram');
jest.mock('telegram/sessions');

describe('Telegram Sender Module', () => {
  let telegramSender: TelegramSender;
  let mockClient: jest.Mocked<TelegramClient>;
  let mockSession: jest.Mocked<StringSession>;

  const mockConfig = {
    apiId: 12345,
    apiHash: 'test-api-hash',
    phone: '+1234567890',
    password: 'test-password',
    session: 'test-session',
    channelId: 'test-channel'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Создаем моки
    mockClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      sendMessage: jest.fn().mockResolvedValue(undefined),
      sendFile: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined)
    } as any;

    mockSession = {} as any;

    (TelegramClient as jest.Mock).mockImplementation(() => mockClient);
    (StringSession as jest.Mock).mockImplementation(() => mockSession);

    telegramSender = new TelegramSender(mockConfig);
  });

  describe('TelegramSender Constructor', () => {
    it('should create instance with correct config', () => {
      expect(telegramSender).toBeInstanceOf(TelegramSender);
      expect(telegramSender).toHaveProperty('config', mockConfig);
    });
  });

  describe('TelegramSender.initialize', () => {
    it('should initialize client successfully', async () => {
      await telegramSender.initialize();

      expect(TelegramClient).toHaveBeenCalledWith(
        mockSession,
        mockConfig.apiId,
        mockConfig.apiHash,
        expect.objectContaining({
          connectionRetries: 5
        })
      );
      expect(mockClient.connect).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Connection failed');
      mockClient.connect.mockRejectedValue(error);

      await expect(telegramSender.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('TelegramSender.sendMessage', () => {
    beforeEach(async () => {
      await telegramSender.initialize();
    });

    it('should send message successfully', async () => {
      const message = 'Test message';
      
      await telegramSender.sendMessage(message);

      expect(mockClient.sendMessage).toHaveBeenCalledWith(mockConfig.channelId, {
        message: message
      });
    });

    it('should handle send message errors', async () => {
      const error = new Error('Send failed');
      mockClient.sendMessage.mockRejectedValue(error);

      await expect(telegramSender.sendMessage('test')).rejects.toThrow('Send failed');
    });

    it('should throw error if client not initialized', async () => {
      const newSender = new TelegramSender(mockConfig);
      
      await expect(newSender.sendMessage('test')).rejects.toThrow('Client not initialized');
    });
  });

  describe('TelegramSender.sendFile', () => {
    beforeEach(async () => {
      await telegramSender.initialize();
    });

    it('should send file successfully', async () => {
      const filePath = '/path/to/file.csv';
      const caption = 'Test file';
      
      await telegramSender.sendFile(filePath, caption);

      expect(mockClient.sendFile).toHaveBeenCalledWith(mockConfig.channelId, {
        file: filePath,
        caption: caption
      });
    });

    it('should send file without caption', async () => {
      const filePath = '/path/to/file.csv';
      
      await telegramSender.sendFile(filePath);

      expect(mockClient.sendFile).toHaveBeenCalledWith(mockConfig.channelId, {
        file: filePath,
        caption: undefined
      });
    });

    it('should handle send file errors', async () => {
      const error = new Error('File send failed');
      mockClient.sendFile.mockRejectedValue(error);

      await expect(telegramSender.sendFile('/path/to/file.csv')).rejects.toThrow('File send failed');
    });
  });

  describe('TelegramSender.disconnect', () => {
    beforeEach(async () => {
      await telegramSender.initialize();
    });

    it('should disconnect successfully', async () => {
      await telegramSender.disconnect();

      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect errors', async () => {
      const error = new Error('Disconnect failed');
      mockClient.disconnect.mockRejectedValue(error);

      await expect(telegramSender.disconnect()).rejects.toThrow('Disconnect failed');
    });
  });

  describe('sendStockAnalysisToTelegram', () => {
    it('should send analysis message successfully', async () => {
      const message = 'Stock analysis results';
      
      await sendStockAnalysisToTelegram(message, mockConfig);

      expect(TelegramClient).toHaveBeenCalled();
      expect(mockClient.sendMessage).toHaveBeenCalledWith(mockConfig.channelId, {
        message: message
      });
      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    it('should handle errors in sendStockAnalysisToTelegram', async () => {
      const error = new Error('Analysis send failed');
      mockClient.sendMessage.mockRejectedValue(error);

      await expect(sendStockAnalysisToTelegram('test', mockConfig)).rejects.toThrow('Analysis send failed');
      expect(mockClient.disconnect).toHaveBeenCalled();
    });
  });

  describe('Configuration Validation', () => {
    it('should validate required config fields', () => {
      const invalidConfig = {
        apiId: 12345,
        // Missing apiHash
        phone: '+1234567890',
        channelId: 'test-channel'
      };

      expect(() => {
        new TelegramSender(invalidConfig as any);
      }).toThrow();
    });

    it('should accept valid config', () => {
      expect(() => {
        new TelegramSender(mockConfig);
      }).not.toThrow();
    });
  });

  describe('Session Management', () => {
    it('should create session with provided session string', () => {
      new TelegramSender(mockConfig);

      expect(StringSession).toHaveBeenCalledWith(mockConfig.session);
    });

    it('should create session without session string', () => {
      const configWithoutSession = { ...mockConfig };
      delete configWithoutSession.session;

      new TelegramSender(configWithoutSession);

      expect(StringSession).toHaveBeenCalledWith('');
    });
  });
}); 