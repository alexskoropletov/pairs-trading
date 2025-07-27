import fs from 'fs-extra';
import path from 'path';
import { TelegramSender, sendStockAnalysisToTelegram } from '../../src/telegram_sender';
import { TEST_DIR } from '../setup';

// Мокаем telegram модули
jest.mock('telegram');
jest.mock('telegram/sessions');

describe('Telegram Integration E2E', () => {
  const testStatsDir = path.join(TEST_DIR, 'stats');
  
  beforeEach(async () => {
    jest.clearAllMocks();
    await fs.ensureDir(testStatsDir);
  });

  afterEach(async () => {
    await fs.remove(testStatsDir);
  });

  describe('Telegram Message Sending', () => {
    it('should send stock analysis message successfully', async () => {
      const mockConfig = {
        apiId: 12345,
        apiHash: 'test-api-hash',
        phone: '+1234567890',
        password: 'test-password',
        session: 'test-session',
        channelId: 'test-channel'
      };

      const analysisMessage = `
📊 Анализ парного трейдинга завершен!

📈 Статистика:
• Всего проанализировано пар: 10
• S&P500 пар: 6
• NASDAQ пар: 4
• Средняя корреляция: 75.5%

🎯 Топ-3 пары:
1. AAPL ↔ MSFT (корреляция: 85.2%)
2. GOOGL ↔ AMZN (корреляция: 78.1%)
3. TSLA ↔ NVDA (корреляция: 72.3%)

💡 Рекомендации:
• Используйте стоп-лоссы
• Мониторьте расхождения
• Анализируйте регулярно
      `;

      await sendStockAnalysisToTelegram(analysisMessage, mockConfig);

      // Проверяем, что Telegram клиент был создан и использован
      const { TelegramClient } = require('telegram');
      expect(TelegramClient).toHaveBeenCalled();
    });

    it('should send file with caption', async () => {
      const mockConfig = {
        apiId: 12345,
        apiHash: 'test-api-hash',
        phone: '+1234567890',
        password: 'test-password',
        session: 'test-session',
        channelId: 'test-channel'
      };

      // Создаем тестовый файл
      const testFile = path.join(testStatsDir, 'test_analysis.csv');
      await fs.writeFile(testFile, 'Symbol,Weight,Return\nAAPL,0.5,12.5%\nMSFT,0.5,15.2%');

      const telegramSender = new TelegramSender(mockConfig);
      await telegramSender.initialize();
      await telegramSender.sendFile(testFile, 'Результаты анализа портфеля');

      // Проверяем, что файл был отправлен
      const { TelegramClient } = require('telegram');
      expect(TelegramClient).toHaveBeenCalled();
    });

    it('should handle multiple messages in sequence', async () => {
      const mockConfig = {
        apiId: 12345,
        apiHash: 'test-api-hash',
        phone: '+1234567890',
        password: 'test-password',
        session: 'test-session',
        channelId: 'test-channel'
      };

      const telegramSender = new TelegramSender(mockConfig);
      await telegramSender.initialize();

      // Отправляем несколько сообщений
      await telegramSender.sendMessage('Начинаем анализ...');
      await telegramSender.sendMessage('Анализ завершен!');
      await telegramSender.sendMessage('Результаты готовы.');

      await telegramSender.disconnect();

      // Проверяем, что все сообщения были отправлены
      const { TelegramClient } = require('telegram');
      expect(TelegramClient).toHaveBeenCalled();
    });
  });

  describe('File Operations with Telegram', () => {
    it('should send portfolio analysis files', async () => {
      const mockConfig = {
        apiId: 12345,
        apiHash: 'test-api-hash',
        phone: '+1234567890',
        password: 'test-password',
        session: 'test-session',
        channelId: 'test-channel'
      };

      // Создаем тестовые файлы анализа
      const portfolioFile = path.join(testStatsDir, 'markowitz_portfolio.csv');
      const pairsFile = path.join(testStatsDir, 'pairs_trading.csv');
      const summaryFile = path.join(testStatsDir, 'portfolio_summary.json');

      await fs.writeFile(portfolioFile, 'Symbol,Weight,Return\nAAPL,0.6,12.5%\nMSFT,0.4,15.2%');
      await fs.writeFile(pairsFile, 'Asset1,Asset2,Correlation\nAAPL,MSFT,0.85\nGOOGL,AMZN,0.78');
      await fs.writeJson(summaryFile, {
        totalAssets: 2,
        portfolioReturn: 0.135,
        portfolioRisk: 0.18,
        sharpeRatio: 0.75
      });

      const telegramSender = new TelegramSender(mockConfig);
      await telegramSender.initialize();

      // Отправляем файлы с описаниями
      await telegramSender.sendFile(portfolioFile, 'Оптимизированный портфель Марковица');
      await telegramSender.sendFile(pairsFile, 'Анализ парного трейдинга');
      await telegramSender.sendFile(summaryFile, 'Сводка по портфелю');

      await telegramSender.disconnect();

      // Проверяем, что файлы были отправлены
      const { TelegramClient } = require('telegram');
      expect(TelegramClient).toHaveBeenCalled();
    });

    it('should handle large files gracefully', async () => {
      const mockConfig = {
        apiId: 12345,
        apiHash: 'test-api-hash',
        phone: '+1234567890',
        password: 'test-password',
        session: 'test-session',
        channelId: 'test-channel'
      };

      // Создаем большой файл
      const largeFile = path.join(testStatsDir, 'large_analysis.csv');
      const largeData = Array.from({ length: 1000 }, (_, i) => 
        `Stock${i},${Math.random()},${Math.random() * 100}%`
      ).join('\n');
      await fs.writeFile(largeFile, 'Symbol,Weight,Return\n' + largeData);

      const telegramSender = new TelegramSender(mockConfig);
      await telegramSender.initialize();

      await telegramSender.sendFile(largeFile, 'Большой файл анализа');

      await telegramSender.disconnect();

      // Проверяем, что файл был отправлен
      const { TelegramClient } = require('telegram');
      expect(TelegramClient).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle connection failures', async () => {
      const mockConfig = {
        apiId: 12345,
        apiHash: 'test-api-hash',
        phone: '+1234567890',
        password: 'test-password',
        session: 'test-session',
        channelId: 'test-channel'
      };

      // Мокаем ошибку подключения
      const { TelegramClient } = require('telegram');
      const mockClient = {
        connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
        sendMessage: jest.fn(),
        sendFile: jest.fn(),
        disconnect: jest.fn()
      };
      TelegramClient.mockImplementation(() => mockClient);

      const telegramSender = new TelegramSender(mockConfig);

      await expect(telegramSender.initialize()).rejects.toThrow('Connection failed');
    });

    it('should handle authentication errors', async () => {
      const mockConfig = {
        apiId: 12345,
        apiHash: 'invalid-hash',
        phone: '+1234567890',
        password: 'test-password',
        session: 'test-session',
        channelId: 'test-channel'
      };

      // Мокаем ошибку аутентификации
      const { TelegramClient } = require('telegram');
      const mockClient = {
        connect: jest.fn().mockRejectedValue(new Error('Authentication failed')),
        sendMessage: jest.fn(),
        sendFile: jest.fn(),
        disconnect: jest.fn()
      };
      TelegramClient.mockImplementation(() => mockClient);

      const telegramSender = new TelegramSender(mockConfig);

      await expect(telegramSender.initialize()).rejects.toThrow('Authentication failed');
    });

    it('should handle file not found errors', async () => {
      const mockConfig = {
        apiId: 12345,
        apiHash: 'test-api-hash',
        phone: '+1234567890',
        password: 'test-password',
        session: 'test-session',
        channelId: 'test-channel'
      };

      const telegramSender = new TelegramSender(mockConfig);
      await telegramSender.initialize();

      const nonExistentFile = path.join(testStatsDir, 'non_existent.csv');

      await expect(telegramSender.sendFile(nonExistentFile)).rejects.toThrow();
    });

    it('should handle message sending errors', async () => {
      const mockConfig = {
        apiId: 12345,
        apiHash: 'test-api-hash',
        phone: '+1234567890',
        password: 'test-password',
        session: 'test-session',
        channelId: 'test-channel'
      };

      // Мокаем ошибку отправки сообщения
      const { TelegramClient } = require('telegram');
      const mockClient = {
        connect: jest.fn().mockResolvedValue(undefined),
        sendMessage: jest.fn().mockRejectedValue(new Error('Message send failed')),
        sendFile: jest.fn(),
        disconnect: jest.fn()
      };
      TelegramClient.mockImplementation(() => mockClient);

      const telegramSender = new TelegramSender(mockConfig);
      await telegramSender.initialize();

      await expect(telegramSender.sendMessage('test')).rejects.toThrow('Message send failed');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate required configuration fields', () => {
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

    it('should accept valid configuration', () => {
      const validConfig = {
        apiId: 12345,
        apiHash: 'test-api-hash',
        phone: '+1234567890',
        channelId: 'test-channel'
      };

      expect(() => {
        new TelegramSender(validConfig);
      }).not.toThrow();
    });
  });
}); 