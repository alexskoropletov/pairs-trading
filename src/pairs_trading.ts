import dotenv from 'dotenv';
dotenv.config();
import * as fs from 'fs-extra';
import path from 'path';
import { StockData, CSVRow, csvRowToStockData, CorrelationPair, PairsTradingAnalysis } from './types';
import { stockSymbols } from './stock';
import logger from './logger';

const STATS_DIR = 'stats';

// Получение горизонта анализа из аргументов командной строки
function getAnalysisHorizon(): number {
    const arg = process.argv.find(a => a.startsWith('--days='));
    if (arg) {
        const days = parseInt(arg.split('=')[1], 10);
        if (!isNaN(days) && days > 0) return days;
    }
    return 63; // По умолчанию 3 месяца (примерно 63 торговых дня)
}

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

// Функция для вычисления доходностей
function calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i-1]) / prices[i-1] * 100);
    }
    return returns;
}

// Функция для вычисления корреляции между двумя массивами
function calculateCorrelation(returns1: number[], returns2: number[]): number {
    const n = Math.min(returns1.length, returns2.length);
    
    const mean1 = returns1.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    const mean2 = returns2.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;
    
    for (let i = 0; i < n; i++) {
        const diff1 = returns1[i] - mean1;
        const diff2 = returns2[i] - mean2;
        
        numerator += diff1 * diff2;
        denominator1 += diff1 * diff1;
        denominator2 += diff2 * diff2;
    }
    
    if (denominator1 === 0 || denominator2 === 0) return 0;
    
    return numerator / Math.sqrt(denominator1 * denominator2);
}

// Функция для вычисления волатильности
function calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
}

// Функция для вычисления среднего дохода
function calculateAverageReturn(returns: number[]): number {
    return returns.reduce((sum, val) => sum + val, 0) / returns.length;
}

// Функция для оценки перспективности актива
function assessProspectivity(returns: number[], volatility: number): number {
    const avgReturn = calculateAverageReturn(returns);
    const sharpeRatio = avgReturn / volatility; // Упрощенный коэффициент Шарпа
    return sharpeRatio;
}

// Функция для анализа всех пар активов
async function analyzePairs(horizonDays: number): Promise<CorrelationPair[]> {
    logger.info(`🔍 Анализируем корреляции между всеми парами активов за последние ${horizonDays} дней...`);
    
    const pairs: CorrelationPair[] = [];
    const symbols = stockSymbols;
    
    // Загружаем данные для всех активов
    const assetData: { [symbol: string]: StockData[] } = {};
    
    for (const symbol of symbols) {
        try {
            assetData[symbol] = await readCSV(symbol);
            // Оставляем только последние horizonDays записей
            if (assetData[symbol].length > horizonDays) {
                assetData[symbol] = assetData[symbol].slice(-horizonDays);
            }
            logger.info(`✅ Загружены данные для ${symbol}`);
        } catch (error) {
            logger.error(`❌ Ошибка загрузки данных для ${symbol}: ${error}`);
            continue;
        }
    }
    
    // Анализируем все возможные пары
    for (let i = 0; i < symbols.length; i++) {
        for (let j = i + 1; j < symbols.length; j++) {
            const symbol1 = symbols[i];
            const symbol2 = symbols[j];
            
            if (!assetData[symbol1] || !assetData[symbol2]) continue;
            
            // Вычисляем доходности
            const prices1 = assetData[symbol1].map(d => d.Close);
            const prices2 = assetData[symbol2].map(d => d.Close);
            
            const returns1 = calculateReturns(prices1);
            const returns2 = calculateReturns(prices2);
            
            // Вычисляем корреляцию
            const correlation = calculateCorrelation(returns1, returns2);
            
            // Вычисляем волатильности
            const volatility1 = calculateVolatility(returns1);
            const volatility2 = calculateVolatility(returns2);

            if (
                !correlation
                || !volatility1
                || !volatility2
            ) {
                continue;
            }

            // console.log('[>>>>]', symbol1, symbol2, correlation, volatility1, volatility2);
            
            // Оцениваем перспективность
            const prospectivity1 = assessProspectivity(returns1, volatility1);
            const prospectivity2 = assessProspectivity(returns2, volatility2);
            
            // Определяем какой актив более перспективен
            const longAsset = prospectivity1 > prospectivity2 ? symbol1 : symbol2;
            const shortAsset = prospectivity1 > prospectivity2 ? symbol2 : symbol1;
            const longProspectivity = Math.max(prospectivity1, prospectivity2);
            const shortProspectivity = Math.min(prospectivity1, prospectivity2);
            
            pairs.push({
                asset1: symbol1,
                asset2: symbol2,
                correlation: Math.abs(correlation), // Берем абсолютное значение
                longAsset,
                shortAsset,
                longProspectivity,
                shortProspectivity,
                volatility1,
                volatility2,
                avgReturn1: calculateAverageReturn(returns1),
                avgReturn2: calculateAverageReturn(returns2),
                strategy: `LONG ${longAsset} / SHORT ${shortAsset}`
            });
        }
    }
    
    return pairs;
}

