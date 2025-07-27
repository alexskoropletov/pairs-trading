import axios from 'axios';
import fs from 'fs/promises';
import logger from './logger';

interface StockInfo {
  symbol: string;
  name: string;
  sector: string;
}

async function fetchSP500Symbols(): Promise<string[]> {
  try {
    logger.info('Fetching S&P 500 symbols...');
    
    // Method 1: Try to get S&P 500 components from a reliable source
    const response = await axios.get('https://www.slickcharts.com/sp500', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    // Parse HTML to extract symbols
    const html = response.data;
    const symbolMatches = html.match(/<td[^>]*>([A-Z]{1,5})<\/td>/g);
    if (symbolMatches) {
      const symbols = symbolMatches.map((match: string) => {
        const symbolMatch = match.match(/>([A-Z]{1,5})</);
        return symbolMatch ? symbolMatch[1] : null;
      }).filter(Boolean);
      
      logger.info(`Fetched ${symbols.length} S&P 500 symbols from SlickCharts`);
      return symbols;
    }

    // Method 2: Try alternative source
    logger.info('Trying alternative source for S&P 500 symbols...');
    const altResponse = await axios.get('https://en.wikipedia.org/wiki/List_of_S%26P_500_companies', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const altHtml = altResponse.data;
    const wikiSymbolMatches = altHtml.match(/<td[^>]*>([A-Z]{1,5})<\/td>/g);
    if (wikiSymbolMatches) {
      const symbols = wikiSymbolMatches.map((match: string) => {
        const symbolMatch = match.match(/>([A-Z]{1,5})</);
        return symbolMatch ? symbolMatch[1] : null;
      }).filter(Boolean);
      
      logger.info(`Fetched ${symbols.length} S&P 500 symbols from Wikipedia`);
      return symbols;
    }

    throw new Error('Could not fetch S&P 500 symbols from any source');
  } catch (error) {
    logger.error('Error fetching S&P 500 symbols:', error);
    
    // Fallback: Return a basic list of major S&P 500 companies
    logger.info('Using fallback S&P 500 symbols');
    const fallbackSymbols = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'BRK-B', 'LLY', 'V', 'TSLA',
      'UNH', 'XOM', 'JNJ', 'JPM', 'PG', 'MA', 'HD', 'CVX', 'AVGO', 'KO',
      'PEP', 'COST', 'ABBV', 'TMO', 'BAC', 'WMT', 'MRK', 'PFE', 'ACN', 'DHR',
      'VZ', 'ADBE', 'CMCSA', 'NFLX', 'TXN', 'NEE', 'PM', 'RTX', 'HON', 'QCOM',
      'LOW', 'UPS', 'INTU', 'IBM', 'MS', 'SPGI', 'AMGN', 'T', 'SCHW', 'GS'
    ];
    
    return fallbackSymbols;
  }
}

async function fetchNASDAQ2000Symbols(): Promise<string[]> {
  try {
    logger.info('Fetching NASDAQ-2000 symbols...');
    
    // Method 1: Try to get from NASDAQ website
    const response = await axios.get('https://www.nasdaq.com/market-activity/quotes/nasdaq-composite', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    const symbolMatches = html.match(/<td[^>]*>([A-Z]{1,5})<\/td>/g);
    if (symbolMatches) {
      const symbols = symbolMatches.map((match: string) => {
        const symbolMatch = match.match(/>([A-Z]{1,5})</);
        return symbolMatch ? symbolMatch[1] : null;
      }).filter(Boolean);
      
      logger.info(`Fetched ${symbols.length} NASDAQ symbols from NASDAQ website`);
      return symbols.slice(0, 2000); // Limit to top 2000
    }

    // Method 2: Try alternative source
    logger.info('Trying alternative source for NASDAQ symbols...');
    const altResponse = await axios.get('https://www.nasdaq.com/market-activity/quotes/nasdaq-100', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const altHtml = altResponse.data;
    const altSymbolMatches = altHtml.match(/<td[^>]*>([A-Z]{1,5})<\/td>/g);
    if (altSymbolMatches) {
      const symbols = altSymbolMatches.map((match: string) => {
        const symbolMatch = match.match(/>([A-Z]{1,5})</);
        return symbolMatch ? symbolMatch[1] : null;
      }).filter(Boolean);
      
      logger.info(`Fetched ${symbols.length} NASDAQ-100 symbols from NASDAQ website`);
      return symbols;
    }

    throw new Error('Could not fetch NASDAQ symbols from any source');
  } catch (error) {
    logger.error('Error fetching NASDAQ-2000 symbols:', error);
    
    // Fallback: Return a basic list of major NASDAQ companies
    logger.info('Using fallback NASDAQ symbols');
    const fallbackSymbols = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'PEP', 'COST',
      'ADBE', 'NFLX', 'INTC', 'AMD', 'CSCO', 'TMUS', 'CMCSA', 'QCOM', 'HON', 'ADP',
      'GILD', 'REGN', 'VRTX', 'MDLZ', 'BKNG', 'ADI', 'KLAC', 'LRCX', 'MU', 'AMAT',
      'ASML', 'SNPS', 'CDNS', 'MELI', 'JD', 'PDD', 'BIDU', 'NTES', 'TCOM', 'BABA'
    ];
    
    return fallbackSymbols;
  }
}

async function fetchStockDetails(symbols: string[]): Promise<StockInfo[]> {
  const stocks: StockInfo[] = [];
  const batchSize = 50; // Process in batches to avoid rate limiting
  
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    logger.info(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(symbols.length / batchSize)}`);
    
    try {
      const symbolsString = batch.join(',');
      const response = await axios.get(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsString}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.data && response.data.quoteResponse && response.data.quoteResponse.result) {
        for (const quote of response.data.quoteResponse.result) {
          if (quote.symbol && quote.longName) {
            stocks.push({
              symbol: quote.symbol,
              name: quote.longName,
              sector: quote.sector || 'Unknown'
            });
          }
        }
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error(`Error processing batch starting with ${batch[0]}:`, error);
    }
  }
  
  return stocks;
}

async function main() {
  try {
    logger.info('Starting stock data collection...');
    
    // Get symbols from APIs
    const sp500Symbols = await fetchSP500Symbols();
    const nasdaqSymbols = await fetchNASDAQ2000Symbols();
    
    // Combine and remove duplicates
    const allSymbols = [...new Set([...sp500Symbols, ...nasdaqSymbols])];
    logger.info(`Total unique symbols: ${allSymbols.length}`);
    
    if (allSymbols.length === 0) {
      logger.error('No symbols fetched from APIs');
      process.exit(1);
    }
    
    // Fetch detailed information for all symbols
    const stocks = await fetchStockDetails(allSymbols);
    
    // Save to file
    const outputPath = './stats/stock.json';
    await fs.writeFile(outputPath, JSON.stringify(stocks, null, 2));
    
    logger.info(`Successfully saved ${stocks.length} stocks to ${outputPath}`);
    
    // Log some examples
    logger.info('Sample stocks:');
    stocks.slice(0, 5).forEach(stock => {
      logger.info(`${stock.symbol}: ${stock.name} (${stock.sector})`);
    });
    
  } catch (error) {
    logger.error('Error in main function:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main, fetchStockDetails, fetchSP500Symbols, fetchNASDAQ2000Symbols };
