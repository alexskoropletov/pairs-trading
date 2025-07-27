import fs from 'fs-extra';
import path from 'path';
import { CorrelationPair } from '../../src/types';
import { TEST_DIR } from '../setup';

// Мокаем fs-extra
jest.mock('fs-extra');

// Мокаем stock модуль
jest.mock('../../src/stock', () => ({
  stockSymbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'],
  sp500StocksFallback: [
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' }
  ],
  nasdaq100StocksFallback: [
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary' }
  ]
}));

// Импортируем функции после моков
import { 
  calculateReturns, 
  calculateCorrelation, 
  calculateVolatility,
  calculateAverageReturn,
  assessProspectivity,
  separateTickersByIndex
} from '../../src/pairs_trading';

describe('Pairs Trading Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateReturns', () => {
    it('should calculate returns correctly', () => {
      const prices = [100, 102, 98, 105, 103];
      const expectedReturns = [0.02, -0.0392, 0.0714, -0.0190];
      
      const result = calculateReturns(prices);
      
      expect(result).toHaveLength(4);
      result.forEach((ret, index) => {
        expect(ret).toBeCloseTo(expectedReturns[index], 4);
      });
    });

    it('should handle empty array', () => {
      const result = calculateReturns([]);
      expect(result).toEqual([]);
    });

    it('should handle single price', () => {
      const result = calculateReturns([100]);
      expect(result).toEqual([]);
    });
  });

  describe('calculateCorrelation', () => {
    it('should calculate positive correlation correctly', () => {
      const returns1 = [1, 2, 3, 4, 5];
      const returns2 = [2, 4, 6, 8, 10];
      
      const result = calculateCorrelation(returns1, returns2);
      
      expect(result).toBeCloseTo(1, 4);
    });

    it('should calculate negative correlation correctly', () => {
      const returns1 = [1, 2, 3, 4, 5];
      const returns2 = [5, 4, 3, 2, 1];
      
      const result = calculateCorrelation(returns1, returns2);
      
      expect(result).toBeCloseTo(-1, 4);
    });

    it('should calculate zero correlation correctly', () => {
      const returns1 = [1, 2, 3, 4, 5];
      const returns2 = [1, 1, 1, 1, 1];
      
      const result = calculateCorrelation(returns1, returns2);
      
      expect(result).toBeCloseTo(0, 4);
    });

    it('should handle arrays of different lengths', () => {
      const returns1 = [1, 2, 3, 4, 5];
      const returns2 = [1, 2, 3];
      
      const result = calculateCorrelation(returns1, returns2);
      
      expect(result).toBeCloseTo(1, 4); // Perfect correlation for first 3 elements
    });

    it('should handle zero variance', () => {
      const returns1 = [1, 1, 1, 1, 1];
      const returns2 = [1, 1, 1, 1, 1];
      
      const result = calculateCorrelation(returns1, returns2);
      
      expect(result).toBe(0);
    });
  });

  describe('calculateVolatility', () => {
    it('should calculate volatility correctly', () => {
      const returns = [0.01, -0.02, 0.03, -0.01, 0.02];
      
      const result = calculateVolatility(returns);
      
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });

    it('should handle constant returns', () => {
      const returns = [0.01, 0.01, 0.01, 0.01, 0.01];
      
      const result = calculateVolatility(returns);
      
      expect(result).toBeCloseTo(0, 4);
    });

    it('should handle empty array', () => {
      const result = calculateVolatility([]);
      expect(result).toBeNaN();
    });
  });

  describe('calculateAverageReturn', () => {
    it('should calculate average return correctly', () => {
      const returns = [0.01, 0.02, -0.01, 0.03, 0.01];
      
      const result = calculateAverageReturn(returns);
      
      expect(result).toBeCloseTo(0.012, 4);
    });

    it('should handle empty array', () => {
      const result = calculateAverageReturn([]);
      expect(result).toBeNaN();
    });
  });

  describe('assessProspectivity', () => {
    it('should calculate prospectivity correctly', () => {
      const returns = [0.01, 0.02, 0.01, 0.03, 0.02];
      const volatility = 0.015;
      
      const result = assessProspectivity(returns, volatility);
      
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });

    it('should handle zero volatility', () => {
      const returns = [0.01, 0.01, 0.01, 0.01, 0.01];
      const volatility = 0;
      
      const result = assessProspectivity(returns, volatility);
      
      expect(result).toBe(0);
    });
  });

  describe('separateTickersByIndex', () => {
    it('should separate tickers by index correctly', () => {
      const result = separateTickersByIndex();
      
      expect(result).toHaveProperty('sp500');
      expect(result).toHaveProperty('nasdaq');
      expect(Array.isArray(result.sp500)).toBe(true);
      expect(Array.isArray(result.nasdaq)).toBe(true);
    });

    it('should filter available symbols', () => {
      const result = separateTickersByIndex();
      
      // Проверяем, что все символы в sp500 и nasdaq присутствуют в stockSymbols
      result.sp500.forEach(symbol => {
        expect(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']).toContain(symbol);
      });
      
      result.nasdaq.forEach(symbol => {
        expect(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']).toContain(symbol);
      });
    });
  });

  describe('Validation checks', () => {
    it('should validate correlation less than 1', () => {
      const returns1 = [1, 2, 3, 4, 5];
      const returns2 = [1, 2, 3, 4, 5];
      
      const correlation = calculateCorrelation(returns1, returns2);
      
      expect(correlation).toBeLessThanOrEqual(1);
    });

    it('should validate correlation greater than -1', () => {
      const returns1 = [1, 2, 3, 4, 5];
      const returns2 = [5, 4, 3, 2, 1];
      
      const correlation = calculateCorrelation(returns1, returns2);
      
      expect(correlation).toBeGreaterThanOrEqual(-1);
    });

    it('should validate volatility is non-negative', () => {
      const returns = [0.01, 0.02, 0.01, 0.03, 0.02];
      
      const volatility = calculateVolatility(returns);
      
      expect(volatility).toBeGreaterThanOrEqual(0);
    });
  });
}); 