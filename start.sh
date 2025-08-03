#!/usr/bin/env bash

echo "🚀 Запуск полного анализа по индексам..."
echo "=========================================="

# Сборка проекта
echo "📦 Сборка проекта..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Ошибка сборки проекта"
    exit 1
fi
echo "✅ Сборка завершена"

# Получение списка акций
echo "📊 Получение списка акций..."
node dist/get_s_n_p.js
if [ $? -ne 0 ]; then
    echo "❌ Ошибка получения списка акций"
    exit 1
fi
echo "✅ Список акций получен"

# Загрузка данных по всем тикерам
echo "📥 Загрузка данных по всем тикерам..."
echo "📝 Проверка даты последнего обновления цен..."
node dist/fetch_prices.js
if [ $? -ne 0 ]; then
    echo "❌ Ошибка загрузки данных"
    exit 1
fi
echo "✅ Данные загружены"

# Анализ пар по индексам
echo "🔍 Анализ пар по индексам..."
node dist/index_pairs_analysis.js
if [ $? -ne 0 ]; then
    echo "❌ Ошибка анализа пар по индексам"
    exit 1
fi
echo "✅ Анализ пар по индексам завершен"

# Анализ портфеля Марковица для каждого индекса
echo "📈 Анализ портфеля Марковица для каждого индекса..."
node dist/index_portfolio_analysis.js
if [ $? -ne 0 ]; then
    echo "❌ Ошибка анализа портфелей по индексам"
    exit 1
fi
echo "✅ Анализ портфелей по индексам завершен"

# Общий анализ портфеля Марковица
echo "📈 Общий анализ портфеля Марковица..."
node dist/markowitz_portfolio.js
if [ $? -ne 0 ]; then
    echo "❌ Ошибка анализа портфеля"
    exit 1
fi
echo "✅ Анализ портфеля завершен"

# Проверяем наличие инфографик по индексам
echo "🎨 Проверка созданных инфографик по индексам..."

INFOGRAFICS_DIR="infographics"
if [ -d "$INFOGRAFICS_DIR" ]; then
    echo "📊 Найдены инфографики по индексам:"
    ls -la "$INFOGRAFICS_DIR"/*.png 2>/dev/null || echo "   Инфографики по индексам не найдены"
fi

# Отправка результатов в Telegram
echo "📱 Отправка результатов в Telegram..."
node dist/telegram_sender.js
if [ $? -ne 0 ]; then
    echo "❌ Ошибка отправки в Telegram"
    exit 1
fi
echo "✅ Результаты отправлены в Telegram"

echo ""
echo "🎉 Полный анализ завершен успешно!"
echo "=========================================="
echo "📁 Результаты сохранены в:"
echo "   - stats/sp500/ (отчеты S&P500)"
echo "   - stats/nasdaq/ (отчеты NASDAQ)"
echo "   - stats/imoex/ (отчеты IMOEX)"
echo "   - stats/rucbitr/ (отчеты RUCBITR)"
echo "   - stats/rgbi/ (отчеты RGBI)"
echo "   - infographics/sp500/ (инфографики S&P500)"
echo "   - infographics/nasdaq/ (инфографики NASDAQ)"
echo "   - infographics/imoex/ (инфографики IMOEX)"
echo "   - infographics/rucbitr/ (инфографики RUCBITR)"
echo "   - infographics/rgbi/ (инфографики RGBI)"
echo "   - stats/summary.json (сводный отчет)"
echo ""
echo "📊 Проанализированные индексы:"
echo "   🇺🇸 S&P500 - американские акции"
echo "   📈 NASDAQ - технологические акции"
echo "   🇷🇺 IMOEX - российские акции"
echo "   🏢 RUCBITR - российские корпоративные облигации"
echo "   📈 RGBI - российские облигации"
echo ""
echo "✅ Все этапы выполнены успешно!"
