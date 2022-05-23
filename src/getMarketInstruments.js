// const moment = require('moment');
const api = require('./api');
const delay = require('./delay');
const getPrice = require('./getPrice');
const DB = require('./db');

const DELAY = process.env.DELAY || 1;
const TICKERS = process.env.TICKERS;

module.exports = async function getMarketInstruments (isLog = true, positions) {
  let marketInstruments = [];

  const stocks = await DB.Stock.getStocks();
  let tickers = [];
  if (TICKERS) {
    tickers = TICKERS.split(',');
  } else {
    if (positions) {
      tickers = positions.filter(item => item.instrumentType === 'Stock').map(item => item.ticker);
    } else {
      tickers = Object.keys(stocks);
    }
  }

  for (const ticker of tickers) {
    let instr;
    if (isLog || process.env.NODE_ENV === 'development') console.log(`Load ${ticker}`);

    try {
      instr = await api.searchOne({ ticker });
      if (instr) {
        instr.lots = await getPortfolio(instr);
        const price = await getPrice(instr);
        if (!price) console.error(`No price: ${ticker}`);
        instr.price = price;
        const title = instr.name;
        marketInstruments.push(instr);
        DB.Stock.setStockPrice({ ticker, title, price });
      }
    } catch (err) {
      console.log(err);
    }

    await delay(DELAY);
  }
  // console.log('Loaded market instruments:', marketInstruments.length);

  const alreadyGot = marketInstruments.filter(i => !!i.lots).sort((a,b) => a.price < b.price ? 1 : -1);
  // console.log('Already got:', alreadyGot.map(i => i.ticker).join(', '));

  const notYet = marketInstruments.filter(i => !i.lots).sort((a,b) => a.price < b.price ? 1 : -1);
  // console.log('Not yet:', notYet.map(i => i.ticker).join(', '));

  marketInstruments = alreadyGot.concat(notYet);
  console.log(marketInstruments.map(item => `${item.ticker} ${item.price}`));

  return marketInstruments;
};





async function getPortfolio ({ figi }) {
  const portfolio = await api.instrumentPortfolio({ figi });

  return portfolio ? portfolio.lots : 0;
}
