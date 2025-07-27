import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { TEST_DIR, mockStockData } from '../setup';

// Мокаем axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Мокаем fs-extra
jest.mock('fs-extra');

describe('Fetch Prices Module', () => {
  const testStatsDir = path.join(TEST_DIR, 'stats');
  
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.ensureDirSync as jest.Mock).mockImplementation(() => {});
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.statSync as jest.Mock).mockReturnValue({
      mtime: new Date('2024-01-15T10:00:00Z')
    });
  });

  describe('isDataUpToDate', () => {
    it('should return false when file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const { isDataUpToDate } = require('../../src/fetch_prices');
      const result = isDataUpToDate('AAPL');

      expect(result).toBe(false);
    });

    it('should return true when file was modified today', () => {
      const today = new Date();
      (fs.statSync as jest.Mock).mockReturnValue({
        mtime: today
      });

      const { isDataUpToDate } = require('../../src/fetch_prices');
      const result = isDataUpToDate('AAPL');

      expect(result).toBe(true);
    });

    it('should return false when file was modified yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      (fs.statSync as jest.Mock).mockReturnValue({
        mtime: yesterday
      });

      const { isDataUpToDate } = require('../../src/fetch_prices');
      const result = isDataUpToDate('AAPL');

      expect(result).toBe(false);
    });

    it('should return false when file was modified last week', () => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      (fs.statSync as jest.Mock).mockReturnValue({
        mtime: lastWeek
      });

      const { isDataUpToDate } = require('../../src/fetch_prices');
      const result = isDataUpToDate('AAPL');

      expect(result).toBe(false);
    });

    it('should handle stat errors gracefully', () => {
      (fs.statSync as jest.Mock).mockImplementation(() => {
        throw new Error('File system error');
      });

      const { isDataUpToDate } = require('../../src/fetch_prices');
      const result = isDataUpToDate('AAPL');

      expect(result).toBe(false);
    });
  });

  describe('fetchStockData', () => {
    it('should fetch and process stock data correctly', async () => {
      const mockYahooResponse = {
        data: {
          chart: {
            result: [{
              timestamp: [1640995200, 1641081600], // 2022-01-01, 2022-01-02
              indicators: {
                quote: [{
                  open: [100, 102],
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

      mockedAxios.get.mockResolvedValue(mockYahooResponse);

      const { fetchStockData } = require('../../src/fetch_prices');
      const result = await fetchStockData('AAPL');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        Date: '2022-01-01',
        Open: 100,
        High: 105,
        Low: 98,
        Close: 102,
        Volume: 1000000
      });
      expect(result[1]).toEqual({
        Date: '2022-01-02',
        Open: 102,
        High: 107,
        Low: 100,
        Close: 106,
        Volume: 1200000
      });
    });

    it('should handle missing data points', async () => {
      const mockYahooResponse = {
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

      mockedAxios.get.mockResolvedValue(mockYahooResponse);

      const { fetchStockData } = require('../../src/fetch_prices');
      const result = await fetchStockData('AAPL');

      expect(result).toHaveLength(1);
      expect(result[0].Open).toBe(100);
    });

    it('should handle null values in data', async () => {
      const mockYahooResponse = {
        data: {
          chart: {
            result: [{
              timestamp: [1640995200],
              indicators: {
                quote: [{
                  open: [null],
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

      mockedAxios.get.mockResolvedValue(mockYahooResponse);

      const { fetchStockData } = require('../../src/fetch_prices');
      const result = await fetchStockData('AAPL');

      expect(result[0].Open).toBe(0);
    });

    it('should handle empty response', async () => {
      const mockEmptyResponse = {
        data: {
          chart: {
            result: []
          }
        }
      };

      mockedAxios.get.mockResolvedValue(mockEmptyResponse);

      const { fetchStockData } = require('../../src/fetch_prices');

      await expect(fetchStockData('AAPL')).rejects.toThrow('Нет данных для акции');
    });

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const { fetchStockData } = require('../../src/fetch_prices');

      await expect(fetchStockData('INVALID')).rejects.toThrow('Ошибка при получении данных для INVALID: API Error');
    });
  });

  describe('saveToCSV', () => {
    it('should save data to CSV correctly', async () => {
      const testData = [
        {
          Date: '2022-01-01',
          Open: 100,
          High: 105,
          Low: 98,
          Close: 102,
          Volume: 1000000
        }
      ];

      const { saveToCSV } = require('../../src/fetch_prices');
      await saveToCSV('AAPL', testData);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('AAPL.csv'),
        expect.stringContaining('Date,Open,High,Low,Close,Volume'),
        'utf-8'
      );
    });

    it('should handle file write errors', async () => {
      (fs.writeFile as jest.Mock).mockRejectedValue(new Error('Write error'));

      const testData = [
        {
          Date: '2022-01-01',
          Open: 100,
          High: 105,
          Low: 98,
          Close: 102,
          Volume: 1000000
        }
      ];

      const { saveToCSV } = require('../../src/fetch_prices');

      await expect(saveToCSV('AAPL', testData)).rejects.toThrow('Write error');
    });
  });

  describe('Date comparison logic', () => {
    it('should compare dates correctly regardless of time', () => {
      const today = new Date();
      const todayMorning = new Date(today);
      todayMorning.setHours(9, 0, 0, 0);
      
      const todayEvening = new Date(today);
      todayEvening.setHours(18, 30, 45, 123);

      expect(todayMorning.toDateString()).toBe(todayEvening.toDateString());
    });

    it('should handle different days correctly', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      expect(today.toDateString()).not.toBe(yesterday.toDateString());
    });
  });
}); 