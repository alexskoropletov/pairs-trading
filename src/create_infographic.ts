import * as fs from 'fs-extra';
import * as path from 'path';
import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';
import logger from './logger';

interface PairsAnalysis {
  totalPairs: number;
  sp500Pairs: number;
  nasdaqPairs: number;
  averageCorrelation: number;
  maxCorrelation: number;
  minCorrelation: number;
  topPairs: Array<{
    asset1: string;
    asset2: string;
    correlation: number;
    strategy: string;
    index: string;
  }>;
}

class InfographicGenerator {
  private canvas!: Canvas;
  private ctx!: CanvasRenderingContext2D;
  private infographicsDir: string;
  private width: number = 1200;
  private height: number = 800;

  constructor() {
    this.infographicsDir = 'infographics';
    this.ensureInfographicsDir();
    this.initializeCanvas();
  }

  private ensureInfographicsDir(): void {
    if (!fs.existsSync(this.infographicsDir)) {
      fs.mkdirSync(this.infographicsDir, { recursive: true });
      logger.info(`📁 Создана папка: ${this.infographicsDir}`);
    }
  }

  private initializeCanvas(): void {
    this.canvas = createCanvas(this.width, this.height);
    this.ctx = this.canvas.getContext('2d');
    
    // Устанавливаем белый фон
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawHeader(): void {
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Pairs Trading Analysis', this.width / 2, 40);
    
    // Подзаголовок
    this.ctx.fillStyle = '#7f8c8d';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Анализ коррелированных пар акций', this.width / 2, 65);
  }

  private drawSummaryStats(data: PairsAnalysis): void {
    // Общая статистика
    this.drawBox(50, 100, 300, 120, '#ecf0f1', '#bdc3c7');
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Общая статистика', 70, 125);
    
    this.ctx.fillStyle = '#34495e';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Всего пар: ${data.totalPairs.toLocaleString()}`, 70, 150);
    this.ctx.fillText(`S&P 500: ${data.sp500Pairs.toLocaleString()}`, 70, 170);
    this.ctx.fillText(`NASDAQ: ${data.nasdaqPairs.toLocaleString()}`, 70, 190);
    
    // Корреляция
    this.drawBox(400, 100, 300, 120, '#e8f5e8', '#a8d5a8');
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.fillText('Корреляция', 420, 125);
    
    this.ctx.fillStyle = '#34495e';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Средняя: ${(data.averageCorrelation * 100).toFixed(2)}%`, 420, 150);
    this.ctx.fillText(`Максимум: ${(data.maxCorrelation * 100).toFixed(2)}%`, 420, 170);
    this.ctx.fillText(`Минимум: ${(data.minCorrelation * 100).toFixed(2)}%`, 420, 190);
  }

