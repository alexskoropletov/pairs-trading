import * as fs from 'fs-extra';
import path from 'path';
import { 
    StockData, 
    Portfolio, 
    EfficientFrontierPoint, 
    PortfolioSummary, 
    AssetStats, 
    CSVRow, 
    csvRowToStockData,
} from './types';
import { stockSymbols } from './stock';
import logger from './logger';

// Папка с данными
const STATS_DIR = 'stats';

// Функция для чтения результатов pairs_trading и извлечения тикеров
async function getTickersFromPairsTrading(): Promise<string[]> {
    try {
        // Пытаемся прочитать результаты pairs_trading
        const pairsData = await fs.readJson(path.join(STATS_DIR, 'pairs_analysis.json'));
        
        if (pairsData && pairsData.topPairs && Array.isArray(pairsData.topPairs)) {
            const tickers = new Set<string>();
            
            // Извлекаем тикеры из топ-пар
            pairsData.topPairs.forEach((pair: any) => {
                if (pair.asset1) tickers.add(pair.asset1);
                if (pair.asset2) tickers.add(pair.asset2);
            });
            
            const tickerArray = Array.from(tickers);
            logger.info(`📊 Найдено ${tickerArray.length} уникальных тикеров из pairs_trading: ${tickerArray.join(', ')}`);
            return tickerArray;
        }
    } catch (error) {
        logger.warn('⚠️ Не удалось прочитать pairs_analysis.json, используем все доступные тикеры');
    }
    
    // Fallback: используем все доступные тикеры
    logger.info('📊 Используем все доступные тикеры');
    return stockSymbols;
}

