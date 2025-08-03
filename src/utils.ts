import * as fs from 'fs-extra';
import path from 'path';
import logger from './logger';

const TICKERS_DIR = 'tickers';

/**
 * Создает все необходимые папки для тикеров
 * @returns Promise<void>
 */
export async function ensureTickerDirectories(): Promise<void> {
    try {
        // Создаем основную папку тикеров
        await fs.ensureDir(TICKERS_DIR);
        
        // Создаем подпапки для каждого индекса
        const subDirectories = ['sp500', 'nasdaq', 'imoex', 'rucbitr', 'rgbi'];
        
        for (const subDir of subDirectories) {
            const fullPath = path.join(TICKERS_DIR, subDir);
            await fs.ensureDir(fullPath);
        }
        
        logger.info('📁 Папки для тикеров созданы/проверены');
    } catch (error) {
        logger.error('❌ Ошибка при создании папок для тикеров:', error instanceof Error ? error.message : 'Unknown error');
        throw error;
    }
}

/**
 * Проверяет существование папки для конкретного индекса
 * @param indexName - название индекса
 * @returns Promise<boolean>
 */
export async function checkIndexDirectory(indexName: string): Promise<boolean> {
    try {
        const indexPath = path.join(TICKERS_DIR, indexName.toLowerCase());
        return await fs.pathExists(indexPath);
    } catch (error) {
        logger.error(`❌ Ошибка при проверке папки ${indexName}:`, error instanceof Error ? error.message : 'Unknown error');
        return false;
    }
}

/**
 * Получает список файлов в папке индекса
 * @param indexName - название индекса
 * @returns Promise<string[]>
 */
export async function getIndexFiles(indexName: string): Promise<string[]> {
    try {
        const indexPath = path.join(TICKERS_DIR, indexName.toLowerCase());
        
        if (!await fs.pathExists(indexPath)) {
            return [];
        }
        
        const files = await fs.readdir(indexPath);
        return files.filter(file => file.endsWith('.csv'));
    } catch (error) {
        logger.error(`❌ Ошибка при получении файлов для ${indexName}:`, error instanceof Error ? error.message : 'Unknown error');
        return [];
    }
}

/**
 * Создает папку для конкретного индекса
 * @param indexName - название индекса
 * @returns Promise<void>
 */
export async function ensureIndexDirectory(indexName: string): Promise<void> {
    try {
        const indexPath = path.join(TICKERS_DIR, indexName.toLowerCase());
        await fs.ensureDir(indexPath);
        logger.info(`📁 Папка для ${indexName} создана/проверена`);
    } catch (error) {
        logger.error(`❌ Ошибка при создании папки для ${indexName}:`, error instanceof Error ? error.message : 'Unknown error');
        throw error;
    }
} 