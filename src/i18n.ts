// Интерфейс для переводов
interface Translations {
  [key: string]: string;
}

// Интерфейс для языковых настроек
interface LanguageConfig {
  [key: string]: Translations;
}

// Поддерживаемые языки
export type SupportedLanguage = 'ru' | 'en';

// Переводы для разных языков
const translations: LanguageConfig = {
  ru: {
    // Заголовки
    'pairs_trading_analysis': 'Анализ парного трейдинга',
    'correlated_pairs_analysis': 'Анализ коррелированных пар акций',
    'index_analysis': 'Анализ индекса',
    
    // Статистика
    'total_pairs': 'Всего пар',
    'average_correlation': 'Средняя корреляция',
    'max_correlation': 'Максимальная корреляция',
    'min_correlation': 'Минимальная корреляция',
    'correlation_threshold': 'Порог корреляции',
    
    // Индексы
    'sp500': 'S&P500',
    'nasdaq': 'NASDAQ',
    'imoex': 'IMOEX',
    'rucbitr': 'RUCBITR',
    'rgbi': 'RGBI',
    
    // Таблицы
    'top_pairs': 'Топ пары',
    'asset_pair': 'Пара активов',
    'correlation': 'Корреляция',
    'strategy': 'Стратегия',
    'volatility': 'Волатильность',
    'avg_return': 'Средняя доходность',
    'current_price': 'Текущая цена',
    
    // Стратегии
    'long_short': 'Long/Short',
    'short_long': 'Short/Long',
    
    // Информация об активах
    'assets_info': 'Информация об активах',
    'symbol': 'Символ',
    'price': 'Цена',
    'index': 'Индекс',
    
    // Графики
    'correlation_distribution': 'Распределение корреляций',
    'correlation_value': 'Значение корреляции',
    'number_of_pairs': 'Количество пар',
    
    // Футер
    'generated_on': 'Сгенерировано',
    'analysis_date': 'Дата анализа',
    
    // Сообщения
    'no_data_available': 'Нет доступных данных',
    'insufficient_data': 'Недостаточно данных',
    'analysis_completed': 'Анализ завершен',
    
    // Эмодзи для индексов
    'sp500_emoji': '🇺🇸',
    'nasdaq_emoji': '📈',
    'imoex_emoji': '🇷🇺',
    'rucbitr_emoji': '🏢',
    'rgbi_emoji': '📈',
    
    // Форматирование
    'percentage_format': '{value}%',
    'date_format': 'DD.MM.YYYY',
    'time_format': 'HH:mm:ss',
    
    // Ошибки
    'error_loading_data': 'Ошибка загрузки данных',
    'error_generating_infographic': 'Ошибка создания инфографики',
    'error_saving_file': 'Ошибка сохранения файла'
  },
  
  en: {
    // Headers
    'pairs_trading_analysis': 'Pairs Trading Analysis',
    'correlated_pairs_analysis': 'Correlated Pairs Analysis',
    'index_analysis': 'Index Analysis',
    
    // Statistics
    'total_pairs': 'Total Pairs',
    'average_correlation': 'Average Correlation',
    'max_correlation': 'Max Correlation',
    'min_correlation': 'Min Correlation',
    'correlation_threshold': 'Correlation Threshold',
    
    // Indices
    'sp500': 'S&P500',
    'nasdaq': 'NASDAQ',
    'imoex': 'IMOEX',
    'rucbitr': 'RUCBITR',
    'rgbi': 'RGBI',
    
    // Tables
    'top_pairs': 'Top Pairs',
    'asset_pair': 'Asset Pair',
    'correlation': 'Correlation',
    'strategy': 'Strategy',
    'volatility': 'Volatility',
    'avg_return': 'Avg Return',
    'current_price': 'Current Price',
    
    // Strategies
    'long_short': 'Long/Short',
    'short_long': 'Short/Long',
    
    // Assets info
    'assets_info': 'Assets Information',
    'symbol': 'Symbol',
    'price': 'Price',
    'index': 'Index',
    
    // Charts
    'correlation_distribution': 'Correlation Distribution',
    'correlation_value': 'Correlation Value',
    'number_of_pairs': 'Number of Pairs',
    
    // Footer
    'generated_on': 'Generated on',
    'analysis_date': 'Analysis Date',
    
    // Messages
    'no_data_available': 'No data available',
    'insufficient_data': 'Insufficient data',
    'analysis_completed': 'Analysis completed',
    
    // Emojis for indices
    'sp500_emoji': '🇺🇸',
    'nasdaq_emoji': '📈',
    'imoex_emoji': '🇷🇺',
    'rucbitr_emoji': '🏢',
    'rgbi_emoji': '📈',
    
    // Formatting
    'percentage_format': '{value}%',
    'date_format': 'MM/DD/YYYY',
    'time_format': 'HH:mm:ss',
    
    // Errors
    'error_loading_data': 'Error loading data',
    'error_generating_infographic': 'Error generating infographic',
    'error_saving_file': 'Error saving file'
  }
};

// Класс для управления переводами
export class I18n {
  private currentLanguage: SupportedLanguage;
  private fallbackLanguage: SupportedLanguage = 'ru';

  constructor(language: SupportedLanguage = 'ru') {
    this.currentLanguage = this.isValidLanguage(language) ? language : this.fallbackLanguage;
  }

  // Проверка валидности языка
  private isValidLanguage(language: string): language is SupportedLanguage {
    return language === 'ru' || language === 'en';
  }

  // Получение перевода
  public t(key: string, params?: Record<string, string | number>): string {
    const translation = translations[this.currentLanguage]?.[key] || 
                      translations[this.fallbackLanguage]?.[key] || 
                      key;

    if (params) {
      return this.interpolate(translation, params);
    }

    return translation;
  }

  // Интерполяция параметров в строку
  private interpolate(text: string, params: Record<string, string | number>): string {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key]?.toString() || match;
    });
  }

  // Получение текущего языка
  public getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  // Установка языка
  public setLanguage(language: SupportedLanguage): void {
    if (this.isValidLanguage(language)) {
      this.currentLanguage = language;
    }
  }

  // Получение эмодзи для индекса
  public getIndexEmoji(indexName: string): string {
    const emojiKey = `${indexName.toLowerCase()}_emoji`;
    return this.t(emojiKey) || '📊';
  }

  // Форматирование процентов
  public formatPercentage(value: number): string {
    return this.t('percentage_format', { value: value.toFixed(2) });
  }

  // Форматирование даты
  public formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    if (this.currentLanguage === 'en') {
      return `${month}/${day}/${year}`;
    } else {
      return `${day}.${month}.${year}`;
    }
  }

  // Получение списка поддерживаемых языков
  public static getSupportedLanguages(): SupportedLanguage[] {
    return ['ru', 'en'];
  }

  // Проверка поддержки языка
  public static isLanguageSupported(language: string): language is SupportedLanguage {
    return I18n.getSupportedLanguages().includes(language as SupportedLanguage);
  }
}

// Функция для получения языка из аргументов командной строки
export function getLanguageFromArgs(): SupportedLanguage {
  const languageArg = process.argv.find(arg => arg.startsWith('--lang=') || arg.startsWith('--language='));
  
  if (languageArg) {
    const language = languageArg.split('=')[1];
    if (I18n.isLanguageSupported(language)) {
      return language as SupportedLanguage;
    }
  }
  
  return 'ru'; // По умолчанию русский
}

// Создание экземпляра i18n с языком из аргументов
export function createI18n(): I18n {
  const language = getLanguageFromArgs();
  return new I18n(language);
}

// Экспорт по умолчанию
export default I18n; 