import * as fs from 'fs-extra';
import axios from 'axios';
import path from 'path';
import { StockData, YahooFinanceResponse } from './types';
import { stockSymbols, sp500StocksFallback, nasdaq100StocksFallback, imoexStocksFallback, rucbitrStocksFallback, rgbiStocksFallback } from './stock';
import { russianDataSources } from './russian_data_sources';
import { bondDataSources } from './bond_data_sources';
import { ensureTickerDirectories } from './utils';
import logger from './logger';

// Папки для сохранения CSV
const TICKERS_DIR = 'tickers';
const SP500_DIR = path.join(TICKERS_DIR, 'sp500');
const NASDAQ_DIR = path.join(TICKERS_DIR, 'nasdaq');
const IMOEX_DIR = path.join(TICKERS_DIR, 'imoex');
const RUCBITR_DIR = path.join(TICKERS_DIR, 'rucbitr');
const RGBI_DIR = path.join(TICKERS_DIR, 'rgbi');

// Файл для отслеживания даты последнего обновления цен
const PRICES_LOG_FILE = 'stats/prices.log';

// Создаем папки если их нет
fs.ensureDirSync(SP500_DIR);
fs.ensureDirSync(NASDAQ_DIR);
fs.ensureDirSync(IMOEX_DIR);
fs.ensureDirSync(RUCBITR_DIR);
fs.ensureDirSync(RGBI_DIR);

// Функция для определения индекса тикера
function getTickerIndex(symbol: string): 'sp500' | 'nasdaq' | 'imoex' | 'rucbitr' | 'rgbi' {
    const sp500Symbols = sp500StocksFallback.map(stock => stock.symbol);
    const nasdaqSymbols = nasdaq100StocksFallback.map(stock => stock.symbol);
    const imoexSymbols = imoexStocksFallback.map(stock => stock.symbol);
    const rucbitrSymbols = rucbitrStocksFallback.map(stock => stock.symbol);
    const rgbiSymbols = rgbiStocksFallback.map(stock => stock.symbol);
    
    // Проверяем по приоритету: российские индексы, затем американские
    if (rgbiSymbols.includes(symbol)) {
        return 'rgbi';
    } else if (rucbitrSymbols.includes(symbol)) {
        return 'rucbitr';
    } else if (imoexSymbols.includes(symbol)) {
        return 'imoex';
    } else if (nasdaqSymbols.includes(symbol)) {
        return 'nasdaq';
    } else if (sp500Symbols.includes(symbol)) {
        return 'sp500';
    } else {
        // Для криптовалют и других активов используем S&P500
        return 'sp500';
    }
}

// Функция для определения, является ли актив российским
function isRussianAsset(symbol: string): boolean {
    const imoexSymbols = imoexStocksFallback.map(stock => stock.symbol);
    const rucbitrSymbols = rucbitrStocksFallback.map(stock => stock.symbol);
    const rgbiSymbols = rgbiStocksFallback.map(stock => stock.symbol);
    
    return imoexSymbols.includes(symbol) || 
           rucbitrSymbols.includes(symbol) || 
           rgbiSymbols.includes(symbol) ||
           symbol.startsWith('OFZ-') ||
           symbol.includes('.ME') ||
           symbol.includes('.LSE') ||
           symbol.includes('.NASDAQ');
}

// Функция для получения пути к CSV файлу
function getCSVPath(symbol: string): string {
    const index = getTickerIndex(symbol);
    let dir: string;
    
    switch (index) {
        case 'sp500':
            dir = SP500_DIR;
            break;
        case 'nasdaq':
            dir = NASDAQ_DIR;
            break;
        case 'imoex':
            dir = IMOEX_DIR;
            break;
        case 'rucbitr':
            dir = RUCBITR_DIR;
            break;
        case 'rgbi':
            dir = RGBI_DIR;
            break;
        default:
            dir = SP500_DIR;
    }
    
    return path.join(dir, `${symbol}.csv`);
}