// Функция для чтения CSV файла
async function readCSV(symbol: string): Promise<StockData[]> {
    try {
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
    } catch (error) {
        throw new Error(`Ошибка чтения ${symbol}.csv: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Функция для вычисления дневной доходности
function calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        const return_val = (prices[i] - prices[i - 1]) / prices[i - 1];
        returns.push(return_val);
    }
    return returns;
}

// Функция для вычисления ковариационной матрицы
function calculateCovarianceMatrix(returnsMatrix: number[][]): number[][] {
    const numAssets = returnsMatrix.length;
    
    if (numAssets === 0) {
        throw new Error('Пустая матрица доходностей');
    }
    
    const numDays = returnsMatrix[0].length;
    
    if (numDays === 0) {
        throw new Error('Нет данных о доходностях');
    }
    
    // Проверяем, что все строки имеют одинаковую длину
    for (let assetIndex = 1; assetIndex < numAssets; assetIndex++) {
        if (returnsMatrix[assetIndex].length !== numDays) {
            throw new Error(`Несовпадение длины данных: строка 0 имеет ${numDays} элементов, строка ${assetIndex} имеет ${returnsMatrix[assetIndex].length} элементов`);
        }
    }
    
    // Вычисляем средние значения
    const means: number[] = [];
    for (let assetIndex = 0; assetIndex < numAssets; assetIndex++) {
        const validReturns = returnsMatrix[assetIndex].filter(r => isFinite(r) && !isNaN(r));
        if (validReturns.length === 0) {
            throw new Error(`Нет валидных данных для актива ${assetIndex}`);
        }
        const sum = validReturns.reduce((a, b) => a + b, 0);
        means.push(sum / validReturns.length);
    }
    
    // Вычисляем ковариационную матрицу
    const covarianceMatrix: number[][] = [];
    for (let assetIndex = 0; assetIndex < numAssets; assetIndex++) {
        covarianceMatrix[assetIndex] = [];
        for (let otherIndex = 0; otherIndex < numAssets; otherIndex++) {
            let sum = 0;
            let count = 0;
            
            for (let dayIndex = 0; dayIndex < numDays; dayIndex++) {
                const ri = returnsMatrix[assetIndex][dayIndex];
                const rj = returnsMatrix[otherIndex][dayIndex];
                
                // Проверяем валидность данных
                if (isFinite(ri) && !isNaN(ri) && isFinite(rj) && !isNaN(rj)) {
                    sum += (ri - means[assetIndex]) * (rj - means[otherIndex]);
                    count++;
                }
            }
            
            if (count === 0) {
                throw new Error(`Нет валидных данных для ковариации между активами ${assetIndex} и ${otherIndex}`);
            }
            
            covarianceMatrix[assetIndex][otherIndex] = sum / (count - 1);
            
            // Проверяем валидность результата
            if (!isFinite(covarianceMatrix[assetIndex][otherIndex])) {
                throw new Error(`Недопустимая ковариация между активами ${assetIndex} и ${otherIndex}: ${covarianceMatrix[assetIndex][otherIndex]}`);
            }
        }
    }
    
    // Проверяем, что диагональные элементы (дисперсии) положительные
    for (let assetIndex = 0; assetIndex < numAssets; assetIndex++) {
        if (covarianceMatrix[assetIndex][assetIndex] <= 0) {
            logger.warn(`⚠️ Предупреждение: неположительная дисперсия для актива ${assetIndex}: ${covarianceMatrix[assetIndex][assetIndex]}`);
            // Устанавливаем минимальную положительную дисперсию
            covarianceMatrix[assetIndex][assetIndex] = 1e-6;
        }
    }
    
    return covarianceMatrix;
}

// Функция для вычисления риска портфеля
function calculatePortfolioRisk(weights: number[], covarianceMatrix: number[][]): number {
    let risk = 0;
    const numAssets = weights.length;
    
    for (let assetIndex = 0; assetIndex < numAssets; assetIndex++) {
        for (let otherIndex = 0; otherIndex < numAssets; otherIndex++) {
            risk += weights[assetIndex] * weights[otherIndex] * covarianceMatrix[assetIndex][otherIndex];
        }
    }
    
    return Math.sqrt(risk);
}

// Функция для вычисления ожидаемой доходности портфеля
function calculatePortfolioReturn(weights: number[], expectedReturns: number[]): number {
    return weights.reduce((sum, weight, assetIndex) => {
        return sum + weight * expectedReturns[assetIndex];
    }, 0);
}

// Функция для оптимизации портфеля с минимальным риском
function optimizePortfolioMinRisk(covarianceMatrix: number[][], expectedReturns: number[]): Portfolio {
    const numAssets = covarianceMatrix.length;
    
    // Проверяем валидность входных данных
    if (numAssets === 0 || expectedReturns.length !== numAssets) {
        throw new Error('Неверные размеры входных данных');
    }
    
    // Проверяем, что ковариационная матрица положительно определена
    for (let assetIndex = 0; assetIndex < numAssets; assetIndex++) {
        if (covarianceMatrix[assetIndex][assetIndex] <= 0) {
            throw new Error(`Отрицательная или нулевая дисперсия для актива ${assetIndex}`);
        }
    }
    
    // Используем равные веса как начальное приближение
    let weights = new Array(numAssets).fill(1 / numAssets);
    
    // Простая оптимизация: итеративно улучшаем веса
    const maxIterations = 200;
    const tolerance = 1e-8;
    const stepSize = 0.001; // Уменьшаем размер шага
    
    for (let iteration = 0; iteration < maxIterations; iteration++) {
        const currentRisk = calculatePortfolioRisk(weights, covarianceMatrix);
        
        // Проверяем валидность текущего риска
        if (!isFinite(currentRisk) || currentRisk <= 0) {
            logger.warn(`⚠️ Недопустимый риск на итерации ${iteration}: ${currentRisk}`);
            // Возвращаемся к равным весам
            weights = new Array(numAssets).fill(1 / numAssets);
            break;
        }
        
        // Вычисляем градиент риска по весам
        const gradient = new Array(numAssets).fill(0);
        
        for (let assetIndex = 0; assetIndex < numAssets; assetIndex++) {
            for (let otherIndex = 0; otherIndex < numAssets; otherIndex++) {
                gradient[assetIndex] += weights[otherIndex] * covarianceMatrix[assetIndex][otherIndex];
            }
            gradient[assetIndex] /= currentRisk;
        }
        
        // Проверяем валидность градиента
        const gradientNorm = Math.sqrt(gradient.reduce((sum, g) => sum + g * g, 0));
        if (!isFinite(gradientNorm) || gradientNorm === 0) {
            logger.warn(`⚠️ Недопустимый градиент на итерации ${iteration}`);
            break;
        }
        
        // Обновляем веса в направлении уменьшения риска
        let newWeights = weights.map((weight, assetIndex) => weight - stepSize * gradient[assetIndex]);
        
        // Нормализуем веса (сумма должна быть равна 1)
        const sum = newWeights.reduce((a, b) => a + b, 0);
        if (sum <= 0 || !isFinite(sum)) {
            logger.warn(`⚠️ Недопустимая сумма весов: ${sum}`);
            break;
        }
        
        newWeights = newWeights.map(w => w / sum);
        
        // Проверяем, что все веса валидны
        const hasInvalidWeights = newWeights.some(w => !isFinite(w) || w < 0);
        if (hasInvalidWeights) {
            logger.warn(`⚠️ Недопустимые веса на итерации ${iteration}`);
            break;
        }
        
        // Проверяем сходимость
        const newRisk = calculatePortfolioRisk(newWeights, covarianceMatrix);
        if (Math.abs(currentRisk - newRisk) < tolerance) {
            logger.info(`✅ Сходимость достигнута на итерации ${iteration}`);
            break;
        }
        
        weights = newWeights;
    }
    
    // Финальная проверка весов
    const finalRisk = calculatePortfolioRisk(weights, covarianceMatrix);
    const finalReturn = calculatePortfolioReturn(weights, expectedReturns);
    
    // Если что-то пошло не так, используем равные веса
    if (!isFinite(finalRisk) || !isFinite(finalReturn) || finalRisk <= 0) {
        logger.warn('⚠️ Используем равные веса из-за проблем с оптимизацией');
        weights = new Array(numAssets).fill(1 / numAssets);
        const equalRisk = calculatePortfolioRisk(weights, covarianceMatrix);
        const equalReturn = calculatePortfolioReturn(weights, expectedReturns);
        
        return {
            weights,
            expectedReturn: equalReturn,
            risk: equalRisk,
            sharpeRatio: equalReturn / equalRisk
        };
    }
    
    return {
        weights,
        expectedReturn: finalReturn,
        risk: finalRisk,
        sharpeRatio: finalReturn / finalRisk
    };
}

// Функция для создания эффективной границы
function generateEfficientFrontier(covarianceMatrix: number[][], expectedReturns: number[], numPoints = 20): EfficientFrontierPoint[] {
    const numAssets = covarianceMatrix.length;
    const frontier: EfficientFrontierPoint[] = [];
    
    // Генерируем разные целевые доходности
    const minReturn = Math.min(...expectedReturns);
    const maxReturn = Math.max(...expectedReturns);
    
    for (let i = 0; i < numPoints; i++) {
        const targetReturn = minReturn + (maxReturn - minReturn) * i / (numPoints - 1);
        
        // Простая оптимизация для заданной доходности
        let weights = new Array(numAssets).fill(1 / numAssets);
        const maxIterations = 50;
        
        for (let iter = 0; iter < maxIterations; iter++) {
            const currentReturn = calculatePortfolioReturn(weights, expectedReturns);
            
            // Корректируем веса для достижения целевой доходности
            const returnDiff = targetReturn - currentReturn;
            const adjustment = returnDiff * 0.1;
            
            // Находим актив с максимальной доходностью для корректировки
            const maxReturnIndex = expectedReturns.indexOf(Math.max(...expectedReturns));
            weights[maxReturnIndex] += adjustment;
            
            // Нормализуем веса
            const sum = weights.reduce((a, b) => a + b, 0);
            weights = weights.map(w => w / sum);
            
            if (Math.abs(returnDiff) < 1e-4) break;
        }
        
        const risk = calculatePortfolioRisk(weights, covarianceMatrix);
        frontier.push({
            return: targetReturn,
            risk: risk,
            weights: [...weights]
        });
    }
    
    return frontier;
}

// Основная функция
async function main(): Promise<void> {
    try {
        logger.info('📊 Анализ портфеля Марковица...');
        
        // Получаем тикеры из pairs_trading
        const symbols = await getTickersFromPairsTrading();
        
        logger.info(`📈 Анализируем ${symbols.length} активов...`);
        
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
                
                // Вычисляем статистику
                const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
                const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
                const stdDev = Math.sqrt(variance);
                
                allData[symbol] = {
                    symbol,
                    prices,
                    returns,
                    avgReturn,
                    mean,
                    stdDev,
                    variance
                };
                
                returnsMatrix.push(returns);
                expectedReturns.push(avgReturn);
                
                logger.info(`✅ ${symbol}: ${returns.length} дней, средняя доходность: ${(avgReturn * 100).toFixed(2)}%`);
                
            } catch (error) {
                logger.error(`❌ Ошибка для ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        
        if (returnsMatrix.length < 2) {
            throw new Error('Недостаточно данных для создания портфеля');
        }
        
        // Находим минимальную длину данных
        const minLength = Math.min(...returnsMatrix.map(row => row.length));
        logger.info(`\n📊 Статистика данных:`);
        logger.info(`  Количество активов: ${returnsMatrix.length}`);
        logger.info(`  Исходная длина данных: ${returnsMatrix.map(row => row.length).join(', ')}`);
        logger.info(`  Минимальная длина: ${minLength}`);
        
        // Обрезаем все данные до минимальной длины
        logger.info('\n✂️ Обрезаем данные до одинаковой длины...');
        const normalizedReturnsMatrix = returnsMatrix.map(row => row.slice(-minLength));
        
        // Проверяем валидность данных
        logger.info('\n🔍 Проверка валидности данных:');
        for (let i = 0; i < normalizedReturnsMatrix.length; i++) {
            const symbol = Object.keys(allData)[i];
            const returns = normalizedReturnsMatrix[i];
            const validReturns = returns.filter(r => isFinite(r) && !isNaN(r));
            const invalidReturns = returns.length - validReturns.length;
            
            logger.info(`  ${symbol}: ${validReturns.length}/${returns.length} валидных доходностей`);
            if (invalidReturns > 0) {
                logger.warn(`    ⚠️ ${invalidReturns} невалидных значений`);
            }
            
            if (validReturns.length > 0) {
                const mean = validReturns.reduce((sum, r) => sum + r, 0) / validReturns.length;
                const variance = validReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / validReturns.length;
                logger.info(`    Среднее: ${(mean * 100).toFixed(4)}%, Дисперсия: ${(variance * 10000).toFixed(4)}`);
            }
        }
        
        logger.info('\n🔧 Вычисляем ковариационную матрицу...');
        
        // Вычисляем ковариационную матрицу
        const covarianceMatrix = calculateCovarianceMatrix(normalizedReturnsMatrix);
        
        logger.info('✅ Ковариационная матрица вычислена');
        logger.info(`  Размер матрицы: ${covarianceMatrix.length}x${covarianceMatrix[0].length}`);
        
        // Проверяем диагональные элементы (дисперсии)
        logger.info('\n📊 Дисперсии активов:');
        for (let i = 0; i < covarianceMatrix.length; i++) {
            const symbol = Object.keys(allData)[i];
            const variance = covarianceMatrix[i][i];
            logger.info(`  ${symbol}: ${(variance * 10000).toFixed(4)}`);
        }
        
        logger.info('📊 Оптимизируем портфель с минимальным риском...');
        
        // Оптимизируем портфель
        const portfolio = optimizePortfolioMinRisk(covarianceMatrix, expectedReturns);
        
        // Получаем символы активов, которые успешно загрузились
        const validSymbols = Object.keys(allData);
        
        logger.info('\n🎯 Результаты оптимизации портфеля:');
        logger.info('=' .repeat(50));
        
        // Выводим веса активов
        logger.info('\n📊 Распределение активов:');
        portfolio.weights.forEach((weight, index) => {
            const symbol = validSymbols[index];
            const percentage = (weight * 100).toFixed(2);
            logger.info(`  ${symbol}: ${percentage}%`);
        });
        
        logger.info('\n📈 Характеристики портфеля:');
        logger.info(`  Ожидаемая доходность: ${(portfolio.expectedReturn * 100).toFixed(2)}%`);
        logger.info(`  Риск (волатильность): ${(portfolio.risk * 100).toFixed(2)}%`);
        logger.info(`  Коэффициент Шарпа: ${portfolio.sharpeRatio.toFixed(3)}`);
        
        // Создаем эффективную границу
        logger.info('\n📊 Генерируем эффективную границу...');
        const efficientFrontier = generateEfficientFrontier(covarianceMatrix, expectedReturns);
        
        // Сохраняем результаты в CSV
        const portfolioData = validSymbols.map((symbol, index) => ({
            Symbol: symbol,
            Weight: portfolio.weights[index],
            WeightPercent: (portfolio.weights[index] * 100).toFixed(2) + '%',
            ExpectedReturn: (expectedReturns[index] * 100).toFixed(2) + '%'
        }));
        
        const csvContent = [
            'Symbol,Weight,Weight (%),Expected Return (%)',
            ...portfolioData.map(row => `${row.Symbol},${row.Weight},${row.WeightPercent},${row.ExpectedReturn}`)
        ].join('\n');
        
        await fs.writeFile(path.join(STATS_DIR, 'markowitz_portfolio.csv'), csvContent, 'utf-8');
        
        // Сохраняем эффективную границу
        const frontierData = efficientFrontier.map((point, index) => ({
            Point: index + 1,
            Return: (point.return * 100).toFixed(2) + '%',
            Risk: (point.risk * 100).toFixed(2) + '%',
            SharpeRatio: (point.return / point.risk).toFixed(3)
        }));
        
        const frontierContent = [
            'Point,Return (%),Risk (%),Sharpe Ratio',
            ...frontierData.map(row => `${row.Point},${row.Return},${row.Risk},${row.SharpeRatio}`)
        ].join('\n');
        
        await fs.writeFile(path.join(STATS_DIR, 'efficient_frontier.csv'), frontierContent, 'utf-8');
        
        logger.info(`\n💾 Результаты сохранены в:`);
        logger.info(`  📄 ${STATS_DIR}/markowitz_portfolio.csv`);
        logger.info(`  📄 ${STATS_DIR}/efficient_frontier.csv`);
        
        // Сохраняем детальную информацию о портфеле
        const portfolioSummary: PortfolioSummary = {
            totalAssets: validSymbols.length,
            portfolioReturn: portfolio.expectedReturn,
            portfolioRisk: portfolio.risk,
            sharpeRatio: portfolio.sharpeRatio,
            weights: portfolio.weights,
            symbols: validSymbols,
            efficientFrontier: efficientFrontier,
            date: new Date().toISOString()
        };
        
        await fs.writeJson(path.join(STATS_DIR, 'portfolio_summary.json'), portfolioSummary, { spaces: 2 });
        logger.info(`  📄 ${STATS_DIR}/portfolio_summary.json`);
        
    } catch (error) {
        logger.error('❌ Ошибка:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}

// Запускаем скрипт
main(); 