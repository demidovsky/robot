const moment = require('moment');
const chalk = require('chalk');

const Sentry = require('./Sentry');
const api = require('./api');
const DB = require('./db');
const getMarketInstruments = require('./getMarketInstruments');
const delay = require('./delay');
const BUY = require('./buy');
const SELL = require('./sell');
const shouldBuyNow = require('./shouldBuyNow');
const syncDeclined = require('./syncDeclined');
const getCandles = require('./getCandles');


const DELAY = process.env.DELAY || 1;

const IS_DRY_RUN = (process.env.IS_DRY_RUN === 'true');
const DEFAULT_COOLDOWN_DAYS = process.env.DEFAULT_COOLDOWN_DAYS || 5;
const SCHEDULED_HOUR_FROM = 7; // 10 msk
const SIGNAL = { START: false, END: true };

/* eslint-disable complexity */
module.exports = async function checkStock () {
  await api.init();

  console.log(`------- ${moment().format('DD MMMM, dddd, HH:mm')} -------`);

  if (!IS_DRY_RUN && ['Sunday', 'Saturday'].includes(moment().format('dddd'))) {
    console.log('Skip weekend, take some rest!');
    return;
  }

  const orders = await api.orders();
  const { positions } = await api.portfolio();
  const stocks = await DB.Stock.getStocks();
  const globalSettings = await DB.Setting.getAllSettings();

  // V1
  /* const usd = positions.find(({ ticker }) => ticker === 'USD000UTSTOM');
  const rubusd = usd.averagePositionPrice.value;
  let freeUsd = usd.balance; */

  // V2
  const rubusd = await api.rubusd();
  let freeUsd = parseInt((await api.positions()).money.find(item => item.currency === 'usd').units);

  let dealsToday = await DB.Event.countBuys();
  const positionsAmount = positions.length; // - 2; // EUR+USD // V1

  const marketInstruments = await getMarketInstruments(false, null);

  for (const instr of marketInstruments) {
    const { figi, name, ticker, price, currency } = instr;
    const title = `${ticker} ${name}`;

    try {
      const settings = stocks[ticker] || {};
      const portfolio = positions.find(item => item.figi === figi);
      const order = orders.find(item => item.figi === figi);

      const operations = await getOperations(figi, settings);
      await syncDeclined({ ticker, operations });

      const candles = await getCandles(figi, title);
      if (!candles) continue;

      const data = {
        ticker,
        figi,
        order,
        portfolio,
        operations,
        candles,
        title,
        freeUsd,
        stocks,
        settings,
        currentPrice: price,
        dealsToday,
        positionsAmount,
        globalSettings,
        rubusd,
        currency,
      };

      await SELL(data);

      if (isOutdated(candles, title)) continue;

      if (portfolio &&
          (settings.scheduledbuy || globalSettings.scheduledbuy) /*&&
          moment().utc().hour() >= SCHEDULED_HOUR_FROM*/) {
        if (await BUY(data, SIGNAL.START, true)) {
          // dealsToday++;
          freeUsd -= price;
        }
      }

      if (shouldBuyNow(candles, settings.moredeals || globalSettings.moredeals)) {
        // SIGNAL ON
        await DB.Stock.setSignalling({ ticker, signalling: true });
        if (globalSettings.buyonstart && settings.signallength >=
          (typeof globalSettings.minsignallength !== 'undefined' ? globalSettings.minsignallength : 2)
        ) {
          if (await BUY(data, SIGNAL.START, false)) {
            dealsToday++;
            // positionsAmount++; // TODO
            freeUsd -= price;
          }
        }
      } else {
        // SIGNAL OFF
        await DB.Stock.setSignalling({ ticker, signalling: false });
        if (settings.signalling && settings.signallength >= 2 && (globalSettings.buyonend)) {
          if (await BUY(data, SIGNAL.END, false)) {
            dealsToday++;
            freeUsd -= price;
          }
        }
      }
    } catch (err) {
      console.error(`Error at ${title}`, err);
      Sentry.captureException(err);
    }
    await delay(DELAY);
  }

  console.log('------- finished -------');
};


async function getOperations(figi, settings) {
  const { buycooldown, sellcooldown } = settings;
  const days = Math.max(buycooldown, sellcooldown) || DEFAULT_COOLDOWN_DAYS;

  const { operations } = await api.operations({
    from: (moment().subtract(days, 'd'))/*.startOf('day')*/.toISOString(),
    to: moment().toISOString(),
    figi,
  });

  return operations;
}


function isOutdated(candles, title) {
  const lastCandleTime = candles.slice(-1)[0].time;
  if (moment(lastCandleTime).isBefore(moment().subtract(4,'h'))) {
    console.log(chalk.yellow(`Skip ${title} - outdated candles (${lastCandleTime})`));
    return true;
  } else {
    return false;
  }
}