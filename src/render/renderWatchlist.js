const DB = require('./../db');
const api = require('./../api');

/* eslint-disable complexity */
module.exports = async function renderWatchlist (req, res, next) {
  try {
    await api.init();
    const { positions } = await api.portfolio();
    let stocks = Object.values(await DB.Stock.getStocks('ticker'));

    stocks.forEach(item => {
      if (item.signalling) {
        item.signalBars = (new Array(item.signallength)).fill('•').join('');
      }
      if (item.amount === 0) {
      	item.doNotWant = true;
      }
      item.roundedPrice = Math.round(item.price / 10) * 10;
    });

    // remove what's already in protfolio
    stocks = stocks
      .filter(({ ticker }) =>
      	!positions.find(item => item.ticker === ticker));

    res.render ('watchlist', {
    	stocks,
    });

  } catch(err) {
    console.error(err);
    next(err.message);
  }

};
