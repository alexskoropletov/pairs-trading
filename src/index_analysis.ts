import * as fs from 'fs-extra';
import path from 'path';
import { CorrelationPair, AssetInfo } from './types';
import { stockSymbols, sp500StocksFallback, nasdaq100StocksFallback, imoexStocksFallback, rucbitrStocksFallback, rgbiStocksFallback } from './stock';
import { ensureTickerDirectories } from './utils';
import logger from './logger';

const STATS_DIR = 'stats';

// Интерфейс для анализа конкретного индекса
interface IndexAnalysis {
    indexName: string;
    totalPairs: number;
    averageCorrelation: number;
    maxCorrelation: number;
    minCorrelation: number;
    correlationThreshold: number;
    topPairs: CorrelationPair[];
    assetsInfo: AssetInfo[];
    analysisDate: string;
}

// Настройки корреляции для каждого индекса
const INDEX_CORRELATION_THRESHOLDS = {
    'S&P500': 0.7,    // 70% для американских акций
    'NASDAQ': 0.75,    // 75% для технологических акций
    'IMOEX': 0.8,      // 80% для российских акций (высокая корреляция)
    'RUCBITR': 0.6,    // 60% для корпоративных облигаций
    'RGBI': 0.65       // 65% для облигаций
};

// Эмодзи для индексов
const INDEX_EMOJIS = {
    'S&P500': '📊',
    'NASDAQ': '📈',
    'IMOEX': '🇷🇺',
    'RUCBITR': '🏢',
    'RGBI': '📈'
};

// Цвета для индексов (зарезервировано для будущего использования)
// const INDEX_COLORS = {
//     'S&P500': '#3498db',
//     'NASDAQ': '#2ecc71',
//     'IMOEX': '#e74c3c',
//     'RUCBITR': '#9b59b6',
//     'RGBI': '#f39c12'
// };

// Функция для получения корреляции для конкретного индекса
function getCorrelationForIndex(indexName: string): number {
    return INDEX_CORRELATION_THRESHOLDS[indexName as keyof typeof INDEX_CORRELATION_THRESHOLDS] || 0.7;
}

// Функция для анализа конкретного индекса
async function analyzeIndex(indexName: string, symbols: string[], horizonDays: number = 63): Promise<IndexAnalysis> {
    logger.info(`${INDEX_EMOJIS[indexName as keyof typeof INDEX_EMOJIS]} Анализируем ${indexName}...`);
    
    // Импортируем функции из pairs_trading.ts
    const { analyzePairsInIndex, collectAssetsInfo } = await import('./pairs_trading');
    
    // Анализируем пары для данного индекса
    const pairs = await analyzePairsInIndex(symbols, indexName, horizonDays);
    
    // Собираем информацию об активах
    const assetsInfo = await collectAssetsInfo(symbols, indexName);
    
    // Вычисляем статистику
    const correlations = pairs.map((p: CorrelationPair) => p.correlation);
    const averageCorrelation = correlations.length > 0 ? correlations.reduce((sum: number, val: number) => sum + val, 0) / correlations.length : 0;
    const maxCorrelation = correlations.length > 0 ? Math.max(...correlations) : 0;
    const minCorrelation = correlations.length > 0 ? Math.min(...correlations) : 0;
    
    // Получаем порог корреляции для данного индекса
    const correlationThreshold = getCorrelationForIndex(indexName);
    
    // Фильтруем топ-пары по порогу корреляции
    const topPairs = pairs
        .filter((p: CorrelationPair) => p.correlation >= correlationThreshold)
        .sort((a: CorrelationPair, b: CorrelationPair) => b.correlation - a.correlation)
        .slice(0, 10); // Топ-10 пар
    
    const analysis: IndexAnalysis = {
        indexName,
        totalPairs: pairs.length,
        averageCorrelation,
        maxCorrelation,
        minCorrelation,
        correlationThreshold,
        topPairs,
        assetsInfo,
        analysisDate: new Date().toISOString()
    };
    
    logger.info(`${INDEX_EMOJIS[indexName as keyof typeof INDEX_EMOJIS]} ${indexName}: ${pairs.length} пар, средняя корреляция ${(averageCorrelation * 100).toFixed(2)}%, топ-пар: ${topPairs.length}`);
    
    return analysis;
}

