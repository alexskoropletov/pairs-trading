import fs from 'fs-extra';
import path from 'path';
import { TEST_DIR, mockStockData } from '../setup';

describe('Markowitz Portfolio Integration E2E', () => {
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

  describe('Full Portfolio Optimization Workflow', () => {
    it('should complete full portfolio optimization', async () => {
      // Мокаем stock модуль
      jest.doMock('../../src/stock', () => ({
        stockSymbols: ['AAPL', 'MSFT', 'GOOGL']
      }));

      // Мокаем pairs_trading результаты
      const mockPairsAnalysis = {
        totalPairs: 3,
        sp500Pairs: 2,
        nasdaqPairs: 1,
        averageCorrelation: 0.75,
        maxCorrelation: 0.85,
        minCorrelation: 0.65,
        topPairs: [
          { asset1: 'AAPL', asset2: 'MSFT', correlation: 0.85, strategy: 'LONG_AAPL_SHORT_MSFT', index: 'S&P500' },
          { asset1: 'MSFT', asset2: 'GOOGL', correlation: 0.75, strategy: 'LONG_MSFT_SHORT_GOOGL', index: 'S&P500' }
        ]
      };

      await fs.writeJson(path.join(testStatsDir, 'pairs_analysis.json'), mockPairsAnalysis);

      // Импортируем после моков
      const markowitzPortfolio = require('../../src/markowitz_portfolio');

      // Запускаем оптимизацию
      await markowitzPortfolio.main();

      // Проверяем создание файлов результатов
      expect(await fs.pathExists(path.join(testStatsDir, 'markowitz_portfolio.csv'))).toBe(true);
      expect(await fs.pathExists(path.join(testStatsDir, 'efficient_frontier.csv'))).toBe(true);
      expect(await fs.pathExists(path.join(testStatsDir, 'portfolio_summary.json'))).toBe(true);
    });

    it('should use only tickers from pairs_trading', async () => {
      jest.doMock('../../src/stock', () => ({
        stockSymbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']
      }));

      // Создаем pairs_analysis.json только с некоторыми тикерами
      const mockPairsAnalysis = {
        totalPairs: 1,
        sp500Pairs: 1,
        nasdaqPairs: 0,
        averageCorrelation: 0.85,
        maxCorrelation: 0.85,
        minCorrelation: 0.85,
        topPairs: [
          { asset1: 'AAPL', asset2: 'MSFT', correlation: 0.85, strategy: 'LONG_AAPL_SHORT_MSFT', index: 'S&P500' }
        ]
      };

      await fs.writeJson(path.join(testStatsDir, 'pairs_analysis.json'), mockPairsAnalysis);

      const markowitzPortfolio = require('../../src/markowitz_portfolio');

      await markowitzPortfolio.main();

      // Проверяем, что в портфеле только тикеры из pairs_trading
      const portfolioCsv = await fs.readFile(path.join(testStatsDir, 'markowitz_portfolio.csv'), 'utf-8');
      const lines = portfolioCsv.split('\n');
      
      // Пропускаем заголовок
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const symbol = lines[i].split(',')[0];
          expect(['AAPL', 'MSFT']).toContain(symbol);
        }
      }
    });
  });

  describe('Portfolio Output Validation', () => {
    it('should create valid portfolio CSV file', async () => {
      jest.doMock('../../src/stock', () => ({
        stockSymbols: ['AAPL', 'MSFT']
      }));

      const mockPairsAnalysis = {
        totalPairs: 1,
        sp500Pairs: 1,
        nasdaqPairs: 0,
        averageCorrelation: 0.85,
        maxCorrelation: 0.85,
        minCorrelation: 0.85,
        topPairs: [
          { asset1: 'AAPL', asset2: 'MSFT', correlation: 0.85, strategy: 'LONG_AAPL_SHORT_MSFT', index: 'S&P500' }
        ]
      };

      await fs.writeJson(path.join(testStatsDir, 'pairs_analysis.json'), mockPairsAnalysis);

      const markowitzPortfolio = require('../../src/markowitz_portfolio');

      await markowitzPortfolio.main();

      const portfolioCsv = await fs.readFile(path.join(testStatsDir, 'markowitz_portfolio.csv'), 'utf-8');
      const lines = portfolioCsv.split('\n');

      expect(lines[0]).toBe('Symbol,Weight,Weight (%),Expected Return (%)');
      
      // Проверяем, что есть данные для каждого символа
      const dataLines = lines.slice(1).filter(line => line.trim());
      expect(dataLines.length).toBeGreaterThan(0);

      dataLines.forEach(line => {
        const [symbol, weight, weightPercent, expectedReturn] = line.split(',');
        expect(['AAPL', 'MSFT']).toContain(symbol);
        expect(parseFloat(weight)).toBeGreaterThanOrEqual(0);
        expect(parseFloat(weight)).toBeLessThanOrEqual(1);
        expect(weightPercent).toContain('%');
        expect(expectedReturn).toContain('%');
      });
    });

    it('should create valid efficient frontier CSV', async () => {
      jest.doMock('../../src/stock', () => ({
        stockSymbols: ['AAPL', 'MSFT']
      }));

      const mockPairsAnalysis = {
        totalPairs: 1,
        sp500Pairs: 1,
        nasdaqPairs: 0,
        averageCorrelation: 0.85,
        maxCorrelation: 0.85,
        minCorrelation: 0.85,
        topPairs: [
          { asset1: 'AAPL', asset2: 'MSFT', correlation: 0.85, strategy: 'LONG_AAPL_SHORT_MSFT', index: 'S&P500' }
        ]
      };

      await fs.writeJson(path.join(testStatsDir, 'pairs_analysis.json'), mockPairsAnalysis);

      const markowitzPortfolio = require('../../src/markowitz_portfolio');

      await markowitzPortfolio.main();

      const frontierCsv = await fs.readFile(path.join(testStatsDir, 'efficient_frontier.csv'), 'utf-8');
      const lines = frontierCsv.split('\n');

      expect(lines[0]).toBe('Point,Return (%),Risk (%),Sharpe Ratio');
      
      const dataLines = lines.slice(1).filter(line => line.trim());
      expect(dataLines.length).toBeGreaterThan(0);

      dataLines.forEach(line => {
        const [point, returnPercent, riskPercent, sharpeRatio] = line.split(',');
        expect(parseInt(point)).toBeGreaterThan(0);
        expect(returnPercent).toContain('%');
        expect(riskPercent).toContain('%');
        expect(parseFloat(sharpeRatio)).toBeGreaterThan(0);
      });
    });

    it('should create valid portfolio summary JSON', async () => {
      jest.doMock('../../src/stock', () => ({
        stockSymbols: ['AAPL', 'MSFT']
      }));

      const mockPairsAnalysis = {
        totalPairs: 1,
        sp500Pairs: 1,
        nasdaqPairs: 0,
        averageCorrelation: 0.85,
        maxCorrelation: 0.85,
        minCorrelation: 0.85,
        topPairs: [
          { asset1: 'AAPL', asset2: 'MSFT', correlation: 0.85, strategy: 'LONG_AAPL_SHORT_MSFT', index: 'S&P500' }
        ]
      };

      await fs.writeJson(path.join(testStatsDir, 'pairs_analysis.json'), mockPairsAnalysis);

      const markowitzPortfolio = require('../../src/markowitz_portfolio');

      await markowitzPortfolio.main();

      const summaryJson = await fs.readFile(path.join(testStatsDir, 'portfolio_summary.json'), 'utf-8');
      const summary = JSON.parse(summaryJson);

      expect(summary).toHaveProperty('totalAssets');
      expect(summary).toHaveProperty('portfolioReturn');
      expect(summary).toHaveProperty('portfolioRisk');
      expect(summary).toHaveProperty('sharpeRatio');
      expect(summary).toHaveProperty('weights');
      expect(summary).toHaveProperty('symbols');
      expect(summary).toHaveProperty('efficientFrontier');
      expect(summary).toHaveProperty('date');

      expect(summary.totalAssets).toBeGreaterThan(0);
      expect(summary.portfolioRisk).toBeGreaterThan(0);
      expect(summary.weights).toHaveLength(summary.totalAssets);
      expect(summary.symbols).toHaveLength(summary.totalAssets);
      expect(summary.efficientFrontier).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing pairs_analysis.json gracefully', async () => {
      jest.doMock('../../src/stock', () => ({
        stockSymbols: ['AAPL', 'MSFT']
      }));

      const markowitzPortfolio = require('../../src/markowitz_portfolio');

      // Должен использовать все доступные тикеры как fallback
      await markowitzPortfolio.main();

      expect(await fs.pathExists(path.join(testStatsDir, 'markowitz_portfolio.csv'))).toBe(true);
    });

    it('should handle insufficient data for optimization', async () => {
      jest.doMock('../../src/stock', () => ({
        stockSymbols: ['AAPL'] // Только один тикер
      }));

      const mockPairsAnalysis = {
        totalPairs: 0,
        sp500Pairs: 0,
        nasdaqPairs: 0,
        averageCorrelation: 0,
        maxCorrelation: 0,
        minCorrelation: 0,
        topPairs: []
      };

      await fs.writeJson(path.join(testStatsDir, 'pairs_analysis.json'), mockPairsAnalysis);

      const markowitzPortfolio = require('../../src/markowitz_portfolio');

      // Должен обработать недостаток данных
      await expect(markowitzPortfolio.main()).rejects.toThrow();
    });

    it('should handle invalid CSV data', async () => {
      // Создаем невалидный CSV файл
      const invalidCsv = 'Invalid,CSV,Data\n1,2,3';
      await fs.writeFile(path.join(testStatsDir, 'AAPL.csv'), invalidCsv);

      jest.doMock('../../src/stock', () => ({
        stockSymbols: ['AAPL']
      }));

      const mockPairsAnalysis = {
        totalPairs: 1,
        sp500Pairs: 1,
        nasdaqPairs: 0,
        averageCorrelation: 0.85,
        maxCorrelation: 0.85,
        minCorrelation: 0.85,
        topPairs: [
          { asset1: 'AAPL', asset2: 'MSFT', correlation: 0.85, strategy: 'LONG_AAPL_SHORT_MSFT', index: 'S&P500' }
        ]
      };

      await fs.writeJson(path.join(testStatsDir, 'pairs_analysis.json'), mockPairsAnalysis);

      const markowitzPortfolio = require('../../src/markowitz_portfolio');

      // Должен обработать невалидные данные
      await expect(markowitzPortfolio.main()).rejects.toThrow();
    });
  });
}); 