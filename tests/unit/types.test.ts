import { StockData, CSVRow, csvRowToStockData, CorrelationPair, PairsTradingAnalysis } from '../../src/types';

describe('Types Module', () => {
  describe('csvRowToStockData', () => {
    it('should convert CSV row to StockData correctly', () => {
      const csvRow: CSVRow = {
        Date: '2024-01-01',
        Open: 100.5,
        High: 105.2,
        Low: 98.1,
        Close: 102.8,
        Volume: 1000000
      };

      const result = csvRowToStockData(csvRow);

      expect(result).toEqual({
        Date: '2024-01-01',
        Open: 100.5,
        High: 105.2,
        Low: 98.1,
        Close: 102.8,
        Volume: 1000000
      });
    });

    it('should handle missing values with defaults', () => {
      const csvRow: CSVRow = {
        Date: '2024-01-01',
        Open: 100.5,
        High: 105.2,
        Low: 98.1,
        Close: 102.8
        // Volume is missing
      };

      const result = csvRowToStockData(csvRow);

      expect(result).toEqual({
        Date: '2024-01-01',
        Open: 100.5,
        High: 105.2,
        Low: 98.1,
        Close: 102.8,
        Volume: 0
      });
    });

    it('should handle string values and convert to numbers', () => {
      const csvRow: CSVRow = {
        Date: '2024-01-01',
        Open: '100.5',
        High: '105.2',
        Low: '98.1',
        Close: '102.8',
        Volume: '1000000'
      };

      const result = csvRowToStockData(csvRow);

      expect(result).toEqual({
        Date: '2024-01-01',
        Open: 100.5,
        High: 105.2,
        Low: 98.1,
        Close: 102.8,
        Volume: 1000000
      });
    });
  });

  describe('CorrelationPair interface', () => {
    it('should have correct structure', () => {
      const pair: CorrelationPair = {
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
      };

      expect(pair.asset1).toBe('AAPL');
      expect(pair.asset2).toBe('MSFT');
      expect(pair.correlation).toBe(0.85);
      expect(pair.index).toBe('S&P500');
    });
  });

  describe('PairsTradingAnalysis interface', () => {
    it('should have correct structure', () => {
      const analysis: PairsTradingAnalysis = {
        totalPairs: 100,
        sp500Pairs: 60,
        nasdaqPairs: 40,
        averageCorrelation: 0.75,
        maxCorrelation: 0.95,
        minCorrelation: 0.30,
        topPairs: [
          {
            asset1: 'AAPL',
            asset2: 'MSFT',
            correlation: 0.85,
            strategy: 'LONG_AAPL_SHORT_MSFT',
            index: 'S&P500'
          }
        ]
      };

      expect(analysis.totalPairs).toBe(100);
      expect(analysis.sp500Pairs).toBe(60);
      expect(analysis.nasdaqPairs).toBe(40);
      expect(analysis.averageCorrelation).toBe(0.75);
      expect(analysis.topPairs).toHaveLength(1);
    });
  });

  describe('StockData interface', () => {
    it('should have correct structure', () => {
      const stockData: StockData = {
        Date: '2024-01-01',
        Open: 100.5,
        High: 105.2,
        Low: 98.1,
        Close: 102.8,
        Volume: 1000000
      };

      expect(stockData.Date).toBe('2024-01-01');
      expect(stockData.Open).toBe(100.5);
      expect(stockData.High).toBe(105.2);
      expect(stockData.Low).toBe(98.1);
      expect(stockData.Close).toBe(102.8);
      expect(stockData.Volume).toBe(1000000);
    });
  });
}); 