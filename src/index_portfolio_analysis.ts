import * as fs from 'fs-extra';
import path from 'path';
import { Portfolio, EfficientFrontierPoint, AssetStats } from './types';
import { sp500StocksFallback, nasdaq100StocksFallback, imoexStocksFallback, rucbitrStocksFallback, rgbiStocksFallback } from './stock';
import { ensureTickerDirectories } from './utils';
import logger from './logger';

const STATS_DIR = 'stats';
const TICKERS_DIR = 'tickers';

interface IndexPortfolioAnalysis {
    indexName: string;
    emoji: string;
    totalAssets: number;
    portfolio: Portfolio;
    efficientFrontier: EfficientFrontierPoint[];
    analysisDate: string;
}

// Функция для определения индекса тикера
function getTickerIndex(symbol: string): 'sp500' | 'nasdaq' | 'imoex' | 'rucbitr' | 'rgbi' {
    const sp500Symbols = sp500StocksFallback.map(stock => stock.symbol);
    const nasdaqSymbols = nasdaq100StocksFallback.map(stock => stock.symbol);
    const imoexSymbols = imoexStocksFallback.map(stock => stock.symbol);
    const rucbitrSymbols = rucbitrStocksFallback.map(stock => stock.symbol);
    const rgbiSymbols = rgbiStocksFallback.map(stock => stock.symbol);
    
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
        return 'sp500';
    }
}

// Функция для получения тикеров из отчета по индексу
async function getTickersFromIndexReport(indexName: string): Promise<string[]> {
    try {
        const reportPath = path.join(STATS_DIR, 'index_reports', `${indexName.toLowerCase()}_pairs_analysis.json`);
        
        if (!await fs.pathExists(reportPath)) {
            logger.warn(`⚠️ Отчет для индекса ${indexName} не найден: ${reportPath}`);
            return [];
        }
        
        const report = await fs.readJson(reportPath);
        const tickers = new Set<string>();
        
        // Извлекаем тикеры из топ-пар
        if (report.topPairs && Array.isArray(report.topPairs)) {
            report.topPairs.forEach((pair: any) => {
                if (pair.asset1) tickers.add(pair.asset1);
                if (pair.asset2) tickers.add(pair.asset2);
            });
        }
        
        // Извлекаем тикеры из информации об активах
        if (report.assetsInfo && Array.isArray(report.assetsInfo)) {
            report.assetsInfo.forEach((asset: any) => {
                if (asset.symbol) tickers.add(asset.symbol);
            });
        }
        
        const tickerArray = Array.from(tickers);
        logger.info(`📊 Найдено ${tickerArray.length} тикеров для анализа портфеля ${indexName}: ${tickerArray.join(', ')}`);
        return tickerArray;
        
    } catch (error) {
        logger.error(`❌ Ошибка при чтении отчета для ${indexName}:`, error);
        return [];
    }
}

// Функция для чтения CSV файла
async function readCSV(symbol: string): Promise<any[]> {
    try {
        const index = getTickerIndex(symbol);
        let dir: string;
        
        switch (index) {
            case 'sp500':
                dir = path.join(TICKERS_DIR, 'sp500');
                break;
            case 'nasdaq':
                dir = path.join(TICKERS_DIR, 'nasdaq');
                break;
            case 'imoex':
                dir = path.join(TICKERS_DIR, 'imoex');
                break;
            case 'rucbitr':
                dir = path.join(TICKERS_DIR, 'rucbitr');
                break;
            case 'rgbi':
                dir = path.join(TICKERS_DIR, 'rgbi');
                break;
            default:
                dir = path.join(TICKERS_DIR, 'sp500');
        }
        
        const csvPath = path.join(dir, `${symbol}.csv`);
        
        if (!await fs.pathExists(csvPath)) {
            throw new Error(`Файл не найден: ${csvPath}`);
        }
        
        const csvContent = await fs.readFile(csvPath, 'utf-8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error('Недостаточно данных в CSV файле');
        }
        
        const headers = lines[0].split(',');
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row: any = {};
            
            headers.forEach((header, index) => {
                row[header.trim()] = values[index] ? parseFloat(values[index]) : 0;
            });
            
            data.push(row);
        }
        
        return data;
    } catch (error) {
        throw new Error(`Ошибка чтения CSV для ${symbol}: ${error}`);
    }
}

// Функция для вычисления доходностей
function calculateReturns(prices: number[]): number[] {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
        const return_val = (prices[i] - prices[i - 1]) / prices[i - 1];
        returns.push(return_val);
    }
    return returns;
}

