import fs from 'fs-extra';
import path from 'path';
import { 
  getAllStocks, 
  getStockSymbols, 
  getStocksBySector, 
  findStockBySymbol,
  loadStocksFromFile,
  sp500StocksFallback,
  nasdaq100StocksFallback
} from '../../src/stock';
import { TEST_DIR } from '../setup';

// Мокаем fs-extra
jest.mock('fs-extra');

describe('Stock Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Правильно типизируем моки
    (fs.readFile as any) = jest.fn();
  });

  describe('loadStocksFromFile', () => {
    it('should load stocks from file successfully', async () => {
      const mockStocks = [
        { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' }
      ];

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockStocks));

      const result = await loadStocksFromFile();

      expect(result).toEqual(mockStocks);
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('stats/stock.json'),
        'utf-8'
      );
    });

    it('should return fallback data when file does not exist', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      const result = await loadStocksFromFile();

      expect(result).toBe(sp500StocksFallback);
    });

    it('should return fallback data when file is invalid JSON', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue('invalid json');

      const result = await loadStocksFromFile();

      expect(result).toBe(sp500StocksFallback);
    });
  });

  describe('getAllStocks', () => {
    it('should return cached stocks on subsequent calls', async () => {
      const mockStocks = [
        { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' }
      ];

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockStocks));

      // First call
      const result1 = await getAllStocks();
      // Second call
      const result2 = await getAllStocks();

      expect(result1).toEqual(result2);
      expect(fs.readFile).toHaveBeenCalledTimes(1); // Should be cached
    });

    it('should include cryptocurrencies in the result', async () => {
      const mockStocks = [
        { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' }
      ];

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockStocks));

      const result = await getAllStocks();

      // Should include both stocks and cryptocurrencies
      expect(result.length).toBeGreaterThan(mockStocks.length);
      expect(result.some(stock => stock.symbol === 'BTC')).toBe(true);
    });
  });

  describe('getStockSymbols', () => {
    it('should return array of stock symbols', async () => {
      const mockStocks = [
        { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' }
      ];

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockStocks));

      const result = await getStockSymbols();

      expect(result).toEqual(['AAPL', 'MSFT']);
    });
  });

  describe('getStocksBySector', () => {
    it('should return stocks filtered by sector', async () => {
      const mockStocks = [
        { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
        { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financial' }
      ];

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockStocks));

      const result = await getStocksBySector('Technology');

      expect(result).toHaveLength(2);
      expect(result.every(stock => stock.sector === 'Technology')).toBe(true);
    });

    it('should return empty array for non-existent sector', async () => {
      const mockStocks = [
        { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' }
      ];

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockStocks));

      const result = await getStocksBySector('NonExistentSector');

      expect(result).toHaveLength(0);
    });
  });

  describe('findStockBySymbol', () => {
    it('should find stock by symbol', async () => {
      const mockStocks = [
        { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' }
      ];

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockStocks));

      const result = await findStockBySymbol('AAPL');

      expect(result).toEqual({ symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' });
    });

    it('should return undefined for non-existent symbol', async () => {
      const mockStocks = [
        { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' }
      ];

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockStocks));

      const result = await findStockBySymbol('NONEXISTENT');

      expect(result).toBeUndefined();
    });
  });

  describe('Fallback data', () => {
    it('should have valid S&P500 fallback data', () => {
      expect(sp500StocksFallback).toBeInstanceOf(Array);
      expect(sp500StocksFallback.length).toBeGreaterThan(0);
      
      sp500StocksFallback.forEach(stock => {
        expect(stock).toHaveProperty('symbol');
        expect(stock).toHaveProperty('name');
        expect(stock).toHaveProperty('sector');
        expect(typeof stock.symbol).toBe('string');
        expect(typeof stock.name).toBe('string');
        expect(typeof stock.sector).toBe('string');
      });
    });

    it('should have valid NASDAQ fallback data', () => {
      expect(nasdaq100StocksFallback).toBeInstanceOf(Array);
      expect(nasdaq100StocksFallback.length).toBeGreaterThan(0);
      
      nasdaq100StocksFallback.forEach(stock => {
        expect(stock).toHaveProperty('symbol');
        expect(stock).toHaveProperty('name');
        expect(stock).toHaveProperty('sector');
        expect(typeof stock.symbol).toBe('string');
        expect(typeof stock.name).toBe('string');
        expect(typeof stock.sector).toBe('string');
      });
    });

    it('should have unique symbols in fallback data', () => {
      const sp500Symbols = sp500StocksFallback.map(s => s.symbol);
      const nasdaqSymbols = nasdaq100StocksFallback.map(s => s.symbol);
      
      const sp500Unique = new Set(sp500Symbols);
      const nasdaqUnique = new Set(nasdaqSymbols);
      
      expect(sp500Unique.size).toBe(sp500Symbols.length);
      expect(nasdaqUnique.size).toBe(nasdaqSymbols.length);
    });
  });
}); 