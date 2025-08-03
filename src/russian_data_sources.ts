import axios from 'axios';
import { StockData } from './types';
import logger from './logger';

// Интерфейсы для различных API
interface MoexResponse {
  candles: {
    data: number[][];
    columns: string[];
  };
}

// Класс для работы с российскими источниками данных
export class RussianDataSources {
  private static instance: RussianDataSources;
  
  private constructor() {}
  
  public static getInstance(): RussianDataSources {
    if (!RussianDataSources.instance) {
      RussianDataSources.instance = new RussianDataSources();
    }
    return RussianDataSources.instance;
  }

  // Получение данных с Московской биржи (MOEX)
  async fetchFromMoex(symbol: string, days: number = 365): Promise<StockData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const url = `https://iss.moex.com/iss/engines/stock/markets/shares/securities/${symbol}/candles.json`;
      const params = {
        from: startDate.toISOString().split('T')[0],
        till: endDate.toISOString().split('T')[0],
        interval: 24
      };
      
      const response = await axios.get<MoexResponse>(url, { params });
      
      if (!response.data.candles || !response.data.candles.data) {
        throw new Error('Нет данных от MOEX API');
      }
      
      const stockData: StockData[] = [];
      const columns = response.data.candles.columns;
      
      for (const row of response.data.candles.data) {
        const dateIndex = columns.indexOf('begin');
        const openIndex = columns.indexOf('open');
        const highIndex = columns.indexOf('high');
        const lowIndex = columns.indexOf('low');
        const closeIndex = columns.indexOf('close');
        const volumeIndex = columns.indexOf('value');
        
        if (dateIndex !== -1 && openIndex !== -1 && highIndex !== -1 && 
            lowIndex !== -1 && closeIndex !== -1 && volumeIndex !== -1) {
          
          const date = new Date(row[dateIndex]);
          stockData.push({
            Date: date.toISOString().split('T')[0],
            Open: row[openIndex] || 0,
            High: row[highIndex] || 0,
            Low: row[lowIndex] || 0,
            Close: row[closeIndex] || 0,
            Volume: row[volumeIndex] || 0
          });
        }
      }
      
