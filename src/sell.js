const assert = require('assert');
const chalk = require('chalk');
const ta = require('ta.js');
const api = require('./api');
const DB = require('./db');
const Sentry = require('./Sentry');
const captureError = require('./captureError');
const getValue = require('./getValue');

const DEFAULT_TAKE_PROFIT = 5;
const IS_DRY_RUN = (process.env.IS_DRY_RUN === 'true');

/* eslint-disable complexity */
module.exports = async function sell ({ ticker, figi, order, portfolio, candles, currentPrice, title, settings, globalSettings, rubusd }) {
  if (!portfolio) {
    // console.log(chalk.yellow(`Skip ${title}`));
    return;
  }

  const { averagePositionPrice, balance, expectedYield, lots } = portfolio;

  // V1 extra bug check
  if (!averagePositionPrice || !expectedYield?.units && expectedYield.units !== 0) {
    console.log(chalk.red(`Skip ${title} [position price error]`), portfolio);
    return;
  }

  const total = getValue(averagePositionPrice, rubusd) * balance;
  const percent = Math.round(getValue(expectedYield, rubusd) / total * 10000) / 100;
  const takeprofit = settings.takeprofit || globalSettings.takeprofit || DEFAULT_TAKE_PROFIT;
  assert(takeprofit > 0);

  const rsiAll = (await ta.wrsi(candles.map(item => item.c)));
  const rsi = Math.round(rsiAll[rsiAll.length - 1]);
  await DB.Stock.setStockParams(ticker, { rsi });

  if (rsi >= (globalSettings.rsisellthreshold || 80) && percent > 0) {
    // Вы продоёте рыбов
    const text = `${title} [${percent}%] RSI is overbought: ${rsi}`;
    console.log(chalk.yellow(text));
    await captureError(ticker, text);
  }

  if (percent < takeprofit) {
    console.log(chalk.yellow(`Keeping ${title} [${percent}%]`));
    return;
  } else {
    if (globalSettings.rsisell && rsi < 70) {
      // нет просто показываю
      const text = `Can't sell ${title} [${percent}%]: RSI is ${Math.floor(rsi)}`;
      console.log(chalk.yellow(text));
      await captureError(ticker, text);
      return;
    }
  }


  const price = currentPrice || candles.slice(-1)[0].c;
  assert(price, 'No price specified');

  // V1 extra bug check
  const latestBuyPrice = await DB.Event.getLatestBuyPrice(ticker);
  const priceUSD = getValue({ value: price, currency: averagePositionPrice.currency }, rubusd);
  const comparedPrice = averagePositionPrice.currency === 'RUB' ? price : priceUSD;
  if (comparedPrice < latestBuyPrice) {
    const errorText = `Can't sell ${title}, too cheap [${priceUSD} vs ${latestBuyPrice}]`;
    Sentry.captureMessage(errorText);
    await captureError(ticker, errorText);
    console.log(chalk.red(errorText));
    return;
  }

  const text = 
    `→ Sell ${title} ${Math.max(price, getValue(averagePositionPrice, rubusd))} [${percent}%], gain ${getValue(expectedYield, rubusd)}`;
  console.log(chalk.green(text));

  if (!IS_DRY_RUN) {
    if (order && (order.price !== price)) {
      console.log('Cancelling order', order);
      await DB.Event.deleteEvent({ ticker, order_id: order.orderId });
      await api.cancelOrder(order);
    }

    const limitOrder = await api.limitOrder({
      operation: 'Sell',
      figi,
      lots,
      price,
    });

    const { orderId } = limitOrder;
    if (orderId.substr(0,3) === 'DDK') {
      const errorText = `Can't sell ${title}, order was declined]`;
      await captureError(ticker, errorText);
      console.log(limitOrder);
    } else {
      await DB.Event.createEvent({
        ticker,
        action: 'sell',
        value: Number(0.95 * getValue(expectedYield, rubusd)).toFixed(2),
        order_id: orderId,
        lots,
      });
    }
  } else {
    // для отладки
    /*await DB.Event.createEvent({
      ticker,
      action: 'sell',
      value: expectedYield.value,
      order_id: '???',
      lots,
    });*/
  }
};