  private drawTopPairsTable(data: PairsAnalysis): void {
    this.drawBox(50, 250, 1100, 300, '#f8f9fa', '#dee2e6');
    
    // Заголовок таблицы
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Топ-10 пар для торговли', 70, 280);
    
    // Заголовки колонок
    const headers = ['Ранг', 'Актив 1', 'Актив 2', 'Корреляция', 'Стратегия', 'Индекс'];
    const columnWidths = [80, 150, 150, 120, 300, 100];
    let currentX = 70;
    
    this.ctx.fillStyle = '#495057';
    this.ctx.font = 'bold 12px Arial';
    headers.forEach((header, index) => {
      this.ctx.fillText(header, currentX, 310);
      currentX += columnWidths[index];
    });
    
    // Разделительная линия
    this.ctx.strokeStyle = '#dee2e6';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(70, 320);
    this.ctx.lineTo(1150, 320);
    this.ctx.stroke();
    
    // Данные таблицы
    const topPairs = data.topPairs.slice(0, 10);
    topPairs.forEach((pair, index) => {
      const rowY = 340 + index * 25;
      currentX = 70;
      
      // Ранг
      this.ctx.fillStyle = '#6c757d';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`${index + 1}`, currentX, rowY);
      currentX += columnWidths[0];
      
      // Актив 1
      this.ctx.fillStyle = '#007bff';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.fillText(pair.asset1, currentX, rowY);
      currentX += columnWidths[1];
      
      // Актив 2
      this.ctx.fillStyle = '#dc3545';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.fillText(pair.asset2, currentX, rowY);
      currentX += columnWidths[2];
      
      // Корреляция
      this.ctx.fillStyle = '#28a745';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`${(pair.correlation * 100).toFixed(2)}%`, currentX, rowY);
      currentX += columnWidths[3];
      
      // Стратегия
      this.ctx.fillStyle = '#6c757d';
      this.ctx.font = '11px Arial';
      this.ctx.fillText(pair.strategy, currentX, rowY);
      currentX += columnWidths[4];
      
      // Индекс
      this.ctx.fillStyle = '#6c757d';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(pair.index, currentX, rowY);
    });
  }

  private drawCorrelationChart(data: PairsAnalysis): void {
    this.drawBox(50, 580, 1100, 180, '#ffffff', '#dee2e6');
    
    // Заголовок графика
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Распределение корреляций (Топ-8 пар)', this.width / 2, 610);
    
    // Создаем гистограмму
    const topPairs = data.topPairs.slice(0, 8);
    const barWidth = 100;
    const barSpacing = 30;
    const maxHeight = 100;
    const startX = 100;
    const startY = 680;
    
    topPairs.forEach((pair, index) => {
      const barHeight = (pair.correlation / data.maxCorrelation) * maxHeight;
      const x = startX + index * (barWidth + barSpacing);
      const y = startY - barHeight;
      
      // Цвет столбца в зависимости от корреляции
      if (pair.correlation > 0.8) {
        this.ctx.fillStyle = '#28a745';
      } else if (pair.correlation > 0.6) {
        this.ctx.fillStyle = '#ffc107';
      } else {
        this.ctx.fillStyle = '#dc3545';
      }
      
      this.ctx.fillRect(x, y, barWidth, barHeight);
      this.ctx.strokeStyle = '#6c757d';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, y, barWidth, barHeight);
      
      // Подписи
      this.ctx.fillStyle = '#495057';
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${pair.asset1}-${pair.asset2}`, x + barWidth / 2, startY + 15);
      this.ctx.fillText(`${(pair.correlation * 100).toFixed(1)}%`, x + barWidth / 2, startY + 30);
    });
  }

  private drawFooter(): void {
    this.ctx.fillStyle = '#6c757d';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Сгенерировано: ${new Date().toLocaleDateString('ru-RU')}`, this.width / 2, this.height - 20);
  }

  private drawBox(x: number, y: number, width: number, height: number, fillColor: string, strokeColor: string): void {
    this.ctx.fillStyle = fillColor;
    this.ctx.fillRect(x, y, width, height);
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);
  }

  public async generateInfographic(): Promise<void> {
    try {
      logger.info('🎨 Начинаю создание инфографики...');
      
      // Загружаем данные
      const dataPath = path.join('stats', 'pairs_analysis.json');
      if (!fs.existsSync(dataPath)) {
        throw new Error('Файл pairs_analysis.json не найден');
      }
      
      const data: PairsAnalysis = await fs.readJson(dataPath);
      logger.info('📊 Данные загружены успешно');
      
      // Очищаем холст
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      // Рисуем элементы
      this.drawHeader();
      this.drawSummaryStats(data);
      this.drawTopPairsTable(data);
      this.drawCorrelationChart(data);
      this.drawFooter();
      
      // Генерируем имя файла
      const today = new Date();
      const fileName = `pairs-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.png`;
      const filePath = path.join(this.infographicsDir, fileName);
      
      // Сохраняем файл
      const buffer = this.canvas.toBuffer('image/png');
      await fs.writeFile(filePath, buffer);
      
      logger.info(`✅ Инфографика сохранена: ${filePath}`);
      
    } catch (error) {
      logger.error('❌ Ошибка при создании инфографики:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }
}

// Экспортируем класс для тестирования
export { InfographicGenerator };

// Основная функция
async function main(): Promise<void> {
  try {
    const generator = new InfographicGenerator();
    await generator.generateInfographic();
    logger.info('🎉 Создание инфографики завершено!');
  } catch (error) {
    logger.error('❌ Критическая ошибка:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Запускаем скрипт только если файл запущен напрямую
if (require.main === module) {
  main();
} 