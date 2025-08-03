import dotenv from 'dotenv';
dotenv.config();

// @ts-ignore
import { TelegramClient } from "telegram";
// @ts-ignore
import { StringSession } from "telegram/sessions";
import readline from "readline";
import fs from 'fs/promises';
import logger from './logger';
import path from 'path';
import fsExtra from 'fs-extra';

interface TelegramConfig {
  apiId: number;
  apiHash: string;
  phone: string;
  password?: string;
  session?: string;
  channelId: string;
}

export class TelegramSender {
  private client: TelegramClient | null = null;
  private config: TelegramConfig;

  constructor(config: TelegramConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    const stringSession = await this.getSession();
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    logger.info("Starting Telegram client");
    this.client = new TelegramClient(
      stringSession,
      this.config.apiId,
      this.config.apiHash,
      {
        connectionRetries: 5,
      }
    );

    await this.client.start({
      phoneNumber: async () => this.config.phone || "",
      password: async () => this.config.password || "",
      phoneCode: async () => {
        logger.info('Waiting for a confirmation code');
        return new Promise((resolve) =>
          rl.question("Please enter the code you received: ", resolve)
        );
      },
      onError: (err: any) => {
        logger.error('Telegram client error', err);
        process.exit(1);
      },
    });

    logger.info("Saving session");
    await fs.writeFile('./session', stringSession.save());
    rl.close();
  }

  private async getSession(): Promise<StringSession> {
    try {
      const fileSession = await fs.readFile('./session');
      const session = fileSession.toString() ?? this.config.session;
      return new StringSession(session);
    } catch (error) {
      logger.info("No existing session found, creating new one");
      return new StringSession(this.config.session || "");
    }
  }

  async sendMessage(message: string): Promise<void> {
    if (!this.client) {
      throw new Error("Telegram client not initialized. Call initialize() first.");
    }

    try {
      const entity = await this.client.getEntity(this.config.channelId);
      await this.client.sendMessage(entity, { message });
      logger.info("Message sent successfully to Telegram");
    } catch (error) {
      logger.error("Failed to send message to Telegram", error);
      throw error;
    }
  }

  async sendFile(filePath: string, caption?: string): Promise<void> {
    if (!this.client) {
      throw new Error("Telegram client not initialized. Call initialize() first.");
    }

    try {
      const entity = await this.client.getEntity(this.config.channelId);
      await this.client.sendFile(entity, {
        file: filePath,
        caption: caption || "",
      });
      logger.info("File sent successfully to Telegram");
    } catch (error) {
      logger.error("Failed to send file to Telegram", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      logger.info("Telegram client disconnected");
    }
  }
}

// Example usage function
export async function sendStockAnalysisToTelegram(
  message: string,
  config: TelegramConfig
): Promise<void> {
  const sender = new TelegramSender(config);
  
  try {
    await sender.initialize();
    await sender.sendMessage(message);
  } finally {
    await sender.disconnect();
  }
}

// Функция для получения красивого названия индекса
function getIndexDisplayName(indexName: string): string {
  switch (indexName.toLowerCase()) {
    case 'sp500':
      return '🇺🇸 S&P500';
    case 'nasdaq':
      return '📈 NASDAQ';
    case 'imoex':
      return '🇷🇺 IMOEX';
    case 'rucbitr':
      return '🏢 RUCBITR';
    case 'rgbi':
      return '📈 RGBI';
    default:
      return '📊 Индекс';
  }
}

// CLI interface
if (require.main === module) {
  (async () => {
  const config: TelegramConfig = {
    apiId: parseInt(process.env.TELEGRAM_API_ID || "0"),
    apiHash: process.env.TELEGRAM_API_HASH || "",
    phone: process.env.TELEGRAM_PHONE || "",
    password: process.env.TELEGRAM_PASSWORD,
    channelId: process.env.TELEGRAM_CHANNEL_ID || "",
  };

  // Найти все инфографики по индексам в папках индексов
  const indexInfographics: Array<{name: string, path: string, time: number, index: string}> = [];
  try {
    const baseDir = path.join(__dirname, '../infographics');
    const indexNames = ['sp500', 'nasdaq', 'imoex', 'rucbitr', 'rgbi'];
    
    for (const indexName of indexNames) {
      const indexDir = path.join(baseDir, indexName);
      if (await fsExtra.pathExists(indexDir)) {
        const files = (await fsExtra.readdir(indexDir))
          .filter(f => f.endsWith('.png'))
          .map(f => ({
            name: f,
            path: path.join(indexDir, f),
            time: fsExtra.statSync(path.join(indexDir, f)).mtime.getTime(),
            index: indexName
          }))
          .sort((a, b) => b.time - a.time);
        
        if (files.length > 0) {
          // Берем самую новую инфографику для каждого индекса
          indexInfographics.push(files[0]);
        }
      }
    }
    
    console.log(`Found ${indexInfographics.length} index infographics:`, indexInfographics.map(f => `${f.index}/${f.name}`));
  } catch (e) {
    console.log('Error reading infographics directories:', e);
  }

  if (!config.apiId || !config.apiHash || !config.phone || !config.channelId) {
    console.error("Please set TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_PHONE, and TELEGRAM_CHANNEL_ID environment variables");
    process.exit(1);
  }

  console.log("config", config);

  const sender = new TelegramSender(config);
  await sender.initialize();
  try {
    if (indexInfographics.length > 0) {
      console.log(`📤 Отправляем ${indexInfographics.length} инфографик по индексам...`);
      
      // Отправляем каждую инфографику отдельно
      for (const infographic of indexInfographics) {
        const indexName = getIndexDisplayName(infographic.index);
        const caption = `📊 Анализ пар: ${indexName}`;
        
        console.log(`Sending ${indexName} infographic:`, `${infographic.index}/${infographic.name}`);
        await sender.sendFile(infographic.path, caption);
        console.log(`✅ ${indexName} infographic sent successfully`);
        
        // Небольшая пауза между отправками
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('✅ All index infographics sent successfully');
    } else {
      console.log('❌ No index infographics found');
      await sender.sendMessage('Нет инфографик по индексам для отправки.');
      console.log('Text message sent instead.');
    }
  } finally {
    await sender.disconnect();
  }
  process.exit(0);
  })
  (); 
} 