# Реализация интернационализации (i18n)

## Обзор

В проекте добавлена поддержка интернационализации для создания инфографик на разных языках. Система поддерживает русский (ru) и английский (en) языки.

## Архитектура

### Основные компоненты

1. **`src/i18n.ts`** - основной модуль интернационализации
2. **`src/create_infographic.ts`** - обновленный модуль создания инфографик
3. **Обновленные скрипты в `package.json`**
4. **Обновленный `start.sh`**

### Структура переводов

```typescript
const translations: LanguageConfig = {
  ru: {
    // Русские переводы
    'pairs_trading_analysis': 'Анализ парного трейдинга',
    'correlation': 'Корреляция',
    // ...
  },
  en: {
    // Английские переводы
    'pairs_trading_analysis': 'Pairs Trading Analysis',
    'correlation': 'Correlation',
    // ...
  }
};
```

## Использование

### Командная строка

#### Создание инфографики на русском языке (по умолчанию)
```bash
npm run infographic
npm run dev:infographic
```

#### Создание инфографики на английском языке
```bash
npm run infographic:en
npm run dev:infographic:en
```

#### Создание инфографики на русском языке (явно)
```bash
npm run infographic:ru
npm run dev:infographic:ru
```

#### Запуск полного анализа с указанием языка
```bash
./start.sh ru    # Русский (по умолчанию)
./start.sh en    # Английский
```

### Программное использование

```typescript
import { I18n, createI18n } from './i18n';

// Создание экземпляра с языком из аргументов командной строки
const i18n = createI18n();

// Создание экземпляра с указанным языком
const ruI18n = new I18n('ru');
const enI18n = new I18n('en');

// Получение перевода
const title = i18n.t('pairs_trading_analysis');

// Интерполяция параметров
const percentage = i18n.t('percentage_format', { value: 25.5 }); // "25.50%"

// Форматирование даты
const date = i18n.formatDate(new Date()); // "15.01.2024" или "01/15/2024"

// Получение эмодзи для индекса
const emoji = i18n.getIndexEmoji('imoex'); // "🇷🇺"
```

## Поддерживаемые ключи переводов

### Заголовки
- `pairs_trading_analysis` - Анализ парного трейдинга
- `correlated_pairs_analysis` - Анализ коррелированных пар акций
- `index_analysis` - Анализ индекса

### Статистика
- `total_pairs` - Всего пар
- `average_correlation` - Средняя корреляция
- `max_correlation` - Максимальная корреляция
- `min_correlation` - Минимальная корреляция
- `correlation_threshold` - Порог корреляции

### Индексы
- `sp500` - S&P500
- `nasdaq` - NASDAQ
- `imoex` - IMOEX
- `rucbitr` - RUCBITR
- `rgbi` - RGBI

### Таблицы
- `top_pairs` - Топ пары
- `asset_pair` - Пара активов
- `correlation` - Корреляция
- `strategy` - Стратегия
- `volatility` - Волатильность
- `avg_return` - Средняя доходность
- `current_price` - Текущая цена

### Стратегии
- `long_short` - Long/Short
- `short_long` - Short/Long

### Информация об активах
- `assets_info` - Информация об активах
- `symbol` - Символ
- `price` - Цена
- `index` - Индекс

### Графики
- `correlation_distribution` - Распределение корреляций
- `correlation_value` - Значение корреляции
- `number_of_pairs` - Количество пар

### Футер
- `generated_on` - Сгенерировано
- `analysis_date` - Дата анализа

### Сообщения
- `no_data_available` - Нет доступных данных
- `insufficient_data` - Недостаточно данных
- `analysis_completed` - Анализ завершен

### Эмодзи для индексов
- `sp500_emoji` - 🇺🇸
- `nasdaq_emoji` - 📈
- `imoex_emoji` - 🇷🇺
- `rucbitr_emoji` - 🧬
- `rgbi_emoji` - 📈

### Форматирование
- `percentage_format` - {value}%
- `date_format` - DD.MM.YYYY / MM/DD/YYYY
- `time_format` - HH:mm:ss

### Ошибки
- `error_loading_data` - Ошибка загрузки данных
- `error_generating_infographic` - Ошибка создания инфографики
- `error_saving_file` - Ошибка сохранения файла

## Методы класса I18n

### Основные методы
- `t(key: string, params?: Record<string, string | number>): string` - получение перевода
- `getCurrentLanguage(): SupportedLanguage` - получение текущего языка
- `setLanguage(language: SupportedLanguage): void` - установка языка

### Специальные методы
- `getIndexEmoji(indexName: string): string` - получение эмодзи для индекса
- `formatPercentage(value: number): string` - форматирование процентов
- `formatDate(date: Date): string` - форматирование даты

### Статические методы
- `getSupportedLanguages(): SupportedLanguage[]` - список поддерживаемых языков
- `isLanguageSupported(language: string): boolean` - проверка поддержки языка

## Утилиты

### Функции для работы с аргументами командной строки
- `getLanguageFromArgs(): SupportedLanguage` - получение языка из аргументов
- `createI18n(): I18n` - создание экземпляра с языком из аргументов

## Тестирование

Создан тест `tests/unit/i18n.test.ts` для проверки всех функций интернационализации:

```bash
npm test tests/unit/i18n.test.ts
```

## Расширение

### Добавление нового языка

1. Добавить новый язык в `SupportedLanguage`:
```typescript
export type SupportedLanguage = 'ru' | 'en' | 'fr';
```

2. Добавить переводы в `translations`:
```typescript
fr: {
  'pairs_trading_analysis': 'Analyse du trading par paires',
  // ...
}
```

3. Обновить статические методы:
```typescript
public static getSupportedLanguages(): SupportedLanguage[] {
  return ['ru', 'en', 'fr'];
}
```

### Добавление новых ключей переводов

1. Добавить ключ во все языки в `translations`
2. Использовать в коде через `i18n.t('new_key')`

## Изменения в существующих файлах

### create_infographic.ts
- Добавлен импорт `I18n` и `createI18n`
- Добавлено поле `i18n` в класс `InfographicGenerator`
- Все текстовые строки заменены на вызовы `i18n.t()`
- Обновлены методы форматирования дат и процентов

### package.json
- Добавлены скрипты для создания инфографик на разных языках
- `infographic:en` и `infographic:ru` для продакшена
- `dev:infographic:en` и `dev:infographic:ru` для разработки

### start.sh
- Добавлена поддержка аргумента для указания языка
- `./start.sh ru` - русский (по умолчанию)
- `./start.sh en` - английский

## Преимущества реализации

1. **Централизованное управление переводами** - все переводы в одном месте
2. **Типобезопасность** - TypeScript обеспечивает проверку типов
3. **Легкое расширение** - простое добавление новых языков и ключей
4. **Гибкость** - поддержка интерполяции параметров
5. **Обратная совместимость** - существующий код продолжает работать
6. **Тестируемость** - полное покрытие тестами

## Заключение

Реализация интернационализации обеспечивает гибкость в создании инфографик на разных языках, сохраняя при этом простоту использования и расширяемость системы. 