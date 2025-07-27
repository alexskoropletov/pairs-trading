import { StockInfo } from './types';
import fs from 'fs/promises';
import path from 'path';
import logger from './logger';

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
  { symbol: "ADA-USD", name: "Cardano", sector: "Cryptocurrency" },
  { symbol: "XLM-USD", name: "Stellar", sector: "Cryptocurrency" },
  { symbol: "DOT-USD", name: "Polkadot", sector: "Cryptocurrency" },
  { symbol: "LINK-USD", name: "Chainlink", sector: "Cryptocurrency" },
  { symbol: "XMR-USD", name: "Monero", sector: "Cryptocurrency" },
  { symbol: "XLM-USD", name: "Stellar", sector: "Cryptocurrency" },
];

// Полный список компаний S&P500 (fallback)
export const sp500StocksFallback: StockInfo[] = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology" },
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology" },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary" },
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology" },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology" },
  { symbol: "BRK-B", name: "Berkshire Hathaway Inc.", sector: "Financials" },
  { symbol: "LLY", name: "Eli Lilly and Company", sector: "Healthcare" },
  { symbol: "V", name: "Visa Inc.", sector: "Financials" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary" },
  { symbol: "UNH", name: "UnitedHealth Group Inc.", sector: "Healthcare" },
  { symbol: "XOM", name: "Exxon Mobil Corporation", sector: "Energy" },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financials" },
  { symbol: "PG", name: "Procter & Gamble Company", sector: "Consumer Staples" },
  { symbol: "MA", name: "Mastercard Incorporated", sector: "Financials" },
  { symbol: "HD", name: "Home Depot Inc.", sector: "Consumer Discretionary" },
  { symbol: "CVX", name: "Chevron Corporation", sector: "Energy" },
  { symbol: "AVGO", name: "Broadcom Inc.", sector: "Technology" },
  { symbol: "KO", name: "Coca-Cola Company", sector: "Consumer Staples" },
  { symbol: "PEP", name: "PepsiCo Inc.", sector: "Consumer Staples" },
  { symbol: "COST", name: "Costco Wholesale Corporation", sector: "Consumer Staples" },
  { symbol: "ABBV", name: "AbbVie Inc.", sector: "Healthcare" },
  { symbol: "TMO", name: "Thermo Fisher Scientific Inc.", sector: "Healthcare" },
  { symbol: "BAC", name: "Bank of America Corp.", sector: "Financials" },
  { symbol: "WMT", name: "Walmart Inc.", sector: "Consumer Staples" },
  { symbol: "MRK", name: "Merck & Co. Inc.", sector: "Healthcare" },
  { symbol: "PFE", name: "Pfizer Inc.", sector: "Healthcare" },
  { symbol: "ACN", name: "Accenture plc", sector: "Technology" },
  { symbol: "DHR", name: "Danaher Corporation", sector: "Healthcare" },
  { symbol: "VZ", name: "Verizon Communications Inc.", sector: "Communication Services" },
  { symbol: "ADBE", name: "Adobe Inc.", sector: "Technology" },
  { symbol: "CMCSA", name: "Comcast Corporation", sector: "Communication Services" },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Communication Services" },
  { symbol: "TXN", name: "Texas Instruments Inc.", sector: "Technology" },
  { symbol: "NEE", name: "NextEra Energy Inc.", sector: "Utilities" },
  { symbol: "PM", name: "Philip Morris International", sector: "Consumer Staples" },
  { symbol: "RTX", name: "Raytheon Technologies Corp.", sector: "Industrials" },
  { symbol: "HON", name: "Honeywell International Inc.", sector: "Industrials" },
  { symbol: "QCOM", name: "Qualcomm Incorporated", sector: "Technology" },
  { symbol: "LOW", name: "Lowe's Companies Inc.", sector: "Consumer Discretionary" },
  { symbol: "UPS", name: "United Parcel Service Inc.", sector: "Industrials" },
  { symbol: "INTU", name: "Intuit Inc.", sector: "Technology" },
  { symbol: "IBM", name: "International Business Machines Corp.", sector: "Technology" },
  { symbol: "MS", name: "Morgan Stanley", sector: "Financials" },
  { symbol: "SPGI", name: "S&P Global Inc.", sector: "Financials" },
  { symbol: "AMGN", name: "Amgen Inc.", sector: "Healthcare" },
  { symbol: "T", name: "AT&T Inc.", sector: "Communication Services" },
  { symbol: "SCHW", name: "Charles Schwab Corporation", sector: "Financials" },
  { symbol: "GS", name: "Goldman Sachs Group Inc.", sector: "Financials" },
  { symbol: "CAT", name: "Caterpillar Inc.", sector: "Industrials" },
  { symbol: "DE", name: "Deere & Company", sector: "Industrials" },
  { symbol: "AXP", name: "American Express Company", sector: "Financials" },
  { symbol: "GILD", name: "Gilead Sciences Inc.", sector: "Healthcare" },
  { symbol: "PLD", name: "Prologis Inc.", sector: "Real Estate" },
  { symbol: "ADI", name: "Analog Devices Inc.", sector: "Technology" },
  { symbol: "ISRG", name: "Intuitive Surgical Inc.", sector: "Healthcare" },
  { symbol: "VRTX", name: "Vertex Pharmaceuticals Inc.", sector: "Healthcare" },
  { symbol: "REGN", name: "Regeneron Pharmaceuticals Inc.", sector: "Healthcare" },
  { symbol: "TGT", name: "Target Corporation", sector: "Consumer Discretionary" },
  { symbol: "LMT", name: "Lockheed Martin Corporation", sector: "Industrials" },
  { symbol: "BKNG", name: "Booking Holdings Inc.", sector: "Consumer Discretionary" },
  { symbol: "TJX", name: "TJX Companies Inc.", sector: "Consumer Discretionary" },
  { symbol: "MDLZ", name: "Mondelez International Inc.", sector: "Consumer Staples" },
  { symbol: "CME", name: "CME Group Inc.", sector: "Financials" },
  { symbol: "SO", name: "Southern Company", sector: "Utilities" },
  { symbol: "DUK", name: "Duke Energy Corporation", sector: "Utilities" },
  { symbol: "NOC", name: "Northrop Grumman Corporation", sector: "Industrials" },
  { symbol: "ITW", name: "Illinois Tool Works Inc.", sector: "Industrials" },
  { symbol: "BDX", name: "Becton Dickinson and Company", sector: "Healthcare" },
  { symbol: "SYK", name: "Stryker Corporation", sector: "Healthcare" },
  { symbol: "EOG", name: "EOG Resources Inc.", sector: "Energy" },
  { symbol: "SLB", name: "Schlumberger Limited", sector: "Energy" },
  { symbol: "AON", name: "Aon plc", sector: "Financials" },
  { symbol: "ETN", name: "Eaton Corporation plc", sector: "Industrials" },
  { symbol: "MMC", name: "Marsh & McLennan Companies Inc.", sector: "Financials" },
  { symbol: "CI", name: "Cigna Corporation", sector: "Healthcare" },
  { symbol: "USB", name: "U.S. Bancorp", sector: "Financials" },
  { symbol: "PGR", name: "Progressive Corporation", sector: "Financials" },
  { symbol: "NSC", name: "Norfolk Southern Corporation", sector: "Industrials" },
  { symbol: "TRV", name: "Travelers Companies Inc.", sector: "Financials" },
  { symbol: "F", name: "Ford Motor Company", sector: "Consumer Discretionary" },
  { symbol: "GE", name: "General Electric Company", sector: "Industrials" },
  { symbol: "GM", name: "General Motors Company", sector: "Consumer Discretionary" },
  { symbol: "BA", name: "Boeing Company", sector: "Industrials" },
  { symbol: "DIS", name: "Walt Disney Company", sector: "Communication Services" },
  { symbol: "NKE", name: "Nike Inc.", sector: "Consumer Discretionary" },
  { symbol: "SBUX", name: "Starbucks Corporation", sector: "Consumer Discretionary" },
  { symbol: "MCD", name: "McDonald's Corporation", sector: "Consumer Discretionary" },
  { symbol: "YUM", name: "Yum! Brands Inc.", sector: "Consumer Discretionary" },
  { symbol: "CMG", name: "Chipotle Mexican Grill Inc.", sector: "Consumer Discretionary" },
  { symbol: "CHTR", name: "Charter Communications Inc.", sector: "Communication Services" },
  { symbol: "TMUS", name: "T-Mobile US Inc.", sector: "Communication Services" },
  { symbol: "ATVI", name: "Activision Blizzard Inc.", sector: "Communication Services" },
  { symbol: "EA", name: "Electronic Arts Inc.", sector: "Communication Services" },
  { symbol: "TTWO", name: "Take-Two Interactive Software Inc.", sector: "Communication Services" },
  { symbol: "ZNGA", name: "Zynga Inc.", sector: "Communication Services" },
  { symbol: "MTCH", name: "Match Group Inc.", sector: "Communication Services" },
  { symbol: "SNAP", name: "Snap Inc.", sector: "Communication Services" },
  { symbol: "TWTR", name: "Twitter Inc.", sector: "Communication Services" },
  { symbol: "ORCL", name: "Oracle Corporation", sector: "Technology" },
  { symbol: "CSCO", name: "Cisco Systems Inc.", sector: "Technology" },
  { symbol: "INTC", name: "Intel Corporation", sector: "Technology" },
  { symbol: "AMD", name: "Advanced Micro Devices Inc.", sector: "Technology" },
  { symbol: "CRM", name: "Salesforce Inc.", sector: "Technology" },
  { symbol: "NOW", name: "ServiceNow Inc.", sector: "Technology" },
  { symbol: "SNOW", name: "Snowflake Inc.", sector: "Technology" },
  { symbol: "ZM", name: "Zoom Video Communications Inc.", sector: "Technology" },
  { symbol: "SHOP", name: "Shopify Inc.", sector: "Technology" },
  { symbol: "SQ", name: "Square Inc.", sector: "Technology" },
  { symbol: "ROKU", name: "Roku Inc.", sector: "Communication Services" },
  { symbol: "SPOT", name: "Spotify Technology S.A.", sector: "Communication Services" },
  { symbol: "UBER", name: "Uber Technologies Inc.", sector: "Consumer Discretionary" },
  { symbol: "LYFT", name: "Lyft Inc.", sector: "Consumer Discretionary" },
  { symbol: "DASH", name: "DoorDash Inc.", sector: "Consumer Discretionary" },
  { symbol: "ABNB", name: "Airbnb Inc.", sector: "Consumer Discretionary" },
  { symbol: "PLTR", name: "Palantir Technologies Inc.", sector: "Technology" },
  { symbol: "COIN", name: "Coinbase Global Inc.", sector: "Financials" },
  { symbol: "HOOD", name: "Robinhood Markets Inc.", sector: "Financials" },
  { symbol: "RBLX", name: "Roblox Corporation", sector: "Communication Services" },
  { symbol: "PINS", name: "Pinterest Inc.", sector: "Communication Services" },
  { symbol: "SNAP", name: "Snap Inc.", sector: "Communication Services" },
  { symbol: "TWTR", name: "Twitter Inc.", sector: "Communication Services" },
  { symbol: "FB", name: "Meta Platforms Inc.", sector: "Technology" },
    { symbol: "GOOGL", name: "Alphabet Inc. (Class A)", sector: "Technology" }
];

