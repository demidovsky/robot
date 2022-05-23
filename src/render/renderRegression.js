const moment = require('moment');
const DB = require('./../db');
const api = require('./../api');
const shouldBuyNow = require('./../shouldBuyNow');
const INTERVALS_V1_V2 = require('./../intervals');

/* eslint-disable complexity */
module.exports = async function renderRegression (req, res, next) {
  await api.init();
  const {
    ticker,
    from = moment().subtract(7, 'd').format('YYYY-MM-DD'),
    to = moment().format('YYYY-MM-DD'),
    takeprofit = 1,
    buyonstart = true,
    buyonend = true,
    minsignallength = 1,
    moredeals = false,
  } = req.body;

  const events = [];
  const signals = [];
  let error = null;
  let candles = [];

  if (ticker) {

    const { figi, name } = await api.searchOne({ ticker });
    
    const response = await api.candlesGet({
      from: new Date(from),
      to: new Date(to),
      figi,
      interval: INTERVALS_V1_V2['hour']
    });

    candles = response.candles;
    error = response.error;

    let signallength = 0;

    for (let i = 13; i<candles.length; i++) {
      const regressCandles = candles.slice(0, i);

      // проверка на продажу
      const buyEvent = events.find(item => item.action === 'buy');
      const sellEvent = events.find(item => item.action === 'sell');

      if (buyEvent && !sellEvent &&
        regressCandles[i-1].c / buyEvent.value - 1 >= takeprofit / 100) {

        events.push({
          action: 'sell',
          time: candles[i].time,
          value: regressCandles[i-1].c
        });

        events.push({
          action: 'income',
          time: candles[i].time,
          value: (regressCandles[i-1].c - buyEvent.value).toFixed(2),
          isIncome: true
        });
      }

      // проверка на покупку
      if (shouldBuyNow(regressCandles, moredeals)) {
        // SIGNAL ON
        signals.push(true);
        signallength++;
        if (buyonstart && signallength >= minsignallength && !events.length) {
          events.push({
            action: 'buy',
            time: candles[i].time,
            value: candles[i].c
          });
        }
      } else {
        // SIGNAL OFF
        await DB.Stock.setSignalling({ ticker, signalling: false });
        signals.push(false);
        signallength = 0;
        if (buyonend && signallength >= minsignallength) {
          events.push({
            action: 'buy',
            time: candles[i].time,
            value: candles[i].c
          });
        }
      }
    }

    events.forEach(item => {
      item.dateStr = moment(item.time).tz('Europe/Moscow').format('D MMM YYYY  HH:mm');
    });
  }

  res.render ('regression', {
    ticker,
    from,
    to,
    takeprofit,
    moredeals,
    buyonstart,
    buyonend,
    minsignallength,
    events,
    hasEvents: events.length,
    signals,
    chartHalfyear: moment().subtract(6, 'month').format('YYYY-MM-DD'),
    chartMonth: moment().subtract(2, 'month').format('YYYY-MM-DD'),
    chartToday: moment().subtract(23, 'h').format('YYYY-MM-DDTHH:00'),
    error,
  });

};
