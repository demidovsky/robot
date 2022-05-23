const assert = require('assert');
const moment = require('moment');
const { ma, dma, ema, sma, wma } = require('moving-averages');
const ta = require('ta.js');
const api = require('./../api');
const DB = require('./../db');
const MAcondition = require('./../MAcondition');
const INTERVALS = ['1min' , '2min' , '3min' , '5min' , '10min' , '15min' , '30min' , 'hour' , 'day' , 'week' , 'month'];
const INTERVALS_V1_V2 = require('./../intervals');
const DAYS = process.env.DAYS || 5;

module.exports = async function renderChart (req, res, next) {
  await api.init();

  // console.log(req.query);
  if (!Object.entries(req.query)) {
    res.sendStatus(400);
    return;
  }

  const {
    from = moment().subtract(DAYS, 'd'),
    to = moment(),
    interval = 'hour',
    slow = 13,
    fast = 5,
    ticker,
    // more
  } = req.query;

  try {
    assert(ticker);
    assert(interval);
    assert(INTERVALS.includes(interval));
    assert(from);
    assert(to);
    assert(new Date(from));
    assert(new Date(to));
    assert(slow);
    assert(fast);
  } catch (err) {
    next(err.message);
    return;
  }

  try {
    const settings = await DB.Stock.getStock(ticker) || {};
    const { figi, name } = await api.searchOne({ ticker });
    const { candles } = await api.candlesGet({
      from: new Date(from),
      to: new Date(to),
      figi,
      interval: INTERVALS_V1_V2[interval]
    });

    let { operations } = await api.operations({
      from: moment(from).toISOString(),
      to: moment(to).toISOString(),
      figi,
    });

    operations = operations
      .filter(({ operationType }) => ['Buy', 'Sell'].includes(operationType))
      .map(item => ({
        datetime: item.date.slice(0,16),
        price: item.price,
        action: item.operationType,
        isDeclined: item.status === 'Decline',
      }));

    // console.log('candles:', candles.length);
    const candlesClose = candles.map(item => item.c);

    const maSlow = ma(candlesClose, 13);
    const maFast = ma(candlesClose, 5);

    const more = settings.moredeals;
    const events = [];
    for (let i=0; i<maSlow.length; i++) {
      if (MAcondition(maFast[i], maSlow[i], !!more)) {
        events.push({ date: candles[i].time, description: 'buy' });
      }
    }


    const maSlowLast = maSlow.slice(-1)[0];
    const maFastLast = maFast.slice(-1)[0];

    let buy = false;
    if (MAcondition(maFastLast, maSlowLast)) {
      buy = true;
    }

    res.render ('anychart', {
      data: JSON.stringify(candles, null, 2),
      slow,
      fast,
      ticker,
      name,
      buy: buy ? 'BUY' : '',
      events: JSON.stringify(events, null, 2),
      operations: JSON.stringify(operations, null, 2),
      settings,
      chartHalfyear: moment().subtract(6, 'month').format('YYYY-MM-DD'),
      chartMonth: moment().subtract(2, 'month').format('YYYY-MM-DD'),
      chartToday: moment().subtract(23, 'h').format('YYYY-MM-DDTHH:00'),
      rsi: (await ta.wrsi(candlesClose)).map(Math.round).join(','),
    });

  } catch(err) {
    console.error(err);
    next(err.message);
  }

};