// Полный список компаний NASDAQ-100 (fallback)
export const nasdaq100StocksFallback: StockInfo[] = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology" },
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology" },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary" },
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology" },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary" },
  { symbol: "AVGO", name: "Broadcom Inc.", sector: "Technology" },
  { symbol: "PEP", name: "PepsiCo Inc.", sector: "Consumer Staples" },
  { symbol: "COST", name: "Costco Wholesale Corporation", sector: "Consumer Staples" },
  { symbol: "ADBE", name: "Adobe Inc.", sector: "Technology" },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Communication Services" },
  { symbol: "INTC", name: "Intel Corporation", sector: "Technology" },
  { symbol: "AMD", name: "Advanced Micro Devices Inc.", sector: "Technology" },
  { symbol: "CSCO", name: "Cisco Systems Inc.", sector: "Technology" },
  { symbol: "TMUS", name: "T-Mobile US Inc.", sector: "Communication Services" },
  { symbol: "CMCSA", name: "Comcast Corporation", sector: "Communication Services" },
  { symbol: "QCOM", name: "Qualcomm Incorporated", sector: "Technology" },
  { symbol: "HON", name: "Honeywell International Inc.", sector: "Industrials" },
  { symbol: "ADP", name: "Automatic Data Processing Inc.", sector: "Technology" },
  { symbol: "GILD", name: "Gilead Sciences Inc.", sector: "Healthcare" },
  { symbol: "REGN", name: "Regeneron Pharmaceuticals Inc.", sector: "Healthcare" },
  { symbol: "VRTX", name: "Vertex Pharmaceuticals Inc.", sector: "Healthcare" },
  { symbol: "MDLZ", name: "Mondelez International Inc.", sector: "Consumer Staples" },
  { symbol: "BKNG", name: "Booking Holdings Inc.", sector: "Consumer Discretionary" },
  { symbol: "ADI", name: "Analog Devices Inc.", sector: "Technology" },
  { symbol: "KLAC", name: "KLA Corporation", sector: "Technology" },
  { symbol: "LRCX", name: "Lam Research Corporation", sector: "Technology" },
  { symbol: "MU", name: "Micron Technology Inc.", sector: "Technology" },
  { symbol: "AMAT", name: "Applied Materials Inc.", sector: "Technology" },
  { symbol: "ASML", name: "ASML Holding N.V.", sector: "Technology" },
  { symbol: "SNPS", name: "Synopsys Inc.", sector: "Technology" },
  { symbol: "CDNS", name: "Cadence Design Systems Inc.", sector: "Technology" },
  { symbol: "MELI", name: "MercadoLibre Inc.", sector: "Consumer Discretionary" },
  { symbol: "JD", name: "JD.com Inc.", sector: "Consumer Discretionary" },
  { symbol: "PDD", name: "Pinduoduo Inc.", sector: "Consumer Discretionary" },
  { symbol: "BIDU", name: "Baidu Inc.", sector: "Communication Services" },
  { symbol: "NTES", name: "NetEase Inc.", sector: "Communication Services" },
  { symbol: "TCOM", name: "Trip.com Group Limited", sector: "Consumer Discretionary" },
  { symbol: "BABA", name: "Alibaba Group Holding Limited", sector: "Consumer Discretionary" },
  { symbol: "CRM", name: "Salesforce Inc.", sector: "Technology" },
  { symbol: "NOW", name: "ServiceNow Inc.", sector: "Technology" },
  { symbol: "SNOW", name: "Snowflake Inc.", sector: "Technology" },
  { symbol: "ZM", name: "Zoom Video Communications Inc.", sector: "Technology" },
  { symbol: "SHOP", name: "Shopify Inc.", sector: "Technology" },
  { symbol: "SQ", name: "Block Inc.", sector: "Technology" },
  { symbol: "ROKU", name: "Roku Inc.", sector: "Communication Services" },
  { symbol: "SPOT", name: "Spotify Technology S.A.", sector: "Communication Services" },
  { symbol: "UBER", name: "Uber Technologies Inc.", sector: "Consumer Discretionary" },
  { symbol: "LYFT", name: "Lyft Inc.", sector: "Consumer Discretionary" },
  { symbol: "DASH", name: "DoorDash Inc.", sector: "Consumer Discretionary" },
  { symbol: "ABNB", name: "Airbnb Inc.", sector: "Consumer Discretionary" },
  { symbol: "PLTR", name: "Palantir Technologies Inc.", sector: "Technology" },
  { symbol: "COIN", name: "Coinbase Global Inc.", sector: "Financials" },
  { symbol: "HOOD", name: "Robinhood Markets Inc.", sector: "Financials" },
  { symbol: "RBLX", name: "Roblox Corporation", sector: "Communication Services" },
  { symbol: "PINS", name: "Pinterest Inc.", sector: "Communication Services" },
  { symbol: "SNAP", name: "Snap Inc.", sector: "Communication Services" },
  { symbol: "TWTR", name: "Twitter Inc.", sector: "Communication Services" },
  { symbol: "FB", name: "Meta Platforms Inc.", sector: "Technology" },
  { symbol: "GOOGL", name: "Alphabet Inc. (Class A)", sector: "Technology" },
  { symbol: "ORCL", name: "Oracle Corporation", sector: "Technology" },
  { symbol: "TXN", name: "Texas Instruments Inc.", sector: "Technology" },
  { symbol: "INTU", name: "Intuit Inc.", sector: "Technology" },
  { symbol: "IBM", name: "International Business Machines Corp.", sector: "Technology" },
  { symbol: "ISRG", name: "Intuitive Surgical Inc.", sector: "Healthcare" },
  { symbol: "ILMN", name: "Illumina Inc.", sector: "Healthcare" },
  { symbol: "MRNA", name: "Moderna Inc.", sector: "Healthcare" },
  { symbol: "BIIB", name: "Biogen Inc.", sector: "Healthcare" },
  { symbol: "ALGN", name: "Align Technology Inc.", sector: "Healthcare" },
  { symbol: "DXCM", name: "DexCom Inc.", sector: "Healthcare" },
  { symbol: "IDXX", name: "IDEXX Laboratories Inc.", sector: "Healthcare" },
  { symbol: "WDAY", name: "Workday Inc.", sector: "Technology" },
  { symbol: "ADSK", name: "Autodesk Inc.", sector: "Technology" },
  { symbol: "ANSS", name: "ANSYS Inc.", sector: "Technology" },
  { symbol: "CTSH", name: "Cognizant Technology Solutions Corp.", sector: "Technology" },
  { symbol: "CTAS", name: "Cintas Corporation", sector: "Industrials" },
  { symbol: "FAST", name: "Fastenal Company", sector: "Industrials" },
  { symbol: "PAYX", name: "Paychex Inc.", sector: "Technology" },
  { symbol: "CHTR", name: "Charter Communications Inc.", sector: "Communication Services" },
  { symbol: "CMCSA", name: "Comcast Corporation", sector: "Communication Services" },
  { symbol: "ATVI", name: "Activision Blizzard Inc.", sector: "Communication Services" },
  { symbol: "EA", name: "Electronic Arts Inc.", sector: "Communication Services" },
  { symbol: "TTWO", name: "Take-Two Interactive Software Inc.", sector: "Communication Services" },
  { symbol: "ZNGA", name: "Zynga Inc.", sector: "Communication Services" },
  { symbol: "MTCH", name: "Match Group Inc.", sector: "Communication Services" },
  { symbol: "MAR", name: "Marriott International Inc.", sector: "Consumer Discretionary" },
  { symbol: "HLT", name: "Hilton Worldwide Holdings Inc.", sector: "Consumer Discretionary" },
  { symbol: "EXPE", name: "Expedia Group Inc.", sector: "Consumer Discretionary" },
  { symbol: "TRIP", name: "TripAdvisor Inc.", sector: "Consumer Discretionary" },
  { symbol: "YELP", name: "Yelp Inc.", sector: "Communication Services" },
  { symbol: "GRMN", name: "Garmin Ltd.", sector: "Consumer Discretionary" },
  { symbol: "CTRP", name: "Ctrip.com International Ltd.", sector: "Consumer Discretionary" },
  { symbol: "WYNN", name: "Wynn Resorts Limited", sector: "Consumer Discretionary" },
  { symbol: "LVS", name: "Las Vegas Sands Corp.", sector: "Consumer Discretionary" },
  { symbol: "MGM", name: "MGM Resorts International", sector: "Consumer Discretionary" },
  { symbol: "CZR", name: "Caesars Entertainment Inc.", sector: "Consumer Discretionary" },
  { symbol: "CCL", name: "Carnival Corporation", sector: "Consumer Discretionary" },
  { symbol: "RCL", name: "Royal Caribbean Cruises Ltd.", sector: "Consumer Discretionary" },
  { symbol: "NCLH", name: "Norwegian Cruise Line Holdings Ltd.", sector: "Consumer Discretionary" },
  { symbol: "UAL", name: "United Airlines Holdings Inc.", sector: "Industrials" },
  { symbol: "DAL", name: "Delta Air Lines Inc.", sector: "Industrials" },
  { symbol: "AAL", name: "American Airlines Group Inc.", sector: "Industrials" },
  { symbol: "LUV", name: "Southwest Airlines Co.", sector: "Industrials" },
  { symbol: "JBLU", name: "JetBlue Airways Corporation", sector: "Industrials" },
  { symbol: "SAVE", name: "Spirit Airlines Inc.", sector: "Industrials" },
  { symbol: "ALK", name: "Alaska Air Group Inc.", sector: "Industrials" },
  { symbol: "HA", name: "Hawaiian Holdings Inc.", sector: "Industrials" },
  { symbol: "ALGT", name: "Allegiant Travel Company", sector: "Industrials" },
  { symbol: "SKYW", name: "SkyWest Inc.", sector: "Industrials" },
  { symbol: "JBLU", name: "JetBlue Airways Corporation", sector: "Industrials" },
  { symbol: "SAVE", name: "Spirit Airlines Inc.", sector: "Industrials" },
  { symbol: "ALK", name: "Alaska Air Group Inc.", sector: "Industrials" },
  { symbol: "HA", name: "Hawaiian Holdings Inc.", sector: "Industrials" },
  { symbol: "ALGT", name: "Allegiant Travel Company", sector: "Industrials" },
  { symbol: "SKYW", name: "SkyWest Inc.", sector: "Industrials" }
];

