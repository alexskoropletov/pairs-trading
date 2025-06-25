import * as fs from 'fs-extra';
import path from 'path';
import * as plotly from 'nodeplotlib';
import { StockData, CSVRow, csvRowToStockData } from './types';
import { stockSymbols } from './stock';
import logger from './logger';

const STATS_DIR = 'stats';

// Функция для чтения CSV файла
async function readCSV(symbol: string): Promise<StockData[]> {
    const csvPath = path.join(STATS_DIR, `${symbol}.csv`);
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    const data: StockData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',');
            const row: CSVRow = {};
            headers.forEach((header: string, index: number) => {
                row[header.trim()] = values[index] ? parseFloat(values[index]) : 0;
            });
            data.push(csvRowToStockData(row));
        }
    }
    return data;
}

// Функция для вычисления дневных доходностей
function calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        const ret = (prices[i] - prices[i - 1]) / prices[i - 1];
        returns.push(ret * 100); // в процентах
    }
    return returns;
}

// Функция для построения и сохранения гистограммы
async function plotHistogram(symbol: string, returns: number[]): Promise<void> {
    const trace = {
        x: returns,
        type: 'histogram' as const,
        marker: { color: '#1f77b4' },
        nbinsx: 50,
        name: symbol
    };
    
    const layout = {
        title: `Распределение дневных доходностей (%) для ${symbol}`,
        xaxis: { title: 'Дневная доходность (%)' },
        yaxis: { title: 'Частота' },
        bargap: 0.05
    };
    
    // Показываем график
    plotly.plot([trace], layout);
    
    logger.info(`✅ Гистограмма создана для ${symbol}`);
    
    // Небольшая задержка между графиками
    await new Promise(resolve => setTimeout(resolve, 2000));
}

// Основная функция
async function main(): Promise<void> {
    logger.info('📊 Анализ распределения доходностей...');
    
    // Используем импортированный массив символов
    const symbols = stockSymbols;
    
    logger.info(`📈 Анализируем ${symbols.length} активов...`);
    
    try {
        logger.info('📊 Построение гистограмм распределения доходностей...\n');
        
        for (const symbol of symbols) {
            try {
                logger.info(`📈 Обрабатываю ${symbol}...`);
                const data = await readCSV(symbol);
                
                if (data.length < 2) {
                    logger.warn(`⚠️ Недостаточно данных для ${symbol}`);
                    continue;
                }
                
                const prices = data.map(row => row.Close).filter(price => price > 0);
                const returns = calculateReturns(prices);
                
                if (returns.length === 0) {
                    logger.warn(`⚠️ Нет доходностей для ${symbol}`);
                    continue;
                }
                
                // Вычисляем статистику
                const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
                const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
                const stdDev = Math.sqrt(variance);
                
                logger.info(`✅ ${symbol}: ${returns.length} дней, средняя доходность: ${mean.toFixed(2)}%, ст.отклонение: ${stdDev.toFixed(2)}%`);
                
                await plotHistogram(symbol, returns);
                
            } catch (error) {
                logger.error(`❌ Ошибка для ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        
        logger.info('\n🎉 Все графики построены!');
        logger.info('📁 HTML файлы сохранены в папке stats/');
        
    } catch (error) {
        logger.error('❌ Критическая ошибка:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}

// Запускаем скрипт
main(); 