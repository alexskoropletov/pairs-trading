# Stock Analyzer

Простой анализатор акций с функциями парного трейдинга, оптимизации портфеля Марковица и интеграцией с Telegram.

## 📚 Документация

Подробная документация по всем изменениям и улучшениям проекта находится в папке [docs/](./docs/README.md).

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

- 📈 Загрузка данных акций с Yahoo Finance
- 🔗 Анализ парного трейдинга с разделением по индексам (S&P500 и NASDAQ)
- 📊 Оптимизация портфеля по методу Марковица
- 📱 Отправка результатов в Telegram
- 🎯 Динамическое получение тикеров S&P500 и NASDAQ-2000
- 📋 Валидация корреляций и активов

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

# Получение тикеров S&P500 и NASDAQ-2000
npm run get-stocks

# Отправка сообщения в Telegram
npm run telegram

# Построение графиков доходности
npm run plot-returns
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

Скрипт создает визуальную инфографику на основе результатов анализа пар:

```bash
# Создание инфографики
npm run infographic

# Разработка (без компиляции)
npm run dev:infographic
```

### Что включает инфографика:

- **Общая статистика**: количество пар по индексам
- **Корреляция**: средняя, максимальная и минимальная
- **Топ-10 пар**: лучшие пары для торговли
- **График корреляций**: визуализация распределения
- **Автоматическое именование**: `pairs-YYYY-MM-DD.png`

### Структура файлов:

```
infographics/
├── pairs-2024-01-15.png
├── pairs-2024-01-16.png
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
│   └── telegram_sender.test.ts # Тесты Telegram интеграции
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
└── plot_returns.ts           # Построение графиков

stats/                         # Результаты анализа
├── *.csv                     # CSV файлы с данными
├── pairs_analysis.json       # Результаты парного трейдинга
├── portfolio_summary.json    # Сводка портфеля
└── *.png                     # Графики
```

## Результаты анализа

### Парный трейдинг

Анализ создает следующие файлы:
- `pairs_trading.csv` - все пары
- `pairs_trading_sp500.csv` - пары S&P500
- `pairs_trading_nasdaq.csv` - пары NASDAQ
- `pairs_analysis.json` - полный анализ

### Портфель Марковица

Создает файлы:
- `markowitz_portfolio.csv` - оптимальные веса
- `efficient_frontier.csv` - эффективная граница
- `portfolio_summary.json` - сводка портфеля

## Telegram интеграция

Для отправки результатов в Telegram:

1. Получите API ключи на https://my.telegram.org
2. Настройте переменные окружения
3. Запустите: `npm run telegram`

## Валидация данных

Система включает проверки:
- Корреляция < 1
- Различные активы в паре
- Минимальная корреляция (по умолчанию 0.7)
- Разделение по индексам

## Лицензия

MIT 