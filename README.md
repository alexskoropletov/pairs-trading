# Stock Analyzer

TypeScript проект для анализа акций и криптовалют с использованием теории портфеля Марковица.

## Структура проекта

```
src/
├── types.ts           # Типы TypeScript
├── stock.ts           # Данные активов (30 активов: 10 крипто + 20 S&P500)
├── fetch_prices.ts    # Загрузка цен через Yahoo Finance API
├── markowitz_portfolio.ts  # Расчет портфеля Марковица
└── plot_returns.ts    # Построение графиков доходностей

stats/                 # CSV файлы с данными
dist/                  # Скомпилированные JS файлы
```

## Активы в анализе

### Криптовалюты (топ-10 по капитализации)
- BTC-USD (Bitcoin)
- ETH-USD (Ethereum) 
- USDT-USD (Tether)
- XRP-USD (XRP)
- BNB-USD (Binance Coin)
- SOL-USD (Solana)
- USDC-USD (USD Coin)
- TRX-USD (TRON)
- DOGE-USD (Dogecoin)
- ADA-USD (Cardano)

### S&P500 акции (топ-20 по капитализации)
- MSFT (Microsoft)
- NVDA (NVIDIA)
- AAPL (Apple)
- AMZN (Amazon)
- GOOG (Alphabet)
- META (Meta Platforms)
- AVGO (Broadcom)
- TSLA (Tesla)
- BRK-B (Berkshire Hathaway)
- WMT (Walmart)
- JPM (JPMorgan Chase)
- LLY (Eli Lilly)
- V (Visa)
- ORCL (Oracle)
- NFLX (Netflix)
- MA (Mastercard)
- XOM (Exxon Mobil)
- COST (Costco)
- PG (Procter & Gamble)
- JNJ (Johnson & Johnson)

## Команды

```bash
# Установка зависимостей
npm install

# Сборка TypeScript
npm run build

# Загрузка цен акций (сохраняет CSV в stats/)
npm run prices

# Расчет портфеля Марковица
npm run portfolio

# Построение графиков доходностей
npm run plot-returns

# Анализ пар для парного трейдинга
npm run pairs-trading

# Запуск всех анализов
npm start

# Разработка (без сборки)
npm run dev
npm run dev:portfolio
npm run dev:plot
npm run dev:pairs
```

## Параметры командной строки

### Парный трейдинг
```bash
# Анализ за последние 3 месяца (по умолчанию)
npm run pairs-trading

# Анализ за последние 6 месяцев
npm run pairs-trading -- --days=126

# Анализ за последний месяц
npm run pairs-trading -- --days=21
```

## Функциональность

1. **Загрузка данных**: Получение годовых данных через Yahoo Finance API
2. **Портфель Марковица**: Оптимизация с минимальным риском
3. **Эффективная граница**: Расчет оптимальных портфелей
4. **Анализ доходностей**: Гистограммы распределения дневных доходностей
5. **Парный трейдинг**: Поиск пар активов с высокой корреляцией для стратегии LONG/SHORT
6. **Статистика**: Среднее, стандартное отклонение, коэффициент Шарпа

## Стратегия парного трейдинга

Скрипт `pairs_trading.ts` анализирует все возможные пары активов и находит топ-3 с наивысшей корреляцией доходностей. Для каждой пары:

- **Корреляция**: Измеряется связь между дневными доходностями активов
- **Перспективность**: Оценивается по упрощенному коэффициенту Шарпа (доходность/волатильность)
- **Стратегия**: Более перспективный актив берется в LONG, менее перспективный - в SHORT
- **Горизонт**: По умолчанию анализируются последние 3 месяца (63 торговых дня)

**Результаты сохраняются в:**
- `stats/pairs_trading.csv` - детальная информация о топ-3 парах
- `stats/pairs_analysis.json` - полная статистика анализа

## Технологии

- TypeScript
- Yahoo Finance API
- Matrix математика (ml-matrix)
- Графики (nodeplotlib)
- CSV обработка 