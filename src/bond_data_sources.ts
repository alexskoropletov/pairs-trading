import axios from 'axios';
import { StockData } from './types';
import logger from './logger';

// Интерфейс для данных облигаций (зарезервирован для будущего использования)
// interface BondData {
//   date: string;
//   price: number;
//   yield: number;
//   volume?: number;
// }

export class BondDataSources {
  // Получение данных облигаций с MOEX
  async fetchBondDataFromMoex(isin: string, days: number = 365): Promise<StockData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const url = `https://iss.moex.com/iss/engines/stock/markets/bonds/securities/${isin}/candles.json`;
      const params = {
        from: startDate.toISOString().split('T')[0],
        till: endDate.toISOString().split('T')[0],
        interval: 24
      };
      
      const response = await axios.get(url, { params });
      
      if (!response.data.candles || !response.data.candles.data) {
        throw new Error('Нет данных облигаций от MOEX API');
      }
      
      const stockData: StockData[] = [];
      const columns = response.data.candles.columns;
      
      for (const row of response.data.candles.data) {
        const dateIndex = columns.indexOf('begin');
        const priceIndex = columns.indexOf('close');
        const volumeIndex = columns.indexOf('value');
        
        if (dateIndex !== -1 && priceIndex !== -1) {
          const date = new Date(row[dateIndex]);
          stockData.push({
            Date: date.toISOString().split('T')[0],
            Open: row[priceIndex] || 0,
            High: row[priceIndex] || 0,
            Low: row[priceIndex] || 0,
            Close: row[priceIndex] || 0,
            Volume: row[volumeIndex] || 0
          });
        }
      }
      
      logger.info(`✅ Получено ${stockData.length} записей облигаций с MOEX для ${isin}`);
      return stockData;
      
    } catch (error) {
      logger.warn(`⚠️ Ошибка при получении данных облигаций с MOEX для ${isin}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  // Получение данных облигаций с CBR (Центральный Банк России)
  async fetchBondDataFromCBR(isin: string, days: number = 365): Promise<StockData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const url = `https://www.cbr.ru/statistics/engines/stock/markets/bonds/securities/${isin}/candles.json`;
      const params = {
        from: startDate.toISOString().split('T')[0],
        till: endDate.toISOString().split('T')[0],
        interval: 24
      };
      
      const response = await axios.get(url, { params });
      
      if (!response.data.candles || !response.data.candles.data) {
        throw new Error('Нет данных облигаций от CBR API');
      }
      
      const stockData: StockData[] = [];
      const columns = response.data.candles.columns;
      
      for (const row of response.data.candles.data) {
        const dateIndex = columns.indexOf('begin');
        const priceIndex = columns.indexOf('close');
        const volumeIndex = columns.indexOf('value');
        
        if (dateIndex !== -1 && priceIndex !== -1) {
          const date = new Date(row[dateIndex]);
          stockData.push({
            Date: date.toISOString().split('T')[0],
            Open: row[priceIndex] || 0,
            High: row[priceIndex] || 0,
            Low: row[priceIndex] || 0,
            Close: row[priceIndex] || 0,
            Volume: row[volumeIndex] || 0
          });
        }
      }
      
      logger.info(`✅ Получено ${stockData.length} записей облигаций с CBR для ${isin}`);
      return stockData;
      
    } catch (error) {
      logger.warn(`⚠️ Ошибка при получении данных облигаций с CBR для ${isin}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  // Основная функция для получения данных облигаций
  async fetchBondData(symbol: string, days: number = 365): Promise<StockData[]> {
    const sources = [
      { name: 'MOEX', method: () => this.fetchBondDataFromMoex(symbol, days) },
      { name: 'CBR', method: () => this.fetchBondDataFromCBR(symbol, days) }
    ];
    
    for (const source of sources) {
      try {
        logger.info(`🔄 Пробуем получить данные облигаций для ${symbol} с ${source.name}...`);
        const data = await source.method();
        
        if (data && data.length > 0) {
          logger.info(`✅ Успешно получены данные облигаций для ${symbol} с ${source.name}`);
          return data;
        }
      } catch (error) {
        logger.warn(`⚠️ Не удалось получить данные облигаций с ${source.name} для ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        continue;
      }
    }
    
    throw new Error(`Не удалось получить данные облигаций для ${symbol} ни из одного источника`);
  }
}

export const bondDataSources = new BondDataSources(); 