// Функция для сохранения отчета по индексу
async function saveIndexReport(analysis: IndexAnalysis): Promise<void> {
    // Создаем папку для конкретного индекса
    const indexNameLower = analysis.indexName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const reportDir = path.join(STATS_DIR, indexNameLower);
    await fs.ensureDir(reportDir);
    
    const fileName = `pairs_analysis.json`;
    const filePath = path.join(reportDir, fileName);
    
    await fs.writeJson(filePath, analysis, { spaces: 2 });
    logger.info(`💾 Отчет ${analysis.indexName} сохранен: ${filePath}`);
}

// Функция для отображения результатов по индексу
function displayIndexResults(analysis: IndexAnalysis): void {
    const emoji = INDEX_EMOJIS[analysis.indexName as keyof typeof INDEX_EMOJIS];
    
    logger.info(`\n${emoji} ОТЧЕТ ПО ${analysis.indexName}:`);
    logger.info('=' .repeat(50));
    logger.info(`Всего проанализировано пар: ${analysis.totalPairs}`);
    logger.info(`Порог корреляции: ${(analysis.correlationThreshold * 100).toFixed(0)}%`);
    logger.info(`Средняя корреляция: ${(analysis.averageCorrelation * 100).toFixed(2)}%`);
    logger.info(`Максимальная корреляция: ${(analysis.maxCorrelation * 100).toFixed(2)}%`);
    logger.info(`Минимальная корреляция: ${(analysis.minCorrelation * 100).toFixed(2)}%`);
    logger.info(`Топ-пар найдено: ${analysis.topPairs.length}`);
    
    if (analysis.topPairs.length > 0) {
        logger.info(`\n${emoji} ТОП-ПАРЫ ${analysis.indexName}:`);
        analysis.topPairs.forEach((pair, index) => {
            logger.info(`${index + 1}. ${pair.asset1} ↔ ${pair.asset2}`);
            logger.info(`   Корреляция: ${(pair.correlation * 100).toFixed(2)}%`);
            logger.info(`   Стратегия: ${pair.strategy}`);
            logger.info(`   Волатильность: ${pair.volatility1.toFixed(2)}% / ${pair.volatility2.toFixed(2)}%`);
        });
    }
}

// Функция для создания инфографики по индексу
async function createIndexInfographic(analysis: IndexAnalysis): Promise<void> {
    try {
        // Импортируем генератор инфографики
        const { InfographicGenerator } = await import('./create_infographic');
        
        // Создаем адаптированную инфографику для индекса
        const generator = new InfographicGenerator();
        await generator.generateIndexInfographic(analysis);
        
        logger.info(`🎨 Инфографика ${analysis.indexName} создана`);
    } catch (error) {
        logger.error(`❌ Ошибка создания инфографики для ${analysis.indexName}:`, error);
    }
}

