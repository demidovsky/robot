const assert = require('assert');
const DB = require('./db');

module.exports = async function setStockParams (req, res, next) {
  const { ticker } = req.params;
  assert(ticker);

  const {
    takeprofit,
    buyonstart,
    buyonend,
    sellcooldown,
    buycooldown,
    moredeals,
    scheduledbuy,
  } = req.query;

  const settings = {};

  if (takeprofit) settings.takeprofit = takeprofit === 'null' ? null : parseFloat(takeprofit);
  if (buyonstart) settings.buyonstart = buyonstart === 'null' ? false : JSON.parse(buyonstart);
  if (buyonend) settings.buyonend = buyonend === 'null' ? null : JSON.parse(buyonend);
  if (sellcooldown) settings.sellcooldown = sellcooldown === 'null' ? null : parseInt(sellcooldown);
  if (buycooldown) settings.buycooldown = buycooldown === 'null' ? null : parseInt(buycooldown);
  if (moredeals) settings.moredeals = moredeals === 'null' ? null : JSON.parse(moredeals);
  if (scheduledbuy) settings.scheduledbuy = scheduledbuy === 'null' ? null : JSON.parse(scheduledbuy);

  await DB.Stock.setStockParams(ticker, settings);

  const result = await DB.Stock.getStock(ticker);

  res.send(result);
};
