import * as fs from 'fs-extra';
import * as path from 'path';
import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';
import { I18n, createI18n } from './i18n';
import logger from './logger';

interface PairsAnalysis {
  totalPairs: number;
  sp500Pairs: number;
  nasdaqPairs: number;
  imoexPairs?: number;
  rucbitrPairs?: number;
  rgbiPairs?: number;
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
  assetsInfo?: Array<{
    symbol: string;
    currentPrice: number;
    volatility: number;
    avgReturn: number;
    index: string;
    dividendYield?: number;
    couponRate?: number;
  }>;
}

// Интерфейс для анализа конкретного индекса
interface IndexAnalysis {
  indexName: string;
  totalPairs: number;
  averageCorrelation: number;
  maxCorrelation: number;
  minCorrelation: number;
  correlationThreshold: number;
  topPairs: Array<{
    asset1: string;
    asset2: string;
    correlation: number;
    strategy: string;
    volatility1: number;
    volatility2: number;
    avgReturn1: number;
    avgReturn2: number;
  }>;
  assetsInfo: Array<{
    symbol: string;
    currentPrice: number;
    volatility: number;
    avgReturn: number;
    index: string;
    dividendYield?: number;
    couponRate?: number;
  }>;
  analysisDate: string;
}

class InfographicGenerator {
  private canvas!: Canvas;
  private ctx!: CanvasRenderingContext2D;
  private infographicsDir: string;
  private width: number = 1200;
  private height: number = 1200; // Увеличиваем высоту для новой секции
  private i18n: I18n;

  constructor() {
    this.infographicsDir = 'infographics';
    this.i18n = createI18n();
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
    this.ctx.fillText(this.i18n.t('pairs_trading_analysis'), this.width / 2, 40);
    
    // Подзаголовок
    this.ctx.fillStyle = '#7f8c8d';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(this.i18n.t('correlated_pairs_analysis'), this.width / 2, 65);
  }

  private drawSummaryStats(data: PairsAnalysis): void {
    // Общая статистика
    this.drawBox(50, 100, 300, 120, '#ecf0f1', '#bdc3c7');
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(this.i18n.t('total_pairs'), 70, 125);
    
    this.ctx.fillStyle = '#34495e';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`${this.i18n.t('total_pairs')}: ${data.totalPairs.toLocaleString()}`, 70, 150);
    this.ctx.fillText(`${this.i18n.t('sp500')}: ${data.sp500Pairs.toLocaleString()}`, 70, 170);
    this.ctx.fillText(`${this.i18n.t('nasdaq')}: ${data.nasdaqPairs.toLocaleString()}`, 70, 190);
    if (data.imoexPairs) {
      this.ctx.fillText(`${this.i18n.getIndexEmoji('imoex')} ${this.i18n.t('imoex')}: ${data.imoexPairs.toLocaleString()}`, 70, 210);
    }
    if (data.rucbitrPairs) {
      this.ctx.fillText(`${this.i18n.getIndexEmoji('rucbitr')} ${this.i18n.t('rucbitr')}: ${data.rucbitrPairs.toLocaleString()}`, 70, 230);
    }
    if (data.rgbiPairs) {
      this.ctx.fillText(`${this.i18n.getIndexEmoji('rgbi')} ${this.i18n.t('rgbi')}: ${data.rgbiPairs.toLocaleString()}`, 70, 250);
    }
    
    // Корреляция
    this.drawBox(400, 100, 300, 120, '#e8f5e8', '#a8d5a8');
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.fillText(this.i18n.t('correlation'), 420, 125);
    
