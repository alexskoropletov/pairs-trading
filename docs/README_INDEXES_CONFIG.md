# Конфигурация индексов

Система анализа акций поддерживает гибкую конфигурацию индексов через файл `src/indexes_config.json`.

## Структура конфигурации

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
    },
    "nasdaq": {
      "name": "NASDAQ",
      "displayName": "📈 NASDAQ",
      "description": "Технологические акции",
      "enabled": true,
      "correlationThreshold": 0.7,
      "color": "#2ecc71",
      "emoji": "📈"
    },
    "imoex": {
      "name": "IMOEX",
      "displayName": "🇷🇺 IMOEX",
      "description": "Российские акции",
      "enabled": true,
      "correlationThreshold": 0.6,
      "color": "#e74c3c",
      "emoji": "🇷🇺"
    },
    "rucbitr": {
      "name": "RUCBITR",
      "displayName": "🏢 RUCBITR",
      "description": "Российские корпоративные облигации",
      "enabled": false,
      "correlationThreshold": 0.6,
      "color": "#9b59b6",
      "emoji": "🏢"
    },
    "rgbi": {
      "name": "RGBI",
      "displayName": "📈 RGBI",
      "description": "Российские облигации",
      "enabled": false,
      "correlationThreshold": 0.6,
      "color": "#f39c12",
      "emoji": "📈"
    }
  },
  "defaultCorrelationThreshold": 0.7,
  "defaultTopPairsCount": 3
}
```

## Параметры индекса

### Основные параметры

- **name**: Внутреннее название индекса
- **displayName**: Отображаемое название с эмодзи
- **description**: Описание индекса
- **enabled**: Включен ли индекс (true/false)
- **correlationThreshold**: Порог корреляции для анализа пар (0.0-1.0)
- **color**: Цвет для визуализации
- **emoji**: Эмодзи для отображения

### Глобальные параметры

- **defaultCorrelationThreshold**: Порог корреляции по умолчанию
- **defaultTopPairsCount**: Количество топ-пар по умолчанию

## Управление индексами

### Включение/отключение индексов

Чтобы отключить индекс, установите `"enabled": false`:

```json
"rucbitr": {
  "enabled": false
}
```

Чтобы включить индекс, установите `"enabled": true`:

```json
"rucbitr": {
  "enabled": true
}
```

### Настройка порогов корреляции

Каждый индекс может иметь свой порог корреляции:

```json
"sp500": {
  "correlationThreshold": 0.8  // Более строгий порог
},
"imoex": {
  "correlationThreshold": 0.5  // Более мягкий порог
}
```

## Поведение системы

### При включенном индексе (enabled: true)

1. **Загрузка данных**: Система пытается загрузить данные для тикеров этого индекса
2. **Анализ пар**: Выполняется анализ корреляций между парами активов
3. **Создание отчетов**: Генерируются JSON и CSV файлы с результатами
4. **Создание инфографик**: Генерируются PNG файлы с визуализацией
5. **Отправка в Telegram**: Результаты отправляются в Telegram канал

### При отключенном индексе (enabled: false)

1. **Пропуск загрузки**: Данные для тикеров этого индекса не загружаются
2. **Пропуск анализа**: Анализ пар не выполняется
3. **Пропуск отчетов**: JSON и CSV файлы не создаются
4. **Пропуск инфографик**: PNG файлы не генерируются
5. **Пропуск отправки**: Результаты не отправляются в Telegram

## Логирование

Система логирует информацию о конфигурации:

```
📋 Конфигурация индексов загружена
📋 Активные индексы (3):
  🇺🇸 S&P500 - Американские акции (порог корреляции: 70%)
  📈 NASDAQ - Технологические акции (порог корреляции: 70%)
  🇷🇺 IMOEX - Российские акции (порог корреляции: 60%)
```

## Примеры использования

### Отключение всех российских индексов

```json
{
  "imoex": { "enabled": false },
  "rucbitr": { "enabled": false },
  "rgbi": { "enabled": false }
}
```

### Настройка строгих порогов для американских индексов

```json
{
  "sp500": { "correlationThreshold": 0.8 },
  "nasdaq": { "correlationThreshold": 0.8 }
}
```

### Включение только S&P500

```json
{
  "sp500": { "enabled": true },
  "nasdaq": { "enabled": false },
  "imoex": { "enabled": false },
  "rucbitr": { "enabled": false },
  "rgbi": { "enabled": false }
}
```

## Файлы конфигурации

- **Источник**: `src/indexes_config.json`
- **Сборка**: `dist/indexes_config.json` (копируется автоматически)

## API

Система предоставляет TypeScript API для работы с конфигурацией:

```typescript
import indexesConfigManager from './indexes_config';

// Получить все активные индексы
const enabledIndexes = indexesConfigManager.getEnabledIndexes();

// Проверить, включен ли индекс
const isSp500Enabled = indexesConfigManager.isIndexEnabled('sp500');

// Получить порог корреляции для индекса
const threshold = indexesConfigManager.getIndexCorrelationThreshold('sp500');

// Получить отображаемое имя индекса
const displayName = indexesConfigManager.getIndexDisplayName('sp500');
```

## Перезапуск системы

После изменения конфигурации:

1. Пересоберите проект: `npm run build`
2. Скопируйте конфигурацию: `cp src/indexes_config.json dist/`
3. Запустите анализ: `./start.sh` 