const DB = require('./db');

module.exports = async function getStockTargets (req, res, next) {
  const stocks = await DB.Stock.getStocks(req.params.sort);

  res.send(stocks);
};
