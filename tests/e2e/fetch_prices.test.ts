import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { TEST_DIR } from '../setup';

// Мокаем axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Fetch Prices E2E', () => {
  const testStatsDir = path.join(TEST_DIR, 'stats');
  
  beforeEach(async () => {
    jest.clearAllMocks();
    await fs.ensureDir(testStatsDir);
  });

  afterEach(async () => {
    await fs.remove(testStatsDir);
  });

  describe('Stock Data Fetching with Date Check', () => {
    it('should skip files that were updated today', async () => {
      // Создаем файл, который был обновлен сегодня
      const todayFile = path.join(testStatsDir, 'AAPL.csv');
      const csvContent = 'Date,Open,High,Low,Close,Volume\n2024-01-15,100,105,98,102,1000000';
      await fs.writeFile(todayFile, csvContent);
      
      // Устанавливаем время модификации на сегодня
      const today = new Date();
      await fs.utimes(todayFile, today, today);

      // Мокаем stock модуль
      jest.doMock('../../src/stock', () => ({
        stockSymbols: ['AAPL']
      }));

      const fetchPrices = require('../../src/fetch_prices');
      
      // Запускаем загрузку
      await fetchPrices.main();

      // Проверяем, что API не вызывался для AAPL
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should update files that were modified yesterday', async () => {
      // Создаем файл, который был обновлен вчера
      const yesterdayFile = path.join(testStatsDir, 'MSFT.csv');
      const csvContent = 'Date,Open,High,Low,Close,Volume\n2024-01-14,200,210,195,205,2000000';
      await fs.writeFile(yesterdayFile, csvContent);
      
      // Устанавливаем время модификации на вчера
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await fs.utimes(yesterdayFile, yesterday, yesterday);

      // Мокаем ответ API
      const mockYahooResponse = {
        data: {
          chart: {
            result: [{
              timestamp: [1640995200],
              indicators: {
                quote: [{
                  open: [200],
                  high: [210],
                  low: [195],
                  close: [205],
                  volume: [2000000]
                }]
              }
            }]
          }
        }
      };
      mockedAxios.get.mockResolvedValue(mockYahooResponse);

      // Мокаем stock модуль
      jest.doMock('../../src/stock', () => ({
        stockSymbols: ['MSFT']
      }));

      const fetchPrices = require('../../src/fetch_prices');
      
      // Запускаем загрузку
      await fetchPrices.main();

      // Проверяем, что API был вызван для MSFT
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('MSFT'),
        expect.any(Object)
      );
    });

    it('should handle mixed scenario - some files up to date, others not', async () => {
      // Создаем файл, обновленный сегодня
      const todayFile = path.join(testStatsDir, 'AAPL.csv');
      await fs.writeFile(todayFile, 'Date,Open,High,Low,Close,Volume\n2024-01-15,100,105,98,102,1000000');
      const today = new Date();
      await fs.utimes(todayFile, today, today);

      // Создаем файл, обновленный вчера
      const yesterdayFile = path.join(testStatsDir, 'MSFT.csv');
      await fs.writeFile(yesterdayFile, 'Date,Open,High,Low,Close,Volume\n2024-01-14,200,210,195,205,2000000');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await fs.utimes(yesterdayFile, yesterday, yesterday);

      // Мокаем ответ API
      const mockYahooResponse = {
        data: {
          chart: {
            result: [{
              timestamp: [1640995200],
              indicators: {
                quote: [{
                  open: [200],
                  high: [210],
                  low: [195],
                  close: [205],
                  volume: [2000000]
                }]
              }
            }]
          }
        }
      };
      mockedAxios.get.mockResolvedValue(mockYahooResponse);

      // Мокаем stock модуль
      jest.doMock('../../src/stock', () => ({
        stockSymbols: ['AAPL', 'MSFT']
      }));

      const fetchPrices = require('../../src/fetch_prices');
      
      // Запускаем загрузку
      await fetchPrices.main();

      // Проверяем, что API был вызван только один раз (для MSFT)
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('MSFT'),
        expect.any(Object)
      );
    });

    it('should create new files for symbols that do not exist', async () => {
      // Мокаем ответ API
      const mockYahooResponse = {
        data: {
          chart: {
            result: [{
              timestamp: [1640995200],
              indicators: {
                quote: [{
                  open: [300],
                  high: [315],
                  low: [290],
                  close: [310],
                  volume: [3000000]
                }]
              }
            }]
          }
        }
      };
      mockedAxios.get.mockResolvedValue(mockYahooResponse);

      // Мокаем stock модуль
      jest.doMock('../../src/stock', () => ({
        stockSymbols: ['GOOGL']
      }));

      const fetchPrices = require('../../src/fetch_prices');
      
      // Запускаем загрузку
      await fetchPrices.main();

      // Проверяем, что API был вызван для GOOGL
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('GOOGL'),
        expect.any(Object)
      );

      // Проверяем, что файл был создан
      const googlFile = path.join(testStatsDir, 'GOOGL.csv');
      expect(await fs.pathExists(googlFile)).toBe(true);
    });
  });

  describe('Stock Data Fetching', () => {
    it('should fetch and save stock data for multiple symbols', async () => {
      // Мокаем ответы API
      const mockYahooResponse = {
        data: {
          chart: {
            result: [{
              timestamp: [1640995200, 1641081600, 1641168000],
              indicators: {
                quote: [{
                  open: [100, 102, 104],
                  high: [105, 107, 109],
                  low: [98, 100, 102],
                  close: [102, 106, 108],
                  volume: [1000000, 1200000, 1100000]
                }]
              }
            }]
          }
        }
      };

      mockedAxios.get.mockResolvedValue(mockYahooResponse);

      // Импортируем функцию после моков
      const { fetchStockData } = require('../../src/fetch_prices');

      const symbols = ['AAPL', 'MSFT'];
      const result = await fetchStockData(symbols);

      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('AAPL');
      expect(result[1].symbol).toBe('MSFT');

      // Проверяем, что файлы созданы
      const aaplFile = path.join(testStatsDir, 'AAPL.csv');
      const msftFile = path.join(testStatsDir, 'MSFT.csv');

      expect(await fs.pathExists(aaplFile)).toBe(true);
      expect(await fs.pathExists(msftFile)).toBe(true);

      // Проверяем содержимое файлов
      const aaplContent = await fs.readFile(aaplFile, 'utf-8');
      const msftContent = await fs.readFile(msftFile, 'utf-8');

      expect(aaplContent).toContain('Date,Open,High,Low,Close,Volume');
      expect(msftContent).toContain('Date,Open,High,Low,Close,Volume');
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const { fetchStockData } = require('../../src/fetch_prices');

      const symbols = ['INVALID'];
      const result = await fetchStockData(symbols);

      expect(result).toHaveLength(0);
    });

    it('should handle empty response data', async () => {
      const mockEmptyResponse = {
        data: {
          chart: {
            result: []
          }
        }
      };

      mockedAxios.get.mockResolvedValue(mockEmptyResponse);

      const { fetchStockData } = require('../../src/fetch_prices');

      const symbols = ['AAPL'];
      const result = await fetchStockData(symbols);

      expect(result).toHaveLength(0);
    });
  });

  describe('Data Processing', () => {
    it('should process timestamp conversion correctly', async () => {
      const mockResponse = {
        data: {
          chart: {
            result: [{
              timestamp: [1640995200], // 2022-01-01
              indicators: {
                quote: [{
                  open: [100],
                  high: [105],
                  low: [98],
                  close: [102],
                  volume: [1000000]
                }]
              }
            }]
          }
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const { fetchStockData } = require('../../src/fetch_prices');

      const result = await fetchStockData(['AAPL']);

      expect(result[0].data[0].Date).toBe('2022-01-01');
    });

    it('should handle missing data points', async () => {
      const mockResponse = {
        data: {
          chart: {
            result: [{
              timestamp: [1640995200, 1641081600],
              indicators: {
                quote: [{
                  open: [100, null],
                  high: [105, 107],
                  low: [98, 100],
                  close: [102, 106],
                  volume: [1000000, 1200000]
                }]
              }
            }]
          }
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const { fetchStockData } = require('../../src/fetch_prices');

      const result = await fetchStockData(['AAPL']);

      expect(result[0].data).toHaveLength(1); // Только валидные данные
      expect(result[0].data[0].Open).toBe(100);
    });
  });

  describe('File Operations', () => {
    it('should create CSV files with correct format', async () => {
      const mockResponse = {
        data: {
          chart: {
            result: [{
              timestamp: [1640995200],
              indicators: {
                quote: [{
                  open: [100],
                  high: [105],
                  low: [98],
                  close: [102],
                  volume: [1000000]
                }]
              }
            }]
          }
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const { fetchStockData } = require('../../src/fetch_prices');

      await fetchStockData(['AAPL']);

      const csvContent = await fs.readFile(path.join(testStatsDir, 'AAPL.csv'), 'utf-8');
      const lines = csvContent.split('\n');

      expect(lines[0]).toBe('Date,Open,High,Low,Close,Volume');
      expect(lines[1]).toContain('2022-01-01,100,105,98,102,1000000');
    });

    it('should handle file write errors', async () => {
      // Мокаем ошибку записи файла
      jest.spyOn(fs, 'writeFile').mockRejectedValue(new Error('Write error'));

      const mockResponse = {
        data: {
          chart: {
            result: [{
              timestamp: [1640995200],
              indicators: {
                quote: [{
                  open: [100],
                  high: [105],
                  low: [98],
                  close: [102],
                  volume: [1000000]
                }]
              }
            }]
          }
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const { fetchStockData } = require('../../src/fetch_prices');

      const result = await fetchStockData(['AAPL']);

      expect(result).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      mockedAxios.get.mockRejectedValue(new Error('timeout of 5000ms exceeded'));

      const { fetchStockData } = require('../../src/fetch_prices');

      const result = await fetchStockData(['AAPL']);

      expect(result).toHaveLength(0);
    });

    it('should handle rate limiting', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 429,
          data: { message: 'Rate limit exceeded' }
        }
      });

      const { fetchStockData } = require('../../src/fetch_prices');

      const result = await fetchStockData(['AAPL']);

      expect(result).toHaveLength(0);
    });

    it('should handle invalid symbol errors', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Symbol not found' }
        }
      });

      const { fetchStockData } = require('../../src/fetch_prices');

      const result = await fetchStockData(['INVALID']);

      expect(result).toHaveLength(0);
    });
  });
}); 