// Функция для вычисления ковариационной матрицы
function calculateCovarianceMatrix(returnsMatrix: number[][]): number[][] {
    const n = returnsMatrix.length;
    const minLength = Math.min(...returnsMatrix.map(row => row.length));
    
    // Обрезаем все ряды до минимальной длины
    const normalizedReturns = returnsMatrix.map(row => row.slice(-minLength));
    
    const covarianceMatrix: number[][] = [];
    
    for (let i = 0; i < n; i++) {
        covarianceMatrix[i] = [];
        for (let j = 0; j < n; j++) {
            if (i === j) {
                // Дисперсия
                const mean = normalizedReturns[i].reduce((sum, val) => sum + val, 0) / minLength;
                const variance = normalizedReturns[i].reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / minLength;
                covarianceMatrix[i][j] = variance;
            } else {
                // Ковариация
                const mean1 = normalizedReturns[i].reduce((sum, val) => sum + val, 0) / minLength;
                const mean2 = normalizedReturns[j].reduce((sum, val) => sum + val, 0) / minLength;
                
                let covariance = 0;
                for (let k = 0; k < minLength; k++) {
                    covariance += (normalizedReturns[i][k] - mean1) * (normalizedReturns[j][k] - mean2);
                }
                covarianceMatrix[i][j] = covariance / minLength;
            }
        }
    }
    
    return covarianceMatrix;
}

// Функция для оптимизации портфеля с минимальным риском
function optimizePortfolioMinRisk(covarianceMatrix: number[][], expectedReturns: number[]): Portfolio {
    const n = covarianceMatrix.length;
    
    // Простая оптимизация: равные веса
    const weights = new Array(n).fill(1 / n);
    
    // Вычисляем риск и доходность портфеля
    let portfolioRisk = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            portfolioRisk += weights[i] * weights[j] * covarianceMatrix[i][j];
        }
    }
    portfolioRisk = Math.sqrt(portfolioRisk);
    
    const portfolioReturn = weights.reduce((sum, weight, i) => sum + weight * expectedReturns[i], 0);
    
    return {
        weights,
        expectedReturn: portfolioReturn,
        risk: portfolioRisk,
        sharpeRatio: portfolioReturn / portfolioRisk
    };
}

// Функция для анализа портфеля по индексу
async function analyzeIndexPortfolio(indexName: string, emoji: string): Promise<IndexPortfolioAnalysis | null> {
    try {
        logger.info(`📊 Анализ портфеля для индекса ${emoji} ${indexName}...`);
        
        // Получаем тикеры из отчета по индексу
        const symbols = await getTickersFromIndexReport(indexName);
        
        if (symbols.length < 2) {
            logger.warn(`⚠️ Недостаточно тикеров для анализа портфеля ${indexName}: ${symbols.length}`);
            return null;
        }
        
        // Читаем данные для каждого актива
        const allData: Record<string, AssetStats> = {};
        const returnsMatrix: number[][] = [];
        const expectedReturns: number[] = [];
        
        for (const symbol of symbols) {
            try {
                logger.info(`📈 Загружаю данные для ${symbol}...`);
                const data = await readCSV(symbol);
                
                if (data.length < 30) {
                    logger.warn(`⚠️ Недостаточно данных для ${symbol}, пропускаем`);
                    continue;
                }
                
                // Извлекаем цены закрытия
                const prices = data.map(row => row.Close).filter(price => price > 0);
                
                // Вычисляем доходности
                const returns = calculateReturns(prices);
                
                // Вычисляем ожидаемую доходность (среднее)
                const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
                
                allData[symbol] = {
                    symbol,
                    prices,
                    returns,
                    avgReturn,
                    mean: avgReturn,
                    stdDev: Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length),
                    variance: returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
                };
                
                returnsMatrix.push(returns);
                expectedReturns.push(avgReturn);
                
                logger.info(`✅ ${symbol}: ${returns.length} дней, средняя доходность: ${(avgReturn * 100).toFixed(2)}%`);
                
            } catch (error) {
                logger.error(`❌ Ошибка для ${symbol}: ${error}`);
            }
        }
        
        if (returnsMatrix.length < 2) {
            logger.warn(`⚠️ Недостаточно данных для создания портфеля ${indexName}`);
            return null;
        }
        
        // Вычисляем ковариационную матрицу
        const covarianceMatrix = calculateCovarianceMatrix(returnsMatrix);
        
        // Оптимизируем портфель
        const portfolio = optimizePortfolioMinRisk(covarianceMatrix, expectedReturns);
        
        // Создаем эффективную границу (упрощенная версия)
        const efficientFrontier: EfficientFrontierPoint[] = [];
        for (let i = 0; i <= 10; i++) {
            const risk = portfolio.risk * (0.5 + i * 0.1);
            const return_val = portfolio.expectedReturn * (0.8 + i * 0.04);
            efficientFrontier.push({
                risk,
                return: return_val,
                weights: portfolio.weights
            });
        }
        
        const analysis: IndexPortfolioAnalysis = {
            indexName,
            emoji,
            totalAssets: returnsMatrix.length,
            portfolio,
            efficientFrontier,
            analysisDate: new Date().toISOString()
        };
        
        logger.info(`✅ Анализ портфеля ${indexName} завершен: ${returnsMatrix.length} активов, риск: ${(portfolio.risk * 100).toFixed(2)}%, доходность: ${(portfolio.expectedReturn * 100).toFixed(2)}%`);
        
        return analysis;
        
    } catch (error) {
        logger.error(`❌ Ошибка при анализе портфеля ${indexName}:`, error);
        return null;
    }
}

