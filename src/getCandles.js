const moment = require('moment');
const chalk = require('chalk');
const api = require('./api');
const CANDLES_DAYS = process.env.DAYS || 5;
const INTERVALS_V1_V2 = require('./intervals');

module.exports = async function getCandles(figi, title) {
  const { candles } = await api.candlesGet({
    from: moment().subtract(CANDLES_DAYS,'d').toISOString(),
    to: moment().toISOString(),
    figi,
    interval: INTERVALS_V1_V2['hour'],
  });

  if (!candles.length) {
    console.log(chalk.yellow(`Skip ${title} - no candles`));
    return null;
  } else {
    return candles;
  }
};