// Функция для получения даты последнего обновления цен из лог-файла
async function getLastPricesUpdateDate(): Promise<Date | null> {
    try {
        if (!fs.existsSync(PRICES_LOG_FILE)) {
            return null;
        }
        
        const content = await fs.readFile(PRICES_LOG_FILE, 'utf-8');
        const lines = content.trim().split('\n');
        
        if (lines.length === 0) {
            return null;
        }
        
        // Берем последнюю строку с датой
        const lastLine = lines[lines.length - 1];
        const dateMatch = lastLine.match(/(\d{4}-\d{2}-\d{2})/);
        
        if (dateMatch) {
            return new Date(dateMatch[1]);
        }
        
        return null;
    } catch (error) {
        logger.warn(`⚠️ Ошибка при чтении файла дат обновления: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return null;
    }
}

// Функция для сохранения даты последнего обновления цен
async function savePricesUpdateDate(): Promise<void> {
    try {
        // Создаем папку stats, если её нет
        await fs.ensureDir('stats');
        
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        const timeString = today.toISOString().split('T')[1].split('.')[0];
        const logEntry = `${dateString} ${timeString} - Обновление цен завершено\n`;
        
        await fs.appendFile(PRICES_LOG_FILE, logEntry, 'utf-8');
        logger.info(`📝 Дата обновления цен сохранена: ${dateString} ${timeString}`);
    } catch (error) {
        logger.error(`❌ Ошибка при сохранении даты обновления: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Функция для проверки, обновлялись ли данные сегодня
function isDataUpToDate(symbol: string): boolean {
    try {
        const csvPath = getCSVPath(symbol);
        
        // Проверяем существование файла
        if (!fs.existsSync(csvPath)) {
            return false;
        }
        
        // Получаем время последнего изменения файла
        const stats = fs.statSync(csvPath);
        const lastModified = new Date(stats.mtime);
        const today = new Date();
        
        // Сравниваем даты (без времени)
        const lastModifiedDate = lastModified.toDateString();
        const todayDate = today.toDateString();
        
        return lastModifiedDate === todayDate;
    } catch (error) {
        logger.warn(`⚠️ Ошибка при проверке даты для ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
    }
}

// Функция для получения данных акции через различные источники
async function fetchStockData(symbol: string): Promise<StockData[]> {
    try {
        // Проверяем, является ли актив облигацией
        if (symbol.startsWith('OFZ-')) {
            logger.info(`📈 Получаем данные для облигации ${symbol}...`);
            return await bondDataSources.fetchBondData(symbol, 365);
        }
        
        // Проверяем, является ли актив российским
        if (isRussianAsset(symbol)) {
            logger.info(`🇷🇺 Получаем данные для российского актива ${symbol}...`);
            return await russianDataSources.fetchRussianStockData(symbol, 365);
        }
        
        // Для не-российских активов используем Yahoo Finance
        logger.info(`🇺🇸 Получаем данные для международного актива ${symbol} через Yahoo Finance...`);
        
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
    
    const csvPath = getCSVPath(symbol);
    
    // Создаем папку, если она не существует
    const dir = path.dirname(csvPath);
    await fs.ensureDir(dir);
    
    await fs.writeFile(csvPath, csvContent, 'utf-8');
    
    const index = getTickerIndex(symbol);
    logger.info(`💾 Сохранено в ${index.toUpperCase()}: ${symbol}.csv`);
}

// Основная функция
async function main(): Promise<void> {
    logger.info('🚀 Начинаем загрузку данных акций...');
    
    try {
        // Создаем все необходимые папки для тикеров
        await ensureTickerDirectories();
    } catch (error) {
        logger.error('❌ Ошибка при создании папок:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
    
    // Проверяем дату последнего обновления цен
    const lastUpdateDate = await getLastPricesUpdateDate();
    const today = new Date();
    const todayDate = today.toISOString().split('T')[0];
    
    if (lastUpdateDate) {
        const lastUpdateDateString = lastUpdateDate.toISOString().split('T')[0];
        if (lastUpdateDateString === todayDate) {
            logger.info(`⏭️ Цены уже обновлялись сегодня (${todayDate}). Пропускаем загрузку.`);
            logger.info(`📝 Последнее обновление: ${lastUpdateDateString}`);
            return;
        }
    }
    
    // Используем импортированный массив символов
    const symbols = stockSymbols;
    
    logger.info(`📊 Проверяем данные для ${symbols.length} активов...`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    try {
        for (const ticker of symbols) {
            logger.info(`\n📊 Проверяю ${ticker}...`);
            
            // Проверяем, нужно ли обновлять данные
            if (isDataUpToDate(ticker)) {
                logger.info(`⏭️ ${ticker}: данные уже актуальны (обновлялись сегодня)`);
                skippedCount++;
                continue;
            }
            
            logger.info(`📥 ${ticker}: загружаю новые данные...`);
            
            try {
                const data = await fetchStockData(ticker);
                
                if (data.length === 0) {
                    logger.info(`❌ Нет данных для ${ticker}`);
                    continue;
                }
                
                await saveToCSV(ticker, data);
                updatedCount++;
                
                // Небольшая задержка между запросами
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                logger.error(`❌ Ошибка для ${ticker}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        
        // Сохраняем дату обновления цен
        await savePricesUpdateDate();
        
        logger.info('\n🎉 Загрузка завершена!');
        logger.info(`📊 Статистика:`);
        logger.info(`  ✅ Обновлено: ${updatedCount} тикеров`);
        logger.info(`  ⏭️ Пропущено: ${skippedCount} тикеров`);
        logger.info(`  📁 Файлы сохранены в папке: ${TICKERS_DIR}/`);
        logger.info(`  📝 Дата обновления сохранена в: ${PRICES_LOG_FILE}`);
        
    } catch (error) {
        logger.error('❌ Критическая ошибка:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}

// Запускаем скрипт
main(); 