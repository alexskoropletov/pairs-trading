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
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", dividendYield: 0.5 },
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology", dividendYield: 0.8 },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary" },
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology" },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology" },
  { symbol: "BRK-B", name: "Berkshire Hathaway Inc.", sector: "Financials" },
  { symbol: "LLY", name: "Eli Lilly and Company", sector: "Healthcare" },
  { symbol: "V", name: "Visa Inc.", sector: "Financials", dividendYield: 0.7 },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary" },
  { symbol: "UNH", name: "UnitedHealth Group Inc.", sector: "Healthcare" },
  { symbol: "XOM", name: "Exxon Mobil Corporation", sector: "Energy", dividendYield: 3.2 },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", dividendYield: 3.1 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financials", dividendYield: 2.8 },
  { symbol: "PG", name: "Procter & Gamble Company", sector: "Consumer Staples", dividendYield: 2.5 },
  { symbol: "MA", name: "Mastercard Incorporated", sector: "Financials", dividendYield: 0.6 },
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

// Полный список компаний IMOEX (Московская биржа - топ-30)
export const imoexStocksFallback: StockInfo[] = [
  { symbol: "SBER", name: "Сбербанк России", sector: "Financials" },
  { symbol: "GAZP", name: "Газпром", sector: "Energy" },
  { symbol: "LKOH", name: "Лукойл", sector: "Energy" },
  { symbol: "NVTK", name: "Новатэк", sector: "Energy" },
  { symbol: "YNDX", name: "Яндекс", sector: "Technology" },
  { symbol: "TATN", name: "Татнефть", sector: "Energy" },
  { symbol: "SURG", name: "Сургутнефтегаз", sector: "Energy" },
  { symbol: "NLMK", name: "НЛМК", sector: "Materials" },
  { symbol: "MAGN", name: "Магнитогорский металлургический комбинат", sector: "Materials" },
  { symbol: "SEVER", name: "Северсталь", sector: "Materials" },
  { symbol: "NORN", name: "Северсталь", sector: "Materials" },
  { symbol: "ALRS", name: "АЛРОСА", sector: "Materials" },
  { symbol: "PHOR", name: "ФосАгро", sector: "Materials" },
  { symbol: "CHMF", name: "Северсталь", sector: "Materials" },
  { symbol: "RUAL", name: "РУСАЛ", sector: "Materials" },
  { symbol: "POLY", name: "Полюс", sector: "Materials" },
  { symbol: "GMKN", name: "Норильский никель", sector: "Materials" },
  { symbol: "PLZL", name: "Полюс", sector: "Materials" },
  { symbol: "ROSN", name: "Роснефть", sector: "Energy" },
  { symbol: "TATNP", name: "Татнефть (привилегированные)", sector: "Energy" },
  { symbol: "SBERP", name: "Сбербанк России (привилегированные)", sector: "Financials" },
  { symbol: "GAZPP", name: "Газпром (привилегированные)", sector: "Energy" },
  { symbol: "LKOHP", name: "Лукойл (привилегированные)", sector: "Energy" },
  { symbol: "NVTKP", name: "Новатэк (привилегированные)", sector: "Energy" },
  { symbol: "YNDXP", name: "Яндекс (привилегированные)", sector: "Technology" },
  { symbol: "TATNP", name: "Татнефть (привилегированные)", sector: "Energy" },
  { symbol: "SURGP", name: "Сургутнефтегаз (привилегированные)", sector: "Energy" },
  { symbol: "NLMKP", name: "НЛМК (привилегированные)", sector: "Materials" },
  { symbol: "MAGNP", name: "Магнитогорский металлургический комбинат (привилегированные)", sector: "Materials" },
  { symbol: "SEVERP", name: "Северсталь (привилегированные)", sector: "Materials" },
  { symbol: "NORNP", name: "Северсталь (привилегированные)", sector: "Materials" },
  { symbol: "ALRSP", name: "АЛРОСА (привилегированные)", sector: "Materials" },
  { symbol: "PHORP", name: "ФосАгро (привилегированные)", sector: "Materials" },
  { symbol: "CHMFP", name: "Северсталь (привилегированные)", sector: "Materials" },
  { symbol: "RUALP", name: "РУСАЛ (привилегированные)", sector: "Materials" },
  { symbol: "POLYP", name: "Полюс (привилегированные)", sector: "Materials" },
  { symbol: "GMKNP", name: "Норильский никель (привилегированные)", sector: "Materials" },
  { symbol: "PLZLP", name: "Полюс (привилегированные)", sector: "Materials" },
  { symbol: "ROSNP", name: "Роснефть (привилегированные)", sector: "Energy" }
];