    this.ctx.fillStyle = '#34495e';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`${this.i18n.t('average_correlation')}: ${this.i18n.formatPercentage(data.averageCorrelation * 100)}`, 420, 150);
    this.ctx.fillText(`${this.i18n.t('max_correlation')}: ${this.i18n.formatPercentage(data.maxCorrelation * 100)}`, 420, 170);
    this.ctx.fillText(`${this.i18n.t('min_correlation')}: ${this.i18n.formatPercentage(data.minCorrelation * 100)}`, 420, 190);
  }

  private drawTopPairsTable(data: PairsAnalysis): void {
    this.drawBox(50, 250, 1100, 300, '#f8f9fa', '#dee2e6');
    
    // Заголовок таблицы
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(this.i18n.t('top_pairs'), 70, 280);
    
    // Заголовки колонок
    const headers = ['Ранг', 'Актив 1', 'Актив 2', this.i18n.t('correlation'), this.i18n.t('strategy'), this.i18n.t('index')];
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
    this.ctx.fillText(this.i18n.t('correlation_distribution'), this.width / 2, 610);
    
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

  private drawAssetsInfo(data: PairsAnalysis): void {
    if (!data.assetsInfo || data.assetsInfo.length === 0) {
      return;
    }

    this.drawBox(50, 780, 1100, 350, '#f8f9fa', '#dee2e6');
    
    // Заголовок секции
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(this.i18n.t('assets_info'), 70, 810);
    
    // Заголовки колонок
    const headers = [this.i18n.t('symbol'), this.i18n.t('price'), this.i18n.t('volatility'), this.i18n.t('avg_return'), 'Див/Купон', this.i18n.t('index')];
    const columnWidths = [120, 120, 120, 120, 120, 100];
    let currentX = 70;
    
    this.ctx.fillStyle = '#495057';
    this.ctx.font = 'bold 12px Arial';
    headers.forEach((header, index) => {
      this.ctx.fillText(header, currentX, 840);
      currentX += columnWidths[index];
    });
    
    // Разделительная линия
    this.ctx.strokeStyle = '#dee2e6';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(70, 850);
    this.ctx.lineTo(1150, 850);
    this.ctx.stroke();
    
    // Получаем уникальные активы из топ-10 пар с их индексами
    const topPairs = data.topPairs.slice(0, 10);
    const assetIndexMap = new Map<string, string>(); // symbol -> index
    
    topPairs.forEach(pair => {
      // Если актив уже есть в карте, проверяем корреляцию
      if (assetIndexMap.has(pair.asset1)) {
        // Оставляем тот индекс, где корреляция выше
        const existingPair = topPairs.find(p => p.asset1 === pair.asset1 || p.asset2 === pair.asset1);
        if (existingPair && pair.correlation > existingPair.correlation) {
          assetIndexMap.set(pair.asset1, pair.index);
        }
      } else {
        assetIndexMap.set(pair.asset1, pair.index);
      }
      
      if (assetIndexMap.has(pair.asset2)) {
        const existingPair = topPairs.find(p => p.asset1 === pair.asset2 || p.asset2 === pair.asset2);
        if (existingPair && pair.correlation > existingPair.correlation) {
          assetIndexMap.set(pair.asset2, pair.index);
        }
      } else {
        assetIndexMap.set(pair.asset2, pair.index);
      }
    });
    
    // Фильтруем информацию об активах только для тех, что в топ-10 парах
    // и только в том индексе, где они попали в топ
    // Убираем дубликаты по символу
    const uniqueAssets = new Map<string, any>();
    data.assetsInfo
      .filter(asset => {
        const expectedIndex = assetIndexMap.get(asset.symbol);
        return expectedIndex && asset.index === expectedIndex;
      })
      .forEach(asset => {
        // Если актив уже есть, оставляем тот, у которого больше волатильность
        if (uniqueAssets.has(asset.symbol)) {
          const existing = uniqueAssets.get(asset.symbol);
          if (asset.volatility > existing.volatility) {
            uniqueAssets.set(asset.symbol, asset);
          }
        } else {
          uniqueAssets.set(asset.symbol, asset);
        }
      });
    
    // Преобразуем в массив и сортируем по волатильности
    const relevantAssets = Array.from(uniqueAssets.values())
      .sort((a, b) => b.volatility - a.volatility);
    
    // Данные таблицы
    relevantAssets.forEach((asset, index) => {
      const rowY = 870 + index * 25;
      currentX = 70;
      
      // Определяем цвет для индекса
      let indexColor = '#495057';
      let indexText = asset.index;
      
      if (asset.index === 'IMOEX') {
        indexColor = '#e74c3c'; // Красный для российских акций
        indexText = '🇷🇺 IMOEX';
      } else if (asset.index === 'RUCBITR') {
        indexColor = '#9b59b6'; // Фиолетовый для корпоративных облигаций
        indexText = '🏢 RUCBITR';
      } else if (asset.index === 'RGBI') {
        indexColor = '#f39c12'; // Оранжевый для облигаций
        indexText = '📈 RGBI';
      } else if (asset.index === 'S&P500') {
        indexColor = '#3498db'; // Синий для S&P500
      } else if (asset.index === 'NASDAQ') {
        indexColor = '#2ecc71'; // Зеленый для NASDAQ
      }
      
      // Символ
      this.ctx.fillStyle = '#007bff';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.fillText(asset.symbol, currentX, rowY);
      currentX += columnWidths[0];
      
      // Цена
      this.ctx.fillStyle = '#28a745';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(asset.currentPrice.toFixed(2), currentX, rowY);
      currentX += columnWidths[1];
      
      // Волатильность
      this.ctx.fillStyle = '#dc3545';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.fillText(asset.volatility.toFixed(2), currentX, rowY);
      currentX += columnWidths[2];
      
      // Доходность
      this.ctx.fillStyle = asset.avgReturn >= 0 ? '#28a745' : '#dc3545';
      this.ctx.font = '12px Arial';
      this.ctx.fillText((asset.avgReturn * 100).toFixed(2), currentX, rowY);
      currentX += columnWidths[3];
      
      // Дивиденды/Купоны
      let dividendCouponText = '';
      if (asset.dividendYield) {
        dividendCouponText = `Д: ${asset.dividendYield}%`;
        this.ctx.fillStyle = '#28a745';
      } else if (asset.couponRate) {
        dividendCouponText = `К: ${asset.couponRate}%`;
        this.ctx.fillStyle = '#ffc107';
      } else {
        dividendCouponText = '-';
        this.ctx.fillStyle = '#6c757d';
      }
      this.ctx.font = '11px Arial';
      this.ctx.fillText(dividendCouponText, currentX, rowY);
      currentX += columnWidths[4];
      
      // Индекс
      this.ctx.fillStyle = indexColor;
      this.ctx.font = '12px Arial';
      this.ctx.fillText(indexText, currentX, rowY);
    });
  }

  private drawFooter(): void {
    this.ctx.fillStyle = '#6c757d';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${this.i18n.t('generated_on')}: ${this.i18n.formatDate(new Date())}`, this.width / 2, this.height - 20);
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
        throw new Error(this.i18n.t('error_loading_data'));
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
      this.drawAssetsInfo(data); // Добавляем вызов новой функции
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
      logger.error(`❌ ${this.i18n.t('error_generating_infographic')}:`, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  public async generateIndexInfographic(analysis: IndexAnalysis): Promise<void> {
    try {
      logger.info(`🎨 Начинаю создание инфографики для ${analysis.indexName}...`);
      
      // Очищаем холст
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      // Рисуем элементы для конкретного индекса
      this.drawIndexHeader(analysis);
      this.drawIndexStats(analysis);
      this.drawIndexPairsTable(analysis);
      this.drawIndexAssetsInfo(analysis);
      this.drawFooter();
      
      // Создаем папку для конкретного индекса
      const indexNameLower = analysis.indexName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const indexInfographicsDir = path.join(this.infographicsDir, indexNameLower);
      await fs.ensureDir(indexInfographicsDir);
      
      // Генерируем имя файла
      const today = new Date();
      const fileName = `pairs-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.png`;
      const filePath = path.join(indexInfographicsDir, fileName);
      
      // Сохраняем файл
      const buffer = this.canvas.toBuffer('image/png');
      await fs.writeFile(filePath, buffer);
      
      logger.info(`✅ Инфографика ${analysis.indexName} сохранена: ${filePath}`);
      
    } catch (error) {
      logger.error(`❌ ${this.i18n.t('error_generating_infographic')} для ${analysis.indexName}:`, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private drawIndexHeader(analysis: IndexAnalysis): void {
    // Заголовок для конкретного индекса
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillText(`${this.i18n.t('index_analysis')}: ${analysis.indexName}`, 70, 50);
    
    // Подзаголовок
    this.ctx.fillStyle = '#7f8c8d';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`${this.i18n.t('analysis_date')}: ${this.i18n.formatDate(new Date(analysis.analysisDate))}`, 70, 75);
  }

  private drawIndexStats(analysis: IndexAnalysis): void {
    // Статистика для конкретного индекса
    this.ctx.fillStyle = '#34495e';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.fillText(this.i18n.t('total_pairs'), 70, 120);
    
    this.ctx.fillStyle = '#34495e';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`${this.i18n.t('total_pairs')}: ${analysis.totalPairs.toLocaleString()}`, 70, 150);
    this.ctx.fillText(`${this.i18n.t('correlation_threshold')}: ${this.i18n.formatPercentage(analysis.correlationThreshold * 100)}`, 70, 170);
    this.ctx.fillText(`${this.i18n.t('average_correlation')}: ${this.i18n.formatPercentage(analysis.averageCorrelation * 100)}`, 70, 190);
    this.ctx.fillText(`${this.i18n.t('max_correlation')}: ${this.i18n.formatPercentage(analysis.maxCorrelation * 100)}`, 70, 210);
    this.ctx.fillText(`${this.i18n.t('top_pairs')}: ${analysis.topPairs.length}`, 70, 230);
  }

  private drawIndexPairsTable(analysis: IndexAnalysis): void {
    // Таблица топ-пар для конкретного индекса
    this.ctx.fillStyle = '#34495e';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.fillText(this.i18n.t('top_pairs'), 70, 280);
    
    // Заголовки таблицы
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.fillText(this.i18n.t('asset_pair'), 70, 310);
    this.ctx.fillText(this.i18n.t('correlation'), 250, 310);
    this.ctx.fillText(this.i18n.t('strategy'), 350, 310);
    this.ctx.fillText(this.i18n.t('volatility'), 500, 310);
    
    // Данные таблицы
    analysis.topPairs.slice(0, 8).forEach((pair, index) => {
      const rowY = 340 + index * 25;
      
      this.ctx.fillStyle = '#34495e';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`${pair.asset1} ↔ ${pair.asset2}`, 70, rowY);
      this.ctx.fillText(`${(pair.correlation * 100).toFixed(2)}%`, 250, rowY);
      this.ctx.fillText(pair.strategy, 350, rowY);
      this.ctx.fillText(`${pair.volatility1.toFixed(2)}% / ${pair.volatility2.toFixed(2)}%`, 500, rowY);
    });
  }

  private drawIndexAssetsInfo(analysis: IndexAnalysis): void {
    // Информация об активах для конкретного индекса
    this.ctx.fillStyle = '#34495e';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.fillText(this.i18n.t('assets_info'), 70, 600);
    
    // Заголовки таблицы
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.fillText(this.i18n.t('symbol'), 70, 630);
    this.ctx.fillText(this.i18n.t('price'), 150, 630);
    this.ctx.fillText(this.i18n.t('volatility'), 250, 630);
    this.ctx.fillText(this.i18n.t('avg_return'), 350, 630);
    this.ctx.fillText('Див/Купон', 450, 630);
    
    // Данные таблицы
    analysis.assetsInfo.slice(0, 10).forEach((asset, index) => {
      const rowY = 660 + index * 25;
      
      this.ctx.fillStyle = '#34495e';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(asset.symbol, 70, rowY);
      this.ctx.fillText(`$${asset.currentPrice.toFixed(2)}`, 150, rowY);
      this.ctx.fillText(`${asset.volatility.toFixed(2)}%`, 250, rowY);
      this.ctx.fillText(`${(asset.avgReturn * 100).toFixed(2)}%`, 350, rowY);
      
      // Дивиденды/Купоны
      let dividendCouponText = '';
      if (asset.dividendYield) {
        dividendCouponText = `Д: ${asset.dividendYield}%`;
        this.ctx.fillStyle = '#28a745';
      } else if (asset.couponRate) {
        dividendCouponText = `К: ${asset.couponRate}%`;
        this.ctx.fillStyle = '#ffc107';
      } else {
        dividendCouponText = '-';
        this.ctx.fillStyle = '#6c757d';
      }
      this.ctx.font = '11px Arial';
      this.ctx.fillText(dividendCouponText, 450, rowY);
    });
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