// Функция для сохранения результатов
async function saveResults(topPairs: CorrelationPair[], analysis: PairsTradingAnalysis): Promise<void> {
    // Сохраняем топ-3 пары
    const pairsData = topPairs.map(pair => ({
        asset1: pair.asset1,
        asset2: pair.asset2,
        correlation: pair.correlation.toFixed(4),
        longAsset: pair.longAsset,
        shortAsset: pair.shortAsset,
        strategy: pair.strategy,
        longProspectivity: pair.longProspectivity.toFixed(4),
        shortProspectivity: pair.shortProspectivity.toFixed(4),
        volatility1: pair.volatility1.toFixed(4),
        volatility2: pair.volatility2.toFixed(4),
        avgReturn1: pair.avgReturn1.toFixed(4),
        avgReturn2: pair.avgReturn2.toFixed(4)
    }));
    
    await fs.writeJson('stats/pairs_trading.csv', pairsData, { spaces: 2 });
    
    // Сохраняем полный анализ
    await fs.writeJson('stats/pairs_analysis.json', analysis, { spaces: 2 });
    
    logger.info('💾 Результаты сохранены в stats/pairs_trading.csv и stats/pairs_analysis.json');
}

// Функция для вывода результатов
function displayResults(topPairs: CorrelationPair[], analysis: PairsTradingAnalysis): void {
    logger.info('\n🎯 ТОП-3 ПАРЫ ДЛЯ ПАРНОГО ТРЕЙДИНГА:');
    logger.info('=' .repeat(80));
    
    topPairs.forEach((pair, index) => {
        logger.info(`\n${index + 1}. ${pair.asset1} ↔ ${pair.asset2}`);
        logger.info(`   Корреляция: ${(pair.correlation * 100).toFixed(2)}%`);
        logger.info(`   Стратегия: ${pair.strategy}`);
        logger.info(`   Перспективность LONG: ${pair.longProspectivity.toFixed(4)}`);
        logger.info(`   Перспективность SHORT: ${pair.shortProspectivity.toFixed(4)}`);
        logger.info(`   Волатильность ${pair.asset1}: ${pair.volatility1.toFixed(2)}%`);
        logger.info(`   Волатильность ${pair.asset2}: ${pair.volatility2.toFixed(2)}%`);
        logger.info(`   Средняя доходность ${pair.asset1}: ${pair.avgReturn1.toFixed(4)}%`);
        logger.info(`   Средняя доходность ${pair.asset2}: ${pair.avgReturn2.toFixed(4)}%`);
    });
    
    logger.info('\n📊 СТАТИСТИКА АНАЛИЗА:');
    logger.info('=' .repeat(50));
    logger.info(`Всего проанализировано пар: ${analysis.totalPairs}`);
    logger.info(`Средняя корреляция: ${(analysis.averageCorrelation * 100).toFixed(2)}%`);
    logger.info(`Максимальная корреляция: ${(analysis.maxCorrelation * 100).toFixed(2)}%`);
    logger.info(`Минимальная корреляция: ${(analysis.minCorrelation * 100).toFixed(2)}%`);
    
    logger.info('\n💡 РЕКОМЕНДАЦИИ:');
    logger.info('=' .repeat(50));
    logger.info('• Высокая корреляция (>0.7) - хорошая основа для парного трейдинга');
    logger.info('• Разница в перспективности - возможность для прибыли');
    logger.info('• Мониторьте расхождения между активами');
    logger.info('• Используйте стоп-лоссы для управления рисками');
}

// Основная функция
async function main(): Promise<void> {
    logger.info('🎯 Анализ пар активов для парного трейдинга...');
    
    try {
        // Создаем папку stats если её нет
        await fs.ensureDir(STATS_DIR);
        
        // Получаем горизонт анализа
        const horizonDays = getAnalysisHorizon();
        
        // Анализируем все пары
        const allPairs = await analyzePairs(horizonDays);
        
        // Сортируем по корреляции (по убыванию)
        const sortedPairs = allPairs.sort((a, b) => b.correlation - a.correlation);
        
        // Берем топ-3 пары
        const topPairs = sortedPairs.slice(0, process.env.TOP_PAIRS_COUNT ? parseInt(process.env.TOP_PAIRS_COUNT) : 3);
        
        // Вычисляем статистику
        const correlations = allPairs.map(p => p.correlation);
        const analysis: PairsTradingAnalysis = {
            totalPairs: allPairs.length,
            averageCorrelation: correlations.reduce((sum, val) => sum + val, 0) / correlations.length,
            maxCorrelation: Math.max(...correlations),
            minCorrelation: Math.min(...correlations),
            topPairs: topPairs.map(p => ({
                asset1: p.asset1,
                asset2: p.asset2,
                correlation: p.correlation,
                strategy: p.strategy
            }))
        };
        
        // Сохраняем результаты
        await saveResults(topPairs, analysis);
        
        // Выводим результаты
        displayResults(topPairs, analysis);
        
        logger.info('\n✅ Анализ парного трейдинга завершен!');
        
    } catch (error) {
        logger.error('❌ Ошибка при анализе пар:', error);
        process.exit(1);
    }
}

// Запускаем скрипт
if (require.main === module) {
    main();
} 
