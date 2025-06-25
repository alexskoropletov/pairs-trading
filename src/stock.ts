import { StockInfo } from './types';

// Топ-10 криптовалют по капитализации
export const cryptocurrencies: StockInfo[] = [
  { symbol: "BTC-USD", name: "Bitcoin", sector: "Cryptocurrency" },
  { symbol: "ETH-USD", name: "Ethereum", sector: "Cryptocurrency" },
  { symbol: "USDT-USD", name: "Tether", sector: "Cryptocurrency" },
  { symbol: "XRP-USD", name: "XRP", sector: "Cryptocurrency" },
  { symbol: "BNB-USD", name: "Binance Coin", sector: "Cryptocurrency" },
  { symbol: "SOL-USD", name: "Solana", sector: "Cryptocurrency" },
  { symbol: "USDC-USD", name: "USD Coin", sector: "Cryptocurrency" },
  { symbol: "TRX-USD", name: "TRON", sector: "Cryptocurrency" },
  { symbol: "DOGE-USD", name: "Dogecoin", sector: "Cryptocurrency" },
  { symbol: "ADA-USD", name: "Cardano", sector: "Cryptocurrency" }
];

// Топ-20 компаний S&P500 по капитализации
export const sp500Stocks: StockInfo[] = [
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology" },
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology" },
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary" },
  { symbol: "GOOG", name: "Alphabet Inc. (Class C)", sector: "Technology" },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology" },
  { symbol: "AVGO", name: "Broadcom Inc.", sector: "Technology" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary" },
  { symbol: "BRK-B", name: "Berkshire Hathaway Inc. (Class B)", sector: "Financials" },
  { symbol: "WMT", name: "Walmart Inc.", sector: "Consumer Staples" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financials" },
  { symbol: "LLY", name: "Eli Lilly and Company", sector: "Healthcare" },
  { symbol: "V", name: "Visa Inc.", sector: "Financials" },
  { symbol: "ORCL", name: "Oracle Corporation", sector: "Technology" },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Communication Services" },
  { symbol: "MA", name: "Mastercard Incorporated", sector: "Financials" },
  { symbol: "XOM", name: "Exxon Mobil Corporation", sector: "Energy" },
  { symbol: "COST", name: "Costco Wholesale Corporation", sector: "Consumer Staples" },
  { symbol: "PG", name: "Procter & Gamble Company", sector: "Consumer Staples" },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare" }
];

// Все активы вместе
export const allAssets: StockInfo[] = [
  ...cryptocurrencies,
  ...sp500Stocks
];

// Только символы для обратной совместимости
export const stockSymbols: string[] = allAssets.map(asset => asset.symbol);

// Экспорт по умолчанию для обратной совместимости
export default stockSymbols; 