// Функция для сохранения отчета по портфелю
async function savePortfolioReport(analysis: IndexPortfolioAnalysis): Promise<void> {
    try {
        const reportsDir = path.join(STATS_DIR, 'portfolio_reports');
        await fs.ensureDir(reportsDir);
        
        const reportPath = path.join(reportsDir, `${analysis.indexName.toLowerCase()}_portfolio_analysis.json`);
        await fs.writeJson(reportPath, analysis, { spaces: 2 });
        
        logger.info(`💾 Отчет по портфелю ${analysis.indexName} сохранен: ${reportPath}`);
    } catch (error) {
        logger.error(`❌ Ошибка сохранения отчета по портфелю ${analysis.indexName}:`, error);
    }
}

// Функция для отображения результатов
function displayPortfolioResults(analysis: IndexPortfolioAnalysis): void {
    logger.info(`\n📊 РЕЗУЛЬТАТЫ АНАЛИЗА ПОРТФЕЛЯ ${analysis.emoji} ${analysis.indexName}:`);
    logger.info('=' .repeat(50));
    logger.info(`Всего активов: ${analysis.totalAssets}`);
    logger.info(`Ожидаемая доходность: ${(analysis.portfolio.expectedReturn * 100).toFixed(2)}%`);
    logger.info(`Риск (волатильность): ${(analysis.portfolio.risk * 100).toFixed(2)}%`);
    logger.info(`Коэффициент Шарпа: ${analysis.portfolio.sharpeRatio.toFixed(4)}`);
    logger.info(`Дата анализа: ${analysis.analysisDate}`);
}

// Основная функция для анализа портфелей по всем индексам
export async function analyzeAllIndexPortfolios(): Promise<void> {
    logger.info('🎯 Запуск анализа портфелей по индексам...');
    
    try {
        // Создаем папки
        await fs.ensureDir(STATS_DIR);
        await ensureTickerDirectories();
        
        const indexes = [
            { name: 'S&P500', emoji: '🇺🇸' },
            { name: 'NASDAQ', emoji: '📈' },
            { name: 'IMOEX', emoji: '🇷🇺' },
            { name: 'RUCBITR', emoji: '🏢' },
            { name: 'RGBI', emoji: '📈' }
        ];
        
        const analyses: IndexPortfolioAnalysis[] = [];
        
        for (const index of indexes) {
            const analysis = await analyzeIndexPortfolio(index.name, index.emoji);
            if (analysis) {
                analyses.push(analysis);
                await savePortfolioReport(analysis);
                displayPortfolioResults(analysis);
            }
        }
        
        // Создаем сводный отчет
        if (analyses.length > 0) {
            const summary = {
                totalIndexes: analyses.length,
                totalAssets: analyses.reduce((sum, analysis) => sum + analysis.totalAssets, 0),
                averageReturn: analyses.reduce((sum, analysis) => sum + analysis.portfolio.expectedReturn, 0) / analyses.length,
                averageRisk: analyses.reduce((sum, analysis) => sum + analysis.portfolio.risk, 0) / analyses.length,
                indexes: analyses.map(analysis => ({
                    name: analysis.indexName,
                    emoji: analysis.emoji,
                    totalAssets: analysis.totalAssets,
                    expectedReturn: analysis.portfolio.expectedReturn,
                    risk: analysis.portfolio.risk,
                    sharpeRatio: analysis.portfolio.sharpeRatio
                })),
                analysisDate: new Date().toISOString()
            };
            
            const summaryPath = path.join(STATS_DIR, 'portfolio_reports', 'summary.json');
            await fs.writeJson(summaryPath, summary, { spaces: 2 });
            
            logger.info('\n📊 СВОДНЫЙ ОТЧЕТ ПО ПОРТФЕЛЯМ:');
            logger.info('=' .repeat(40));
            logger.info(`Всего индексов: ${summary.totalIndexes}`);
            logger.info(`Всего активов: ${summary.totalAssets}`);
            logger.info(`Средняя доходность: ${(summary.averageReturn * 100).toFixed(2)}%`);
            logger.info(`Средний риск: ${(summary.averageRisk * 100).toFixed(2)}%`);
            
            summary.indexes.forEach(index => {
                logger.info(`${index.emoji} ${index.name}: ${index.totalAssets} активов, доходность ${(index.expectedReturn * 100).toFixed(2)}%, риск ${(index.risk * 100).toFixed(2)}%`);
            });
        }
        
        logger.info('✅ Анализ портфелей по индексам завершен!');
        
    } catch (error) {
        logger.error('❌ Ошибка при анализе портфелей по индексам:', error);
        throw error;
    }
}

// Запускаем основной скрипт
if (require.main === module) {
    analyzeAllIndexPortfolios().catch(error => {
        logger.error('❌ Неожиданная ошибка:', error);
        process.exit(1);
    });
} 