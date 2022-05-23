const chalk = require('chalk');
const ta = require('ta.js');
const api = require('./api');
const DB = require('./db');
const Sentry = require('./Sentry');
const moment = require('moment');
const getAmount = require('./getAmount');
const captureError = require('./captureError');

const IS_DRY_RUN = (process.env.IS_DRY_RUN === 'true');
const DEFAULT_COOLDOWN_HOURS = 24 * (process.env.DEFAULT_COOLDOWN_DAYS || 1);
const MIN_CASH = 1000;
const MAX_DEALS_PER_DAY = 10;
// const AUTOBUY_MAX_PRICE = 100;
const MAX_POSITIONS = 20;


/* eslint-disable complexity */
module.exports = async function buy (
  { ticker, figi, order, portfolio, operations, candles, title, freeUsd, settings, dealsToday, positionsAmount, globalSettings, currency },
  isSignalEnd = false,
  isScheduled = false,
) {
  const priceKey = globalSettings.uselowest ? 'l' : 'c';
  const price = candles.slice(-1)[0][priceKey]; //[isSignalEnd ? 'c' : 'l'];

  const rsiAll = (await ta.wrsi(candles.map(item => item.c)));
  const rsi = Math.round(rsiAll[rsiAll.length - 1]);
  await DB.Stock.setStockParams(ticker, { rsi });

  if (currency !== 'RUB' &&
    !isSignalEnd &&
    !isScheduled &&
    globalSettings.rsibuy && rsi >= (globalSettings.rsibuythreshold || 30)
  ) {
    const text = `Can't buy ${title}: RSI is ${Math.floor(rsi)}`;
    console.log(chalk.yellow(text));
    return;
  }

  // не покупать, если нет в портфеле, а он и так заполнен
  if (positionsAmount > (globalSettings.maxpositions || MAX_POSITIONS) && !portfolio) {
    const text = `← Can't buy ${title} [too many positions]`;
    console.log(chalk.red(text));
    !isScheduled && await captureError(ticker, text);
    return false;
  }

  // не докупать, если недавно уже покупали
  if (operations.find(item =>
    ['Buy'].includes(item.operationType) &&
    moment(item.date).isAfter(moment().subtract(settings.buycooldown || globalSettings.buycooldown || DEFAULT_COOLDOWN_HOURS, 'h')) &&
    item.status === 'Done')
  ) {
    const text = `← Can't buy ${title} [cooldown after buy]`;
    console.log(chalk.red(text));
    !isScheduled && await captureError(ticker, text);
    return false;
  }

  // не докупать, если недавно уже продали
  if (operations.find(item =>
    ['Sell'].includes(item.operationType) &&
    moment(item.date).isAfter(moment().subtract(settings.sellcooldown || globalSettings.sellcooldown || DEFAULT_COOLDOWN_HOURS, 'h')) &&
    item.status === 'Done')) {
    const text = `← Can't buy ${title} [cooldown after sell]`;
    console.log(chalk.red(text));
    !isScheduled && await captureError(ticker, text);
    return false;
  }

  // не покупать, если массовое падение
  if (dealsToday >= (globalSettings.maxdeals || MAX_DEALS_PER_DAY)) {
    const text = `← Can't buy ${title} [too many deals today]`;
    console.log(chalk.red(text));
    !isScheduled && await captureError(ticker, text);
    return false;
  }

  // не докупать, если стремимся избавиться
  if (settings.amount === 0) {
    const text = `← Can't buy ${title} [${portfolio ? 'sell only' : 'do not want'}]`;
    console.log(chalk.red(text));
    !isScheduled && await captureError(ticker, text);
    return false;
  }

  // не докупать, если и так уже много
  if (currency !== 'RUB' && portfolio && portfolio.lots >= getAmount(price, settings.amount)) {
    const text = `← Can't buy ${title} [got ${portfolio.lots} max]`;
    console.log(chalk.red(text));
    !isScheduled && await captureError(ticker, text);
    return false;
  }

  // не докупать, если мало денег
  if (currency !== 'RUB' && freeUsd < (globalSettings.mincash || MIN_CASH)) {
    const text = `← Can't buy ${title} [min cash reached]`;
    console.log(chalk.red(text));
    !isScheduled && await captureError(ticker, text);
    return false;
  }

  // не докупать, если цена всё ещё высока
  if (settings.maxprice && price > settings.maxprice) {
    const text = `← Can't buy ${title} [too high, waiting for ${settings.maxprice}]`;
    console.log(chalk.red(text));
    !isScheduled && await captureError(ticker, text);
    return false;
  }

  const lots = 1;
  const text = `← Buy ${title} ${price} x ${lots}`;
  console.log(chalk.green(text));

  if (!IS_DRY_RUN) {
    if (order) {
      console.log('Cancelling order', order);
      await DB.Event.deleteEvent({ ticker, order_id: order.orderId });
      await api.cancelOrder(order);
    }

    const { orderId } = await api.limitOrder({
      operation: 'Buy',
      figi,
      lots,
      price,
    });

    await DB.Event.createEvent({
      ticker,
      action: 'buy',
      value: price,
      order_id: orderId,
      lots,
    });

    // if (price < AUTOBUY_MAX_PRICE) {
    //   await DB.Stock.schedule(ticker);
    // }

  } else {
    // для отладки
    /*await DB.Event.createEvent({
      ticker,
      action: 'buy'
      value: 0,
      order_id: '???',
      lots,
    });*/
  }

  return true;
};