// Функция для чтения stock.json
export async function loadStocksFromFile(): Promise<StockInfo[]> {
  try {
    const stockFilePath = path.join(process.cwd(), 'stats', 'stock.json');
    const fileContent = await fs.readFile(stockFilePath, 'utf-8');
    const stocks = JSON.parse(fileContent) as StockInfo[];
    
    logger.info(`Loaded ${stocks.length} stocks from stock.json`);
    return stocks;
  } catch (error) {
    logger.warn('Could not load stock.json, using fallback data:', error);
    return sp500StocksFallback;
  }
}

// Функция для получения всех акций (с кэшированием)
let cachedStocks: StockInfo[] | null = null;

export async function getAllStocks(): Promise<StockInfo[]> {
  if (cachedStocks) {
    return cachedStocks;
  }
  
  const stocksFromFile = await loadStocksFromFile();
  cachedStocks = [...cryptocurrencies, ...stocksFromFile];
  
  logger.info(`Total assets loaded: ${cachedStocks.length} (${cryptocurrencies.length} crypto + ${stocksFromFile.length} stocks)`);
  return cachedStocks;
}

// Функция для получения только символов акций
export async function getStockSymbols(): Promise<string[]> {
  const stocks = await getAllStocks();
  return stocks.map(stock => stock.symbol);
}

// Функция для получения акций по сектору
export async function getStocksBySector(sector: string): Promise<StockInfo[]> {
  const stocks = await getAllStocks();
  return stocks.filter(stock => stock.sector === sector);
}

// Функция для поиска акции по символу
export async function findStockBySymbol(symbol: string): Promise<StockInfo | undefined> {
  const stocks = await getAllStocks();
  return stocks.find(stock => stock.symbol === symbol);
}

// Синхронные версии для обратной совместимости (используют fallback данные)
export const sp500Stocks: StockInfo[] = sp500StocksFallback;

// Все активы вместе (fallback)
export const allAssets: StockInfo[] = [
  ...cryptocurrencies,
  ...sp500StocksFallback
];

// Только символы для обратной совместимости (fallback)
export const stockSymbols: string[] = allAssets.map(asset => asset.symbol);

// Экспорт по умолчанию для обратной совместимости (fallback)
export default stockSymbols; 