      logger.info(`✅ Получено ${stockData.length} записей с MOEX для ${symbol}`);
      return stockData;
      
    } catch (error) {
      logger.warn(`⚠️ Ошибка при получении данных с MOEX для ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  // Получение данных с Investing.com (через прокси)
  async fetchFromInvesting(symbol: string, _days: number = 365): Promise<StockData[]> {
    try {
      // Используем бесплатный прокси для обхода ограничений
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const investingUrl = `https://www.investing.com/equities/${symbol}-historical-data`;
      
      const response = await axios.get(`${proxyUrl}${encodeURIComponent(investingUrl)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      // Парсим HTML для извлечения данных
      const html = response.data;
      const stockData: StockData[] = [];
      
      // Простой парсинг таблицы (в реальном проекте лучше использовать cheerio)
      const tableRegex = /<tr[^>]*>.*?<td[^>]*>(\d{2}\/\d{2}\/\d{4})<\/td>.*?<td[^>]*>([\d,]+\.?\d*)<\/td>.*?<td[^>]*>([\d,]+\.?\d*)<\/td>.*?<td[^>]*>([\d,]+\.?\d*)<\/td>.*?<td[^>]*>([\d,]+\.?\d*)<\/td>.*?<td[^>]*>([\d,]+\.?\d*)<\/td>/g;
      
      let match;
      while ((match = tableRegex.exec(html)) !== null) {
        const date = new Date(match[1]);
        stockData.push({
          Date: date.toISOString().split('T')[0],
          Open: parseFloat(match[2].replace(/,/g, '')) || 0,
          High: parseFloat(match[3].replace(/,/g, '')) || 0,
          Low: parseFloat(match[4].replace(/,/g, '')) || 0,
          Close: parseFloat(match[5].replace(/,/g, '')) || 0,
          Volume: parseFloat(match[6].replace(/,/g, '')) || 0
        });
      }
      
      logger.info(`✅ Получено ${stockData.length} записей с Investing.com для ${symbol}`);
      return stockData;
      
    } catch (error) {
      logger.warn(`⚠️ Ошибка при получении данных с Investing.com для ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  // Получение данных с Finam.ru
  async fetchFromFinam(symbol: string, days: number = 365): Promise<StockData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const url = `https://export.finam.ru/${symbol}`;
      const params = {
        market: 1, // Московская биржа
        em: this.getFinamCode(symbol),
        code: symbol,
        apply: 0,
        df: startDate.getDate(),
        mf: startDate.getMonth(),
        yf: startDate.getFullYear(),
        dt: endDate.getDate(),
        mt: endDate.getMonth(),
        yt: endDate.getFullYear(),
        p: 8, // Дневной интервал
        f: `${symbol}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.csv`,
        e: '.csv',
        cn: symbol,
        dtf: 1,
        tmf: 1,
        MSOR: 0,
        mstime: 'on',
        mstimever: 1,
        sep: 1,
        sep2: 1,
        datf: 1,
        at: 1
      };
      
      const response = await axios.get(url, { params });
      
      // Парсим CSV
      const lines = response.data.split('\n');
      const stockData: StockData[] = [];
      
      for (let i = 1; i < lines.length; i++) { // Пропускаем заголовок
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length >= 7) {
          const [date, open, high, low, close, volume] = parts;
          stockData.push({
            Date: date,
            Open: parseFloat(open) || 0,
            High: parseFloat(high) || 0,
            Low: parseFloat(low) || 0,
            Close: parseFloat(close) || 0,
            Volume: parseFloat(volume) || 0
          });
        }
      }
      
      logger.info(`✅ Получено ${stockData.length} записей с Finam.ru для ${symbol}`);
      return stockData;
      
    } catch (error) {
      logger.warn(`⚠️ Ошибка при получении данных с Finam.ru для ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  // Получение данных с Yahoo Finance (для российских ADR/GDR)
  async fetchFromYahooRussian(symbol: string, days: number = 365): Promise<StockData[]> {
    try {
      const endDate = Math.floor(Date.now() / 1000);
      const startDate = endDate - (days * 24 * 60 * 60);
      
      // Добавляем суффиксы для российских акций на зарубежных биржах
      const yahooSymbol = symbol.includes('.ME') ? symbol : `${symbol}.ME`;
      
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${startDate}&period2=${endDate}&interval=1d`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const data = response.data;
      
      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        throw new Error('Нет данных для акции');
      }
      
      const result = data.chart.result[0];
      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];
      
      const stockData: StockData[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        const date = new Date(timestamps[i] * 1000);
        stockData.push({
          Date: date.toISOString().split('T')[0],
          Open: quotes.open[i] || 0,
          High: quotes.high[i] || 0,
          Low: quotes.low[i] || 0,
          Close: quotes.close[i] || 0,
          Volume: quotes.volume[i] || 0
        });
      }
      
      logger.info(`✅ Получено ${stockData.length} записей с Yahoo Finance для ${symbol}`);
      return stockData;
      
    } catch (error) {
      logger.warn(`⚠️ Ошибка при получении данных с Yahoo Finance для ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  // Основная функция для получения данных российских активов
  async fetchRussianStockData(symbol: string, days: number = 365): Promise<StockData[]> {
    const sources = [
      { name: 'Yahoo Finance', method: () => this.fetchFromYahooRussian(symbol, days) },
      { name: 'MOEX', method: () => this.fetchFromMoex(symbol, days) },
      { name: 'Finam.ru', method: () => this.fetchFromFinam(symbol, days) },
      { name: 'Investing.com', method: () => this.fetchFromInvesting(symbol, days) }
    ];
    
    for (const source of sources) {
      try {
        logger.info(`🔄 Пробуем получить данные для ${symbol} с ${source.name}...`);
        const data = await source.method();
        
        if (data && data.length > 0) {
          logger.info(`✅ Успешно получены данные для ${symbol} с ${source.name}`);
          return data;
        }
      } catch (error) {
        logger.warn(`⚠️ Не удалось получить данные с ${source.name} для ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        continue;
      }
    }
    
    throw new Error(`Не удалось получить данные для ${symbol} ни из одного источника`);
  }

  // Вспомогательная функция для получения кодов Finam
  private getFinamCode(symbol: string): string {
    const finamCodes: { [key: string]: string } = {
      'SBER': '3',
      'GAZP': '16842',
      'LKOH': '8',
      'NVTK': '17370',
      'YNDX': '15544',
      'TATN': '825',
      'SURG': '16080',
      'NLMK': '17086',
      'MAGN': '16782',
      'SEVER': '352',
      'ALRS': '81820',
      'PHOR': '81114',
      'CHMF': '16136',
      'RUAL': '414279',
      'POLY': '89563',
      'GMKN': '795',
      'PLZL': '17123',
      'ROSN': '17273'
    };
    
    return finamCodes[symbol] || '1';
  }

  // Функция для определения лучшего источника для конкретного символа
  getBestSourceForSymbol(symbol: string): string {
    // Российские акции на Московской бирже
    if (['SBER', 'GAZP', 'LKOH', 'NVTK', 'YNDX', 'TATN', 'SURG', 'NLMK', 'MAGN', 'SEVER', 'ALRS', 'PHOR', 'CHMF', 'RUAL', 'POLY', 'GMKN', 'PLZL', 'ROSN'].includes(symbol)) {
      return 'MOEX';
    }
    
    // Российские ADR/GDR
    if (symbol.includes('.ME') || symbol.includes('.LSE') || symbol.includes('.NASDAQ')) {
      return 'Yahoo';
    }
    
    // Облигации
    if (symbol.startsWith('OFZ-')) {
      return 'MOEX';
    }
    
    // По умолчанию пробуем все источники
    return 'Auto';
  }
}

// Экспорт синглтона
export const russianDataSources = RussianDataSources.getInstance(); 