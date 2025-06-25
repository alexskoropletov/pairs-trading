import * as fs from 'fs-extra';
import axios from 'axios';
import path from 'path';
import { StockData, YahooFinanceResponse } from './types';
import { stockSymbols } from './stock';
import logger from './logger';

// Папка для сохранения CSV
const STATS_DIR = 'stats';

// Создаем папку stats если её нет
fs.ensureDirSync(STATS_DIR);

// Функция для получения данных акции через Yahoo Finance API
async function fetchStockData(symbol: string): Promise<StockData[]> {
    try {
        // Вычисляем даты (год назад и сегодня)
        const endDate = Math.floor(Date.now() / 1000);
        const startDate = endDate - (365 * 24 * 60 * 60); // 365 дней назад
        
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`;
        
        const response = await axios.get<YahooFinanceResponse>(url, {
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
        
        // Формируем массив данных
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
        
        return stockData;
    } catch (error) {
        throw new Error(`Ошибка при получении данных для ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Функция для сохранения данных в CSV
async function saveToCSV(symbol: string, data: StockData[]): Promise<void> {
    const csvContent = [
        'Date,Open,High,Low,Close,Volume',
        ...data.map(row => `${row.Date},${row.Open},${row.High},${row.Low},${row.Close},${row.Volume}`)
    ].join('\n');
    
    const csvPath = path.join(STATS_DIR, `${symbol}.csv`);
    await fs.writeFile(csvPath, csvContent, 'utf-8');
}

// Основная функция
async function main(): Promise<void> {
    logger.info('🚀 Начинаем загрузку данных акций...');
    
    // Используем импортированный массив символов
    const symbols = stockSymbols;
    
    logger.info(`📊 Загружаем данные для ${symbols.length} активов...`);
    
    try {
        for (const ticker of symbols) {
            logger.info(`\n📊 Загружаю данные для ${ticker}...`);
            
            try {
                const data = await fetchStockData(ticker);
                
                if (data.length === 0) {
                    logger.info(`❌ Нет данных для ${ticker}`);
                    continue;
                }
                
                await saveToCSV(ticker, data);
                logger.info(`✅ Сохранено: ${ticker}.csv (${data.length} записей)`);
                
                // Небольшая задержка между запросами
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                logger.error(`❌ Ошибка для ${ticker}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        
        logger.info('\n🎉 Загрузка завершена!');
        logger.info(`📁 Файлы сохранены в папке: ${STATS_DIR}/`);
        
    } catch (error) {
        logger.error('❌ Критическая ошибка:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}

// Запускаем скрипт
main(); 