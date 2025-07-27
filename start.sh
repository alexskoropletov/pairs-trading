#!/usr/bin/env bash

npm run build && 

node dist/get_s_n_p.js && 
echo 'done' && 

node dist/fetch_prices.js && 
echo 'done' && 

node dist/pairs_trading.js && 
echo 'done'

node dist/markowitz_portfolio.js && 
echo 'done'

node dist/telegram_sender.js && 
echo 'done'
