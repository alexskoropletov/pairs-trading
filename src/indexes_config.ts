import fs from 'fs-extra';
import path from 'path';
import logger from './logger';

export interface IndexConfig {
  name: string;
  displayName: string;
  description: string;
  enabled: boolean;
  correlationThreshold: number;
  color: string;
  emoji: string;
}

export interface IndexesConfig {
  indexes: {
    [key: string]: IndexConfig;
  };
  defaultCorrelationThreshold: number;
  defaultTopPairsCount: number;
}

class IndexesConfigManager {
  private configPath: string;
  private config: IndexesConfig;

  constructor() {
    this.configPath = path.join(__dirname, 'indexes_config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): IndexesConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readJsonSync(this.configPath);
        logger.info('📋 Конфигурация индексов загружена');
        return configData;
      } else {
        logger.warn('⚠️ Файл конфигурации индексов не найден, используется конфигурация по умолчанию');
        return this.getDefaultConfig();
      }
    } catch (error) {
      logger.error('❌ Ошибка загрузки конфигурации индексов:', error);
      return this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): IndexesConfig {
    return {
      indexes: {
        sp500: {
          name: "S&P500",
          displayName: "🇺🇸 S&P500",
          description: "Американские акции",
          enabled: true,
          correlationThreshold: 0.7,
          color: "#3498db",
          emoji: "🇺🇸"
        },
        nasdaq: {
          name: "NASDAQ",
          displayName: "📈 NASDAQ",
          description: "Технологические акции",
          enabled: true,
          correlationThreshold: 0.7,
          color: "#2ecc71",
          emoji: "📈"
        },
        imoex: {
          name: "IMOEX",
          displayName: "🇷🇺 IMOEX",
          description: "Российские акции",
          enabled: true,
          correlationThreshold: 0.6,
          color: "#e74c3c",
          emoji: "🇷🇺"
        },
        rucbitr: {
          name: "RUCBITR",
          displayName: "🏢 RUCBITR",
          description: "Российские корпоративные облигации",
          enabled: false,
          correlationThreshold: 0.6,
          color: "#9b59b6",
          emoji: "🏢"
        },
        rgbi: {
          name: "RGBI",
          displayName: "📈 RGBI",
          description: "Российские облигации",
          enabled: false,
          correlationThreshold: 0.6,
          color: "#f39c12",
          emoji: "📈"
        }
      },
      defaultCorrelationThreshold: 0.7,
      defaultTopPairsCount: 3
    };
  }

  public getConfig(): IndexesConfig {
    return this.config;
  }

  public getEnabledIndexes(): string[] {
    return Object.entries(this.config.indexes)
      .filter(([_, config]) => config.enabled)
      .map(([key, _]) => key);
  }

  public getIndexConfig(indexKey: string): IndexConfig | null {
    return this.config.indexes[indexKey] || null;
  }

  public isIndexEnabled(indexKey: string): boolean {
    const indexConfig = this.getIndexConfig(indexKey);
    return indexConfig ? indexConfig.enabled : false;
  }

  public getIndexDisplayName(indexKey: string): string {
    const indexConfig = this.getIndexConfig(indexKey);
    return indexConfig ? indexConfig.displayName : indexKey;
  }

  public getIndexCorrelationThreshold(indexKey: string): number {
    const indexConfig = this.getIndexConfig(indexKey);
    return indexConfig ? indexConfig.correlationThreshold : this.config.defaultCorrelationThreshold;
  }

  public getIndexColor(indexKey: string): string {
    const indexConfig = this.getIndexConfig(indexKey);
    return indexConfig ? indexConfig.color : '#6c757d';
  }

  public getIndexEmoji(indexKey: string): string {
    const indexConfig = this.getIndexConfig(indexKey);
    return indexConfig ? indexConfig.emoji : '📊';
  }

  public getEnabledIndexesInfo(): Array<{key: string, config: IndexConfig}> {
    return Object.entries(this.config.indexes)
      .filter(([_, config]) => config.enabled)
      .map(([key, config]) => ({ key, config }));
  }

  public logEnabledIndexes(): void {
    const enabledIndexes = this.getEnabledIndexesInfo();
    logger.info(`📋 Активные индексы (${enabledIndexes.length}):`);
    enabledIndexes.forEach(({ config }) => {
      logger.info(`  ${config.displayName} - ${config.description} (порог корреляции: ${config.correlationThreshold * 100}%)`);
    });
  }

  public updateIndexStatus(indexKey: string, enabled: boolean): void {
    if (this.config.indexes[indexKey]) {
      this.config.indexes[indexKey].enabled = enabled;
      this.saveConfig();
      logger.info(`✅ Индекс ${indexKey} ${enabled ? 'включен' : 'отключен'}`);
    } else {
      logger.error(`❌ Индекс ${indexKey} не найден в конфигурации`);
    }
  }

  private saveConfig(): void {
    try {
      fs.writeJsonSync(this.configPath, this.config, { spaces: 2 });
      logger.info('💾 Конфигурация индексов сохранена');
    } catch (error) {
      logger.error('❌ Ошибка сохранения конфигурации индексов:', error);
    }
  }
}

// Создаем экземпляр менеджера
const indexesConfigManager = new IndexesConfigManager();

export default indexesConfigManager; 