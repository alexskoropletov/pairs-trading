import { stockSymbols, imoexStocksFallback, rucbitrStocksFallback, rgbiStocksFallback } from '../../src/stock';
import logger from '../../src/logger';

async function testRussianPairsAnalysis() {
    logger.info('🧪 Тестирование анализа пар с российскими активами...');
    
    // Проверяем доступные российские тикеры
    const imoexSymbols = imoexStocksFallback.map(stock => stock.symbol);
    const rucbitrSymbols = rucbitrStocksFallback.map(stock => stock.symbol);
    const rgbiSymbols = rgbiStocksFallback.map(stock => stock.symbol);
    
    logger.info(`\n📊 Доступные российские тикеры:`);
    logger.info(`🇷🇺 IMOEX (${imoexSymbols.length}): ${imoexSymbols.slice(0, 10).join(', ')}${imoexSymbols.length > 10 ? '...' : ''}`);
    logger.info(`🧬 RUCBITR (${rucbitrSymbols.length}): ${rucbitrSymbols.slice(0, 10).join(', ')}${rucbitrSymbols.length > 10 ? '...' : ''}`);
    logger.info(`📈 RGBI (${rgbiSymbols.length}): ${rgbiSymbols.slice(0, 10).join(', ')}${rgbiSymbols.length > 10 ? '...' : ''}`);
    
    // Проверяем, какие тикеры есть в общем списке
    const availableImoex = imoexSymbols.filter(symbol => stockSymbols.includes(symbol));
    const availableRucbitr = rucbitrSymbols.filter(symbol => stockSymbols.includes(symbol));
    const availableRgbi = rgbiSymbols.filter(symbol => stockSymbols.includes(symbol));
    
    logger.info(`\n✅ Доступные для анализа:`);
    logger.info(`🇷🇺 IMOEX: ${availableImoex.length} из ${imoexSymbols.length}`);
    logger.info(`🧬 RUCBITR: ${availableRucbitr.length} из ${rucbitrSymbols.length}`);
    logger.info(`📈 RGBI: ${availableRgbi.length} из ${rgbiSymbols.length}`);
    
    if (availableImoex.length > 0) {
        logger.info(`\n🇷🇺 Доступные IMOEX тикеры: ${availableImoex.join(', ')}`);
    }
    
    if (availableRucbitr.length > 0) {
        logger.info(`\n🧬 Доступные RUCBITR тикеры: ${availableRucbitr.join(', ')}`);
    }
    
    if (availableRgbi.length > 0) {
        logger.info(`\n📈 Доступные RGBI тикеры: ${availableRgbi.join(', ')}`);
    }
    
    // Проверяем наличие данных
    const fs = require('fs-extra');
    const path = require('path');
    
    logger.info(`\n📁 Проверка наличия данных...`);
    
    const tickersDir = 'tickers';
    const imoexDir = path.join(tickersDir, 'imoex');
    const rucbitrDir = path.join(tickersDir, 'rucbitr');
    const rgbiDir = path.join(tickersDir, 'rgbi');
    
    if (fs.existsSync(imoexDir)) {
        const imoexFiles = fs.readdirSync(imoexDir).filter((file: string) => file.endsWith('.csv'));
        logger.info(`🇷🇺 IMOEX файлы: ${imoexFiles.length}`);
        if (imoexFiles.length > 0) {
            logger.info(`   Примеры: ${imoexFiles.slice(0, 5).join(', ')}`);
        }
    } else {
        logger.warn(`⚠️ Папка IMOEX не найдена: ${imoexDir}`);
    }
    
    if (fs.existsSync(rucbitrDir)) {
        const rucbitrFiles = fs.readdirSync(rucbitrDir).filter((file: string) => file.endsWith('.csv'));
        logger.info(`🧬 RUCBITR файлы: ${rucbitrFiles.length}`);
        if (rucbitrFiles.length > 0) {
            logger.info(`   Примеры: ${rucbitrFiles.slice(0, 5).join(', ')}`);
        }
    } else {
        logger.warn(`⚠️ Папка RUCBITR не найдена: ${rucbitrDir}`);
    }
    
    if (fs.existsSync(rgbiDir)) {
        const rgbiFiles = fs.readdirSync(rgbiDir).filter((file: string) => file.endsWith('.csv'));
        logger.info(`📈 RGBI файлы: ${rgbiFiles.length}`);
        if (rgbiFiles.length > 0) {
            logger.info(`   Примеры: ${rgbiFiles.slice(0, 5).join(', ')}`);
        }
    } else {
        logger.warn(`⚠️ Папка RGBI не найдена: ${rgbiDir}`);
    }
    
    logger.info('\n🎉 Тестирование завершено!');
    logger.info('\n💡 Рекомендации:');
    logger.info('1. Запустите npm run prices для загрузки данных');
    logger.info('2. Запустите npm run pairs-trading для анализа пар');
    logger.info('3. Запустите npm run infographic для создания инфографики');
}

// Запускаем тест
testRussianPairsAnalysis().catch(error => {
    logger.error('❌ Критическая ошибка при тестировании:', error);
    process.exit(1);
}); 