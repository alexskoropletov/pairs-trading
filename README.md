# Stock Analyzer

Продвинутый анализатор акций и облигаций с функциями парного трейдинга, оптимизации портфеля Марковица, поддержкой российских рынков и интеграцией с Telegram.

## 📚 Документация

Подробная документация по всем изменениям и улучшениям проекта находится в папке [docs/](./docs/README.md).

### Ключевые документы:
- [📊 Анализ по индексам](./docs/INDEX_ANALYSIS_SUMMARY.md)
- [🇷🇺 Российские источники данных](./docs/RUSSIAN_SOURCES.md)
- [🔗 Анализ российских пар](./docs/RUSSIAN_PAIRS_ANALYSIS.md)
- [🌍 Интернационализация](./docs/I18N_IMPLEMENTATION.md)
- [⚙️ Конфигурация индексов](./docs/README_INDEXES_CONFIG.md)

## 🌍 Поддерживаемые рынки

### 🇺🇸 Американские рынки
- **S&P500** - крупнейшие американские компании
- **NASDAQ** - технологические акции

### 🇷🇺 Российские рынки
- **IMOEX** - российские акции (МосБиржа)
- **RUCBITR** - российские корпоративные облигации
- **RGBI** - российские государственные облигации

## 🌍 Интернационализация (i18n)

Проект поддерживает создание инфографик на разных языках:

### Создание инфографики на русском языке (по умолчанию)
```bash
npm run infographic
npm run dev:infographic
```

### Создание инфографики на английском языке
```bash
npm run infographic:en
npm run dev:infographic:en
```

### Запуск полного анализа с указанием языка
```bash
./start.sh ru    # Русский (по умолчанию)
./start.sh en    # Английский
```

Подробная документация по i18n: [docs/I18N_IMPLEMENTATION.md](./docs/I18N_IMPLEMENTATION.md)

## Возможности

- 📈 Загрузка данных акций с Yahoo Finance и российских источников
- 🔗 Анализ парного трейдинга с разделением по индексам
- 📊 Оптимизация портфеля по методу Марковица для каждого индекса
- 📱 Отправка результатов в Telegram с поддержкой отключенных индексов
- 🎯 Динамическое получение тикеров S&P500, NASDAQ и российских индексов
- 📋 Валидация корреляций и активов
- 🎨 Создание инфографик для каждого индекса
- 🌍 Поддержка многоязычности (русский/английский)
- 📁 Автоматическое создание структуры папок
- ⚙️ Гибкая конфигурация индексов через JSON

## Установка

```bash
npm install
```

## Настройка

1. Скопируйте `.env-example` в `.env`:
```bash
cp .env-example .env
```

2. Заполните переменные окружения:
```env
# Telegram API (опционально)
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_PHONE=your_phone
TELEGRAM_PASSWORD=your_password
TELEGRAM_CHANNEL_ID=your_channel_id

# Настройки анализа
TOP_PAIRS_COUNT=3
MIN_CORRELATION=0.7
```

## Использование

### 🚀 Быстрый старт

```bash
# Полный анализ всех индексов
./start.sh

# Полный анализ с указанием языка
./start.sh ru  # Русский
./start.sh en  # Английский
```

### Основные команды

```bash
# Сборка проекта
npm run build

# Загрузка данных акций
npm run prices

# Анализ парного трейдинга
npm run pairs-trading

# Оптимизация портфеля Марковица
npm run portfolio

# Получение тикеров индексов
npm run get-stocks

# Отправка сообщения в Telegram
npm run telegram

# Построение графиков доходности
npm run plot-returns
```

### 📊 Анализ по индексам

```bash
# Анализ пар по всем индексам
npm run index-analysis
npm run dev:index-analysis

# Анализ портфелей по индексам
npm run index-portfolio
npm run dev:index-portfolio
```

### Разработка

```bash
# Запуск в режиме разработки
npm run dev
npm run dev:pairs
npm run dev:portfolio
npm run dev:stocks
```

## 📊 Создание инфографики

Скрипт создает визуальную инфографику для каждого индекса:

```bash
# Создание инфографики
npm run infographic

# Разработка (без компиляции)
npm run dev:infographic

# Создание для конкретного языка
npm run infographic:en  # Английский
npm run infographic:ru  # Русский
```

### Что включает инфографика:

- **Общая статистика**: количество пар по индексам
- **Корреляция**: средняя, максимальная и минимальная
- **Топ-10 пар**: лучшие пары для торговли
- **График корреляций**: визуализация распределения
- **Автоматическое именование**: `{index}-pairs-YYYY-MM-DD.png`

### Структура файлов:

```
infographics/
├── sp500/
│   ├── sp500-pairs-2024-01-15.png
│   └── ...
├── nasdaq/
│   ├── nasdaq-pairs-2024-01-15.png
│   └── ...
├── imoex/
│   ├── imoex-pairs-2024-01-15.png
│   └── ...
├── rucbitr/
│   ├── rucbitr-pairs-2024-01-15.png
│   └── ...
└── rgbi/
    ├── rgbi-pairs-2024-01-15.png
    └── ...
```

## Тестирование

### Установка зависимостей для тестирования

```bash
npm install
```

### Запуск тестов