// Полный список компаний RUCBITR (Российские корпоративные облигации)
export const rucbitrStocksFallback: StockInfo[] = [
  { symbol: "RU-001", name: "Сбербанк-001", sector: "Corporate Bonds", couponRate: 8.5 },
  { symbol: "RU-002", name: "Газпром-002", sector: "Corporate Bonds", couponRate: 7.8 },
  { symbol: "RU-003", name: "Лукойл-003", sector: "Corporate Bonds", couponRate: 8.2 },
  { symbol: "RU-004", name: "Роснефть-004", sector: "Corporate Bonds", couponRate: 7.5 },
  { symbol: "RU-005", name: "Норильский никель-005", sector: "Corporate Bonds", couponRate: 8.0 },
  { symbol: "RU-006", name: "Северсталь-006", sector: "Corporate Bonds", couponRate: 7.9 },
  { symbol: "RU-007", name: "НЛМК-007", sector: "Corporate Bonds", couponRate: 8.1 },
  { symbol: "RU-008", name: "Магнит-008", sector: "Corporate Bonds", couponRate: 7.6 },
  { symbol: "RU-009", name: "Полюс-009", sector: "Corporate Bonds", couponRate: 8.3 },
  { symbol: "RU-010", name: "АЛРОСА-010", sector: "Corporate Bonds", couponRate: 7.7 },
  { symbol: "RU-011", name: "ФосАгро-011", sector: "Corporate Bonds", couponRate: 8.4 },
  { symbol: "RU-012", name: "РУСАЛ-012", sector: "Corporate Bonds", couponRate: 7.4 },
  { symbol: "RU-013", name: "Татнефть-013", sector: "Corporate Bonds", couponRate: 8.6 },
  { symbol: "RU-014", name: "Сургутнефтегаз-014", sector: "Corporate Bonds", couponRate: 7.8 },
  { symbol: "RU-015", name: "Яндекс-015", sector: "Corporate Bonds", couponRate: 8.0 }
];

// Полный список компаний RGBI (Российские государственные облигации)
export const rgbiStocksFallback: StockInfo[] = [
  { symbol: "OFZ-26207", name: "ОФЗ-26207", sector: "Government Bonds", couponRate: 6.5 },
  { symbol: "OFZ-26208", name: "ОФЗ-26208", sector: "Government Bonds", couponRate: 6.8 },
  { symbol: "OFZ-26209", name: "ОФЗ-26209", sector: "Government Bonds", couponRate: 7.0 },
  { symbol: "OFZ-26210", name: "ОФЗ-26210", sector: "Government Bonds", couponRate: 6.7 },
  { symbol: "OFZ-26211", name: "ОФЗ-26211", sector: "Government Bonds", couponRate: 7.2 },
  { symbol: "OFZ-26212", name: "ОФЗ-26212", sector: "Government Bonds", couponRate: 6.9 },
  { symbol: "OFZ-26213", name: "ОФЗ-26213", sector: "Government Bonds", couponRate: 7.1 },
  { symbol: "OFZ-26214", name: "ОФЗ-26214", sector: "Government Bonds", couponRate: 6.6 },
  { symbol: "OFZ-26215", name: "ОФЗ-26215", sector: "Government Bonds", couponRate: 7.3 },
  { symbol: "OFZ-26216", name: "ОФЗ-26216", sector: "Government Bonds", couponRate: 6.8 },
  { symbol: "OFZ-26217", name: "ОФЗ-26217", sector: "Government Bonds", couponRate: 7.0 },
  { symbol: "OFZ-26218", name: "ОФЗ-26218", sector: "Government Bonds", couponRate: 6.9 },
  { symbol: "OFZ-26219", name: "ОФЗ-26219", sector: "Government Bonds", couponRate: 7.1 },
  { symbol: "OFZ-26220", name: "ОФЗ-26220", sector: "Government Bonds", couponRate: 6.7 },
  { symbol: "OFZ-26221", name: "ОФЗ-26221", sector: "Government Bonds", couponRate: 7.2 },
  { symbol: "OFZ-26222", name: "ОФЗ-26222", sector: "Government Bonds", couponRate: 6.8 },
  { symbol: "OFZ-26223", name: "ОФЗ-26223", sector: "Government Bonds", couponRate: 7.0 },
  { symbol: "OFZ-26224", name: "ОФЗ-26224", sector: "Government Bonds", couponRate: 6.9 },
  { symbol: "OFZ-26225", name: "ОФЗ-26225", sector: "Government Bonds", couponRate: 7.1 },
  { symbol: "OFZ-26226", name: "ОФЗ-26226", sector: "Government Bonds", couponRate: 6.6 },
  { symbol: "OFZ-26227", name: "ОФЗ-26227", sector: "Government Bonds", couponRate: 7.3 },
  { symbol: "OFZ-26228", name: "ОФЗ-26228", sector: "Government Bonds", couponRate: 6.8 },
  { symbol: "OFZ-26229", name: "ОФЗ-26229", sector: "Government Bonds", couponRate: 7.0 },
  { symbol: "OFZ-26230", name: "ОФЗ-26230", sector: "Government Bonds", couponRate: 6.9 },
  { symbol: "OFZ-26231", name: "ОФЗ-26231", sector: "Government Bonds", couponRate: 7.1 },
  { symbol: "OFZ-26232", name: "ОФЗ-26232", sector: "Government Bonds", couponRate: 6.7 },
  { symbol: "OFZ-26233", name: "ОФЗ-26233", sector: "Government Bonds", couponRate: 7.2 },
  { symbol: "OFZ-26234", name: "ОФЗ-26234", sector: "Government Bonds", couponRate: 6.8 },
  { symbol: "OFZ-26235", name: "ОФЗ-26235", sector: "Government Bonds", couponRate: 7.0 },
  { symbol: "OFZ-26236", name: "ОФЗ-26236", sector: "Government Bonds", couponRate: 6.9 },
  { symbol: "OFZ-26237", name: "ОФЗ-26237", sector: "Government Bonds", couponRate: 7.1 },
  { symbol: "OFZ-26238", name: "ОФЗ-26238", sector: "Government Bonds", couponRate: 6.6 },
  { symbol: "OFZ-26239", name: "ОФЗ-26239", sector: "Government Bonds", couponRate: 7.3 },
  { symbol: "OFZ-26240", name: "ОФЗ-26240", sector: "Government Bonds", couponRate: 6.8 },
  { symbol: "OFZ-26241", name: "ОФЗ-26241", sector: "Government Bonds", couponRate: 7.0 },
  { symbol: "OFZ-26242", name: "ОФЗ-26242", sector: "Government Bonds", couponRate: 6.9 },
  { symbol: "OFZ-26243", name: "ОФЗ-26243", sector: "Government Bonds", couponRate: 7.1 },
  { symbol: "OFZ-26244", name: "ОФЗ-26244", sector: "Government Bonds", couponRate: 6.7 },
  { symbol: "OFZ-26245", name: "ОФЗ-26245", sector: "Government Bonds", couponRate: 7.2 },
  { symbol: "OFZ-26246", name: "ОФЗ-26246", sector: "Government Bonds", couponRate: 6.8 },
  { symbol: "OFZ-26247", name: "ОФЗ-26247", sector: "Government Bonds", couponRate: 7.0 },
  { symbol: "OFZ-26248", name: "ОФЗ-26248", sector: "Government Bonds" },
  { symbol: "OFZ-26249", name: "ОФЗ-26249", sector: "Government Bonds" },
  { symbol: "OFZ-26250", name: "ОФЗ-26250", sector: "Government Bonds" }
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
export async function getAllStocks(): Promise<StockInfo[]> {
    try {
        // Пытаемся загрузить из файла
        const stocks = await loadStocksFromFile();
        if (stocks.length > 0) {
            return stocks;
        }
    } catch (error) {
        logger.warn('⚠️ Не удалось загрузить stock.json, используем fallback списки');
    }
    
    // Fallback: объединяем все доступные списки
    const allStocks = [
        ...sp500StocksFallback,
        ...nasdaq100StocksFallback,
        ...imoexStocksFallback,
        ...rucbitrStocksFallback,
        ...rgbiStocksFallback
    ];
    
    // Убираем дубликаты по символу
    const uniqueStocks = allStocks.filter((stock, index, self) => 
        index === self.findIndex(s => s.symbol === stock.symbol)
    );
    
    return uniqueStocks;
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
  ...sp500StocksFallback,
  ...nasdaq100StocksFallback,
  ...imoexStocksFallback,
  ...rucbitrStocksFallback,
  ...rgbiStocksFallback
];

// Только символы для обратной совместимости (fallback)
export const stockSymbols: string[] = allAssets.map(asset => asset.symbol);

// Экспорт по умолчанию для обратной совместимости (fallback)
export default stockSymbols; 