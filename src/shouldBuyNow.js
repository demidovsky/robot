const { ma, dma, ema, sma, wma } = require('moving-averages');
const MAcondition = require('./MAcondition');

const SLOW = process.env.SLOW || 200;
const FAST = process.env.FAST || 40;

module.exports = function shouldBuyNow (candles, isMoreDeals) {
  const maSlow = ma(candles.map(item => item.c), SLOW);
  const maFast = ma(candles.map(item => item.c), FAST);

  const maSlowLast = maSlow.slice(-1)[0];
  const maFastLast = maFast.slice(-1)[0];

  // console.log(maSlowLast, maFastLast, maFastLast/maSlowLast);
  // console.log('buy?', MAcondition(maFastLast, maSlowLast));

  return MAcondition(maFastLast, maSlowLast, isMoreDeals);
};