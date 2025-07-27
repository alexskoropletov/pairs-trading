// Типы для данных акций
export interface StockData {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
}

export interface StockInfo {
  symbol: string;
  name: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  peRatio?: number;
  dividendYield?: number;
  beta?: number;
}

// Типы для технического анализа
export interface TechnicalIndicators {
  sma_20?: number;
  sma_50?: number;
  sma_200?: number;
  rsi?: number;
  macd?: number;
  macd_signal?: number;
  bollinger_upper?: number;
  bollinger_lower?: number;
  volume_sma?: number;
}

// Типы для портфеля
export interface Portfolio {
  weights: number[];
  expectedReturn: number;
  risk: number;
  sharpeRatio: number;
}

export interface EfficientFrontierPoint {
  return: number;
  risk: number;
  weights: number[];
}

export interface PortfolioSummary {
  totalAssets: number;
  portfolioReturn: number;
  portfolioRisk: number;
  sharpeRatio: number;
  weights: number[];
  symbols: string[];
  efficientFrontier: EfficientFrontierPoint[];
  date: string;
}

// Типы для Yahoo Finance API
export interface YahooFinanceResponse {
  chart: {
    result: Array<{
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: number[];
          high: number[];
          low: number[];
          close: number[];
          volume: number[];
        }>;
      };
    }>;
  };
}

// Типы для CSV данных
export interface CSVRow {
  [key: string]: number | string;
}

// Функция для преобразования CSVRow в StockData
export function csvRowToStockData(row: CSVRow): StockData {
  return {
    Date: String(row.Date || ''),
    Open: Number(row.Open) || 0,
    High: Number(row.High) || 0,
    Low: Number(row.Low) || 0,
    Close: Number(row.Close) || 0,
    Volume: Number(row.Volume) || 0
  };
}

// Типы для статистики
export interface AssetStats {
  symbol: string;
  prices: number[];
  returns: number[];
  avgReturn: number;
  mean: number;
  stdDev: number;
  variance: number;
}

// Типы для парного трейдинга
export interface CorrelationPair {
  asset1: string;
  asset2: string;
  correlation: number;
  longAsset: string;
  shortAsset: string;
  longProspectivity: number;
  shortProspectivity: number;
  volatility1: number;
  volatility2: number;
  avgReturn1: number;
  avgReturn2: number;
  strategy: string;
  index?: string; // Добавляем поле для индекса
}

export interface PairsTradingAnalysis {
  totalPairs: number;
  sp500Pairs?: number; // Добавляем поле для количества S&P500 пар
  nasdaqPairs?: number; // Добавляем поле для количества NASDAQ пар
  averageCorrelation: number;
  maxCorrelation: number;
  minCorrelation: number;
  topPairs: {
    asset1: string;
    asset2: string;
    correlation: number;
    strategy: string;
    index?: string; // Добавляем поле для индекса
  }[];
} 