// Основная функция для анализа всех индексов
export async function analyzeAllIndexes(horizonDays: number = 63): Promise<void> {
    logger.info('🎯 Начинаем анализ пар по индексам...');
    
    try {
        // Создаем папки
        await fs.ensureDir(STATS_DIR);
        await ensureTickerDirectories();
        
        // Разделяем тикеры по индексам
        const sp500Symbols = sp500StocksFallback.map(stock => stock.symbol).filter(symbol => stockSymbols.includes(symbol));
        const nasdaqSymbols = nasdaq100StocksFallback.map(stock => stock.symbol).filter(symbol => stockSymbols.includes(symbol));
        const imoexSymbols = imoexStocksFallback.map(stock => stock.symbol).filter(symbol => stockSymbols.includes(symbol));
        const rucbitrSymbols = rucbitrStocksFallback.map(stock => stock.symbol).filter(symbol => stockSymbols.includes(symbol));
        const rgbiSymbols = rgbiStocksFallback.map(stock => stock.symbol).filter(symbol => stockSymbols.includes(symbol));
        
        // Анализируем каждый индекс
        const analyses: IndexAnalysis[] = [];
        
        if (sp500Symbols.length > 0) {
            const sp500Analysis = await analyzeIndex('S&P500', sp500Symbols, horizonDays);
            analyses.push(sp500Analysis);
            await saveIndexReport(sp500Analysis);
            displayIndexResults(sp500Analysis);
            await createIndexInfographic(sp500Analysis);
        }
        
        if (nasdaqSymbols.length > 0) {
            const nasdaqAnalysis = await analyzeIndex('NASDAQ', nasdaqSymbols, horizonDays);
            analyses.push(nasdaqAnalysis);
            await saveIndexReport(nasdaqAnalysis);
            displayIndexResults(nasdaqAnalysis);
            await createIndexInfographic(nasdaqAnalysis);
        }
        
        if (imoexSymbols.length > 0) {
            const imoexAnalysis = await analyzeIndex('IMOEX', imoexSymbols, horizonDays);
            analyses.push(imoexAnalysis);
            await saveIndexReport(imoexAnalysis);
            displayIndexResults(imoexAnalysis);
            await createIndexInfographic(imoexAnalysis);
        }
        
        if (rucbitrSymbols.length > 0) {
            const rucbitrAnalysis = await analyzeIndex('RUCBITR', rucbitrSymbols, horizonDays);
            analyses.push(rucbitrAnalysis);
            await saveIndexReport(rucbitrAnalysis);
            displayIndexResults(rucbitrAnalysis);
            await createIndexInfographic(rucbitrAnalysis);
        }
        
        if (rgbiSymbols.length > 0) {
            const rgbiAnalysis = await analyzeIndex('RGBI', rgbiSymbols, horizonDays);
            analyses.push(rgbiAnalysis);
            await saveIndexReport(rgbiAnalysis);
            displayIndexResults(rgbiAnalysis);
            await createIndexInfographic(rgbiAnalysis);
        }
        
        // Создаем сводный отчет
        await createSummaryReport(analyses);
        
        logger.info('✅ Анализ по индексам завершен!');
        
    } catch (error) {
        logger.error('❌ Ошибка при анализе по индексам:', error);
        throw error;
    }
}

// Функция для создания сводного отчета
async function createSummaryReport(analyses: IndexAnalysis[]): Promise<void> {
    const summary = {
        totalIndexes: analyses.length,
        totalPairs: analyses.reduce((sum, analysis) => sum + analysis.totalPairs, 0),
        totalTopPairs: analyses.reduce((sum, analysis) => sum + analysis.topPairs.length, 0),
        indexes: analyses.map(analysis => ({
            name: analysis.indexName,
            emoji: INDEX_EMOJIS[analysis.indexName as keyof typeof INDEX_EMOJIS],
            totalPairs: analysis.totalPairs,
            topPairs: analysis.topPairs.length,
            averageCorrelation: analysis.averageCorrelation,
            maxCorrelation: analysis.maxCorrelation,
            correlationThreshold: analysis.correlationThreshold
        })),
        analysisDate: new Date().toISOString()
    };
    
    const summaryPath = path.join(STATS_DIR, 'summary.json');
    await fs.writeJson(summaryPath, summary, { spaces: 2 });
    
    logger.info('\n📊 СВОДНЫЙ ОТЧЕТ:');
    logger.info('=' .repeat(40));
    logger.info(`Всего индексов: ${summary.totalIndexes}`);
    logger.info(`Всего пар: ${summary.totalPairs}`);
    logger.info(`Всего топ-пар: ${summary.totalTopPairs}`);
    
    summary.indexes.forEach(index => {
        logger.info(`${index.emoji} ${index.name}: ${index.totalPairs} пар, ${index.topPairs} топ-пар, корреляция ${(index.averageCorrelation * 100).toFixed(2)}%`);
    });
}

// Экспортируем функции
export { analyzeIndex, saveIndexReport, displayIndexResults, createIndexInfographic }; 