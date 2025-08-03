import { analyzeAllIndexes } from './index_analysis';
import logger from './logger';

// Получение горизонта анализа из аргументов командной строки
function getAnalysisHorizon(): number {
    const arg = process.argv.find(a => a.startsWith('--days='));
    if (arg) {
        const days = parseInt(arg.split('=')[1], 10);
        if (!isNaN(days) && days > 0) return days;
    }
    return 63; // По умолчанию 3 месяца (примерно 63 торговых дня)
}

async function main(): Promise<void> {
    logger.info('🎯 Запуск анализа пар по отдельным индексам...');
    
    try {
        // Получаем горизонт анализа
        const horizonDays = getAnalysisHorizon();
        logger.info(`📅 Горизонт анализа: ${horizonDays} дней`);
        
        // Запускаем анализ всех индексов
        await analyzeAllIndexes(horizonDays);
        
        logger.info('✅ Анализ по индексам завершен успешно!');
        logger.info('\n📁 Результаты сохранены в:');
        logger.info('   - stats/index_reports/ (отчеты по индексам)');
        logger.info('   - infographics/ (инфографики по индексам)');
        logger.info('   - stats/index_reports/summary.json (сводный отчет)');
        
    } catch (error) {
        logger.error('❌ Критическая ошибка при анализе по индексам:', error);
        process.exit(1);
    }
}

// Запускаем основной скрипт
if (require.main === module) {
    main().catch(error => {
        logger.error('❌ Неожиданная ошибка:', error);
        process.exit(1);
    });
} 