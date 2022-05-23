const moment = require('moment');
const api = require('./api');
const INTERVALS_V1_V2 = require('./intervals');

module.exports = async function getPrice ({ figi }) {
  const { candles } = await api.candlesGet({
    from: moment().subtract(4,'d').toISOString(),
    to: moment().toISOString(),
    figi,
    interval: INTERVALS_V1_V2['day'],
  });

  const lastCandle = candles[candles.length - 1];

  if (lastCandle) {
    return lastCandle.c;
  } else {
    console.error(`No candles: ${figi}`);
    return 0;
  }
};