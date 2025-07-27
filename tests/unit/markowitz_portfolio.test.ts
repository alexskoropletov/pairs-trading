import fs from 'fs-extra';
import path from 'path';
import { StockData, Portfolio, EfficientFrontierPoint } from '../../src/types';
import { TEST_DIR } from '../setup';

// Мокаем fs-extra
jest.mock('fs-extra');

// Мокаем stock модуль
jest.mock('../../src/stock', () => ({
  stockSymbols: ['AAPL', 'MSFT', 'GOOGL']
}));

describe('Markowitz Portfolio Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Portfolio Optimization', () => {
    it('should calculate portfolio risk correctly', () => {
      // Создаем простую ковариационную матрицу
      const covarianceMatrix = [
        [0.04, 0.02, 0.01],
        [0.02, 0.09, 0.03],
        [0.01, 0.03, 0.16]
      ];
      
      const weights = [0.4, 0.3, 0.3];
      
      // Ожидаемый риск: sqrt(w' * Σ * w)
      const expectedRisk = Math.sqrt(
        weights[0] * weights[0] * covarianceMatrix[0][0] +
        weights[1] * weights[1] * covarianceMatrix[1][1] +
        weights[2] * weights[2] * covarianceMatrix[2][2] +
        2 * weights[0] * weights[1] * covarianceMatrix[0][1] +
        2 * weights[0] * weights[2] * covarianceMatrix[0][2] +
        2 * weights[1] * weights[2] * covarianceMatrix[1][2]
      );
      
      // Импортируем функцию из модуля
      const { calculatePortfolioRisk } = require('../../src/markowitz_portfolio');
      
      const result = calculatePortfolioRisk(weights, covarianceMatrix);
      
      expect(result).toBeCloseTo(expectedRisk, 4);
    });

    it('should calculate portfolio return correctly', () => {
      const weights = [0.4, 0.3, 0.3];
      const expectedReturns = [0.08, 0.12, 0.15];
      
      // Ожидаемая доходность: w' * μ
      const expectedReturn = 
        weights[0] * expectedReturns[0] +
        weights[1] * expectedReturns[1] +
        weights[2] * expectedReturns[2];
      
      // Импортируем функцию из модуля
      const { calculatePortfolioReturn } = require('../../src/markowitz_portfolio');
      
      const result = calculatePortfolioReturn(weights, expectedReturns);
      
      expect(result).toBeCloseTo(expectedReturn, 4);
    });
  });

  describe('Data Validation', () => {
    it('should validate covariance matrix structure', () => {
      const validMatrix = [
        [0.04, 0.02, 0.01],
        [0.02, 0.09, 0.03],
        [0.01, 0.03, 0.16]
      ];
      
      // Проверяем, что матрица квадратная
      expect(validMatrix.length).toBe(validMatrix[0].length);
      
      // Проверяем, что диагональные элементы положительные
      validMatrix.forEach((row, i) => {
        expect(row[i]).toBeGreaterThan(0);
      });
    });

    it('should validate weights sum to 1', () => {
      const weights = [0.4, 0.3, 0.3];
      const sum = weights.reduce((a, b) => a + b, 0);
      
      expect(sum).toBeCloseTo(1, 4);
    });
  });

  describe('Efficient Frontier', () => {
    it('should generate efficient frontier points', () => {
      const covarianceMatrix = [
        [0.04, 0.02],
        [0.02, 0.09]
      ];
      
      const expectedReturns = [0.08, 0.12];
      
      // Импортируем функцию из модуля
      const { generateEfficientFrontier } = require('../../src/markowitz_portfolio');
      
      const frontier = generateEfficientFrontier(covarianceMatrix, expectedReturns, 5);
      
      expect(frontier).toHaveLength(5);
      frontier.forEach(point => {
        expect(point).toHaveProperty('return');
        expect(point).toHaveProperty('risk');
        expect(point).toHaveProperty('weights');
        expect(point.weights).toHaveLength(2);
        expect(point.risk).toBeGreaterThan(0);
      });
    });

    it('should have increasing risk with increasing return', () => {
      const covarianceMatrix = [
        [0.04, 0.02],
        [0.02, 0.09]
      ];
      
      const expectedReturns = [0.08, 0.12];
      
      // Импортируем функцию из модуля
      const { generateEfficientFrontier } = require('../../src/markowitz_portfolio');
      
      const frontier = generateEfficientFrontier(covarianceMatrix, expectedReturns, 3);
      
      // Проверяем, что риск увеличивается с доходностью
      for (let i = 1; i < frontier.length; i++) {
        expect(frontier[i].return).toBeGreaterThanOrEqual(frontier[i-1].return);
        expect(frontier[i].risk).toBeGreaterThanOrEqual(frontier[i-1].risk);
      }
    });
  });

  describe('Portfolio Optimization Constraints', () => {
    it('should handle minimum risk optimization', () => {
      const covarianceMatrix = [
        [0.04, 0.02],
        [0.02, 0.09]
      ];
      
      const expectedReturns = [0.08, 0.12];
      
      // Импортируем функцию из модуля
      const { optimizePortfolioMinRisk } = require('../../src/markowitz_portfolio');
      
      const portfolio = optimizePortfolioMinRisk(covarianceMatrix, expectedReturns);
      
      expect(portfolio).toHaveProperty('weights');
      expect(portfolio).toHaveProperty('expectedReturn');
      expect(portfolio).toHaveProperty('risk');
      expect(portfolio).toHaveProperty('sharpeRatio');
      
      // Проверяем, что веса суммируются в 1
      const weightSum = portfolio.weights.reduce((a: number, b: number) => a + b, 0);
      expect(weightSum).toBeCloseTo(1, 4);
      
      // Проверяем, что риск положительный
      expect(portfolio.risk).toBeGreaterThan(0);
      
      // Проверяем, что коэффициент Шарпа вычислен
      expect(portfolio.sharpeRatio).toBeCloseTo(portfolio.expectedReturn / portfolio.risk, 4);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty covariance matrix', () => {
      const { calculateCovarianceMatrix } = require('../../src/markowitz_portfolio');
      
      expect(() => {
        calculateCovarianceMatrix([]);
      }).toThrow('Пустая матрица доходностей');
    });

    it('should handle invalid covariance matrix dimensions', () => {
      const invalidMatrix = [
        [0.04, 0.02, 0.01],
        [0.02, 0.09] // Неправильная размерность
      ];
      
      const { calculatePortfolioRisk } = require('../../src/markowitz_portfolio');
      
      expect(() => {
        calculatePortfolioRisk([0.5, 0.5], invalidMatrix);
      }).toThrow();
    });
  });
}); 