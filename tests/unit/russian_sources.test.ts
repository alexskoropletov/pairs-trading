import { russianDataSources } from '../../src/russian_data_sources';
import { bondDataSources } from '../../src/bond_data_sources';
import logger from '../../src/logger';

async function testRussianDataSources() {
    logger.info('🧪 Начинаем тестирование российских источников данных...');
    
    // Тестируем российские акции
    const russianStocks = ['SBER', 'GAZP', 'LKOH', 'YNDX'];
    
    for (const symbol of russianStocks) {
        try {
            logger.info(`\n📊 Тестируем получение данных для ${symbol}...`);
            const data = await russianDataSources.fetchRussianStockData(symbol, 30); // 30 дней для теста
            
            if (data && data.length > 0) {
                logger.info(`✅ Успешно получено ${data.length} записей для ${symbol}`);
                logger.info(`📅 Первая дата: ${data[0].Date}`);
                logger.info(`📅 Последняя дата: ${data[data.length - 1].Date}`);
                logger.info(`💰 Последняя цена: ${data[data.length - 1].Close}`);
            } else {
                logger.warn(`⚠️ Нет данных для ${symbol}`);
            }
        } catch (error) {
            logger.error(`❌ Ошибка при тестировании ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    // Тестируем облигации
    const bonds = ['OFZ-26207', 'OFZ-26208'];
    
    for (const symbol of bonds) {
        try {
            logger.info(`\n📈 Тестируем получение данных для облигации ${symbol}...`);
            const data = await bondDataSources.fetchBondData(symbol, 30); // 30 дней для теста
            
            if (data && data.length > 0) {
                logger.info(`✅ Успешно получено ${data.length} записей для облигации ${symbol}`);
                logger.info(`📅 Первая дата: ${data[0].Date}`);
                logger.info(`📅 Последняя дата: ${data[data.length - 1].Date}`);
                logger.info(`💰 Последняя цена: ${data[data.length - 1].Close}`);
            } else {
                logger.warn(`⚠️ Нет данных для облигации ${symbol}`);
            }
        } catch (error) {
            logger.error(`❌ Ошибка при тестировании облигации ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    logger.info('\n🎉 Тестирование завершено!');
}

// Запускаем тест
testRussianDataSources().catch(error => {
    logger.error('❌ Критическая ошибка при тестировании:', error);
    process.exit(1);
}); 