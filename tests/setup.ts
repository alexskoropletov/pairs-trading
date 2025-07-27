import fs from 'fs-extra';
import path from 'path';

// Мокаем winston logger
jest.mock('../src/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

// Мокаем telegram
jest.mock('telegram', () => ({
  TelegramClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    sendMessage: jest.fn().mockResolvedValue(undefined),
    sendFile: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined)
  }))
}));

jest.mock('telegram/sessions', () => ({
  StringSession: jest.fn().mockImplementation(() => ({}))
}));

// Мокаем nodeplotlib
jest.mock('nodeplotlib', () => ({
  plot: jest.fn(),
  stack: jest.fn()
}));

// Создаем временную директорию для тестов
const TEST_DIR = path.join(__dirname, 'temp');

beforeAll(async () => {
  // Создаем временную директорию
  await fs.ensureDir(TEST_DIR);
  await fs.ensureDir(path.join(TEST_DIR, 'stats'));
});

afterAll(async () => {
  // Очищаем временную директорию
  await fs.remove(TEST_DIR);
});

// Глобальные тестовые данные
export const mockStockData = [
  {
    Date: '2024-01-01',
    Open: 100,
    High: 105,
    Low: 98,
    Close: 102,
    Volume: 1000000
  },
  {
    Date: '2024-01-02',
    Open: 102,
    High: 108,
    Low: 101,
    Close: 106,
    Volume: 1200000
  },
  {
    Date: '2024-01-03',
    Open: 106,
    High: 110,
    Low: 104,
    Close: 108,
    Volume: 1100000
  }
];

export const mockPairsData = [
  {
    asset1: 'AAPL',
    asset2: 'MSFT',
    correlation: 0.85,
    longAsset: 'AAPL',
    shortAsset: 'MSFT',
    strategy: 'LONG_AAPL_SHORT_MSFT',
    index: 'S&P500',
    longProspectivity: 0.75,
    shortProspectivity: 0.65,
    volatility1: 0.25,
    volatility2: 0.30,
    avgReturn1: 0.12,
    avgReturn2: 0.10
  }
];

export { TEST_DIR }; 