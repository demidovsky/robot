const assert = require('assert');
const DB = require('./db');

module.exports = async function setStockTarget (req, res, next) {
  const { ticker, amount } = req.params;
  assert(ticker);
  // assert(amount);

  await DB.Stock.setStockAmount({ ticker, amount: amount === 'auto' ? null : amount });
  const result = await DB.Stock.getStock(ticker);

  res.send(result);
};