```bash
# Все тесты
npm test

# Только unit-тесты
npm run test:unit

# Только e2e-тесты
npm run test:e2e

# Тесты с покрытием
npm run test:coverage

# Тесты в режиме watch
npm run test:watch

# Специальные тесты
npm run test:russian        # Тесты российских источников
npm run test:russian-pairs  # Тесты российских пар
```

### Структура тестов

```
tests/
├── setup.ts                    # Глобальная настройка тестов
├── unit/                       # Unit-тесты
│   ├── types.test.ts          # Тесты типов данных
│   ├── stock.test.ts          # Тесты модуля stock
│   ├── pairs_trading.test.ts  # Тесты парного трейдинга
│   ├── markowitz_portfolio.test.ts # Тесты портфеля Марковица
│   ├── telegram_sender.test.ts # Тесты Telegram интеграции
│   ├── russian_sources.test.ts # Тесты российских источников
│   └── russian_pairs.test.ts  # Тесты российских пар
└── e2e/                        # End-to-end тесты
    ├── fetch_prices.test.ts    # Тесты загрузки данных
    ├── pairs_trading_integration.test.ts # Интеграционные тесты парного трейдинга
    ├── markowitz_portfolio_integration.test.ts # Интеграционные тесты портфеля
    └── telegram_integration.test.ts # Интеграционные тесты Telegram
```

### Покрытие тестами

Тесты покрывают:
- ✅ Все основные модули
- ✅ Математические вычисления
- ✅ Обработку ошибок
- ✅ Интеграцию между модулями
- ✅ Работу с файлами
- ✅ Telegram API
- ✅ Российские источники данных
- ✅ Многоязычность

## Структура проекта

```
src/
├── types.ts                    # Типы данных
├── logger.ts                   # Логирование
├── stock.ts                    # Управление данными акций
├── fetch_prices.ts            # Загрузка данных с Yahoo Finance
├── pairs_trading.ts           # Анализ парного трейдинга
├── markowitz_portfolio.ts     # Оптимизация портфеля
├── telegram_sender.ts         # Интеграция с Telegram
├── get_s_n_p.ts              # Получение тикеров индексов
├── plot_returns.ts           # Построение графиков
├── create_infographic.ts     # Создание инфографик
├── i18n.ts                   # Интернационализация
├── indexes_config.ts         # Конфигурация индексов
├── index_analysis.ts         # Анализ по индексам
├── index_pairs_analysis.ts   # Анализ пар по индексам
├── index_portfolio_analysis.ts # Анализ портфелей по индексам
├── russian_data_sources.ts   # Российские источники данных
├── bond_data_sources.ts      # Источники данных облигаций
└── utils.ts                  # Утилиты

stats/                         # Результаты анализа
├── sp500/                     # Отчеты S&P500
├── nasdaq/                    # Отчеты NASDAQ
├── imoex/                     # Отчеты IMOEX
├── rucbitr/                   # Отчеты RUCBITR
├── rgbi/                      # Отчеты RGBI
├── index_reports/             # Сводные отчеты по индексам
├── portfolio_reports/         # Отчеты портфелей
├── *.csv                      # CSV файлы с данными
├── pairs_analysis.json        # Результаты парного трейдинга
├── portfolio_summary.json     # Сводка портфеля
└── summary.json               # Общая сводка

infographics/                  # Инфографики
├── sp500/                     # Инфографики S&P500
├── nasdaq/                    # Инфографики NASDAQ
├── imoex/                     # Инфографики IMOEX
├── rucbitr/                   # Инфографики RUCBITR
├── rgbi/                      # Инфографики RGBI
└── *.png                      # Общие инфографики
```

## Результаты анализа

### Парный трейдинг

Анализ создает следующие файлы для каждого индекса:
- `pairs_trading_{index}.csv` - пары по индексу
- `pairs_analysis.json` - полный анализ
- `stats/{index}/pairs_report.json` - детальный отчет по индексу

### Портфель Марковица

Создает файлы для каждого индекса:
- `markowitz_portfolio_{index}.csv` - оптимальные веса
- `efficient_frontier_{index}.csv` - эффективная граница
- `portfolio_summary_{index}.json` - сводка портфеля

### Сводные отчеты

- `stats/index_reports/summary.json` - сводка по всем индексам
- `stats/portfolio_reports/` - отчеты портфелей
- `infographics/{index}/` - инфографики по индексам

## Конфигурация индексов

Индексы настраиваются в `src/indexes_config.json`:

```json
{
  "indexes": {
    "sp500": {
      "name": "S&P500",
      "displayName": "🇺🇸 S&P500",
      "description": "Американские акции",
      "enabled": true,
      "correlationThreshold": 0.7,
      "color": "#3498db",
      "emoji": "🇺🇸"
    }
  }
}
```

## Telegram интеграция

Для отправки результатов в Telegram:

1. Получите API ключи на https://my.telegram.org
2. Настройте переменные окружения
3. Запустите: `npm run telegram`

**Особенности:**
- Отправка результатов по каждому индексу отдельно
- Исключение отключенных индексов из отправки
- Поддержка инфографик и текстовых отчетов

## Валидация данных

Система включает проверки:
- Корреляция < 1
- Различные активы в паре
- Минимальная корреляция (настраивается по индексам)
- Разделение по индексам
- Валидация российских тикеров

## Лицензия

MIT 