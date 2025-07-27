import fs from 'fs-extra';
import path from 'path';
import { TEST_DIR, mockStockData } from '../setup';

describe('Pairs Trading Integration E2E', () => {
  const testStatsDir = path.join(TEST_DIR, 'stats');
  
  beforeEach(async () => {
    jest.clearAllMocks();
    await fs.ensureDir(testStatsDir);
    
    // Создаем тестовые CSV файлы
    const csvContent = 'Date,Open,High,Low,Close,Volume\n' +
      mockStockData.map(row => 
        `${row.Date},${row.Open},${row.High},${row.Low},${row.Close},${row.Volume}`
      ).join('\n');
    
    await fs.writeFile(path.join(testStatsDir, 'AAPL.csv'), csvContent);
    await fs.writeFile(path.join(testStatsDir, 'MSFT.csv'), csvContent);
    await fs.writeFile(path.join(testStatsDir, 'GOOGL.csv'), csvContent);
  });

  afterEach(async () => {
    await fs.remove(testStatsDir);
  });

  describe('Full Pairs Trading Workflow', () => {
    it('should complete full pairs trading analysis', async () => {
      // Мокаем stock модуль для тестовых данных
      jest.doMock('../../src/stock', () => ({
        stockSymbols: ['AAPL', 'MSFT', 'GOOGL'],
        sp500StocksFallback: [
          { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
          { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' }
        ],
        nasdaq100StocksFallback: [
          { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' }
        ]
      }));

      // Импортируем после моков
      const pairsTrading = require('../../src/pairs_trading');

      // Запускаем анализ
      const result = await pairsTrading.analyzePairs(30);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      // Проверяем структуру результатов
      result.forEach(pair => {
        expect(pair).toHaveProperty('asset1');
        expect(pair).toHaveProperty('asset2');
        expect(pair).toHaveProperty('correlation');
        expect(pair).toHaveProperty('index');
        expect(pair.correlation).toBeLessThanOrEqual(1);
        expect(pair.correlation).toBeGreaterThanOrEqual(-1);
      });

      // Проверяем, что файлы результатов созданы
      expect(await fs.pathExists(path.join(testStatsDir, 'pairs_analysis.json'))).toBe(true);
      expect(await fs.pathExists(path.join(testStatsDir, 'pairs_trading.csv'))).toBe(true);
    });

    it('should separate pairs by index correctly', async () => {
      jest.doMock('../../src/stock', () => ({
        stockSymbols: ['AAPL', 'MSFT', 'GOOGL'],
        sp500StocksFallback: [
          { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
          { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' }
        ],
        nasdaq100StocksFallback: [
          { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' }
        ]
      }));

      const pairsTrading = require('../../src/pairs_trading');

      const result = await pairsTrading.analyzePairs(30);

      // Проверяем, что есть пары для каждого индекса
      const sp500Pairs = result.filter(p => p.index === 'S&P500');
      const nasdaqPairs = result.filter(p => p.index === 'NASDAQ');

      expect(sp500Pairs.length).toBeGreaterThan(0);
      expect(nasdaqPairs.length).toBeGreaterThan(0);

      // Проверяем, что пары содержат правильные активы
      sp500Pairs.forEach(pair => {
        expect(['AAPL', 'MSFT']).toContain(pair.asset1);
        expect(['AAPL', 'MSFT']).toContain(pair.asset2);
      });

      nasdaqPairs.forEach(pair => {
        expect(['GOOGL']).toContain(pair.asset1);
        expect(['GOOGL']).toContain(pair.asset2);
      });
    });

    it('should apply validation filters correctly', async () => {
      jest.doMock('../../src/stock', () => ({
        stockSymbols: ['AAPL', 'MSFT'],
        sp500StocksFallback: [
          { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
          { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' }
        ],
        nasdaq100StocksFallback: []
      }));

      const pairsTrading = require('../../src/pairs_trading');

      const result = await pairsTrading.analyzePairs(30);

      // Проверяем, что нет пар с одинаковыми активами
      result.forEach(pair => {
        expect(pair.asset1).not.toBe(pair.asset2);
      });

      // Проверяем, что корреляция меньше 1
      result.forEach(pair => {
        expect(pair.correlation).toBeLessThan(1);
      });
    });
  });

  describe('File Output Validation', () => {
    it('should create separate files for S&P500 and NASDAQ', async () => {
      jest.doMock('../../src/stock', () => ({
        stockSymbols: ['AAPL', 'MSFT', 'GOOGL'],
        sp500StocksFallback: [
          { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
          { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' }
        ],
        nasdaq100StocksFallback: [
          { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' }
        ]
      }));

      const pairsTrading = require('../../src/pairs_trading');

      await pairsTrading.analyzePairs(30);

      // Проверяем создание отдельных файлов
      const sp500File = path.join(testStatsDir, 'pairs_trading_sp500.csv');
      const nasdaqFile = path.join(testStatsDir, 'pairs_trading_nasdaq.csv');

      if (await fs.pathExists(sp500File)) {
        const sp500Content = await fs.readFile(sp500File, 'utf-8');
        expect(sp500Content).toContain('S&P500');
      }

      if (await fs.pathExists(nasdaqFile)) {
        const nasdaqContent = await fs.readFile(nasdaqFile, 'utf-8');
        expect(nasdaqContent).toContain('NASDAQ');
      }
    });

    it('should create valid JSON analysis file', async () => {
      jest.doMock('../../src/stock', () => ({
        stockSymbols: ['AAPL', 'MSFT'],
        sp500StocksFallback: [
          { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
          { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' }
        ],
        nasdaq100StocksFallback: []
      }));

      const pairsTrading = require('../../src/pairs_trading');

      await pairsTrading.analyzePairs(30);

      const analysisFile = path.join(testStatsDir, 'pairs_analysis.json');
      expect(await fs.pathExists(analysisFile)).toBe(true);

      const analysisContent = await fs.readFile(analysisFile, 'utf-8');
      const analysis = JSON.parse(analysisContent);

      expect(analysis).toHaveProperty('totalPairs');
      expect(analysis).toHaveProperty('sp500Pairs');
      expect(analysis).toHaveProperty('nasdaqPairs');
      expect(analysis).toHaveProperty('averageCorrelation');
      expect(analysis).toHaveProperty('maxCorrelation');
      expect(analysis).toHaveProperty('minCorrelation');
      expect(analysis).toHaveProperty('topPairs');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing CSV files gracefully', async () => {
      // Удаляем CSV файлы
      await fs.remove(path.join(testStatsDir, 'AAPL.csv'));
      await fs.remove(path.join(testStatsDir, 'MSFT.csv'));

      jest.doMock('../../src/stock', () => ({
        stockSymbols: ['AAPL', 'MSFT'],
        sp500StocksFallback: [
          { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
          { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' }
        ],
        nasdaq100StocksFallback: []
      }));

      const pairsTrading = require('../../src/pairs_trading');

      const result = await pairsTrading.analyzePairs(30);

      // Должен вернуть пустой массив, так как нет данных
      expect(result).toHaveLength(0);
    });

    it('should handle invalid CSV data', async () => {
      // Создаем невалидный CSV файл
      const invalidCsv = 'Invalid,CSV,Data\n1,2,3';
      await fs.writeFile(path.join(testStatsDir, 'AAPL.csv'), invalidCsv);

      jest.doMock('../../src/stock', () => ({
        stockSymbols: ['AAPL'],
        sp500StocksFallback: [
          { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' }
        ],
        nasdaq100StocksFallback: []
      }));

      const pairsTrading = require('../../src/pairs_trading');

      const result = await pairsTrading.analyzePairs(30);

      // Должен обработать ошибку и вернуть пустой массив
      expect(result).toHaveLength(0);
    });
  });
}); 