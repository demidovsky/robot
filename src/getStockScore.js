const DB = require('./db');

module.exports = async function getStockScore (req, res, next) {
  const score = await DB.getScore();

  res.send(score);
};
