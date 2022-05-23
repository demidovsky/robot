const DB = require('./../db');
const api = require('./../api');
const getValue = require('./../getValue');


/* eslint-disable complexity */
module.exports = async function renderPortfolio (req, res, next) {
  await api.init();
  try {
    let { positions } = await api.portfolio();
    // V1
    /* const usd = positions.find(({ ticker }) => ticker === 'USD000UTSTOM');
    const rubusd = usd.averagePositionPrice.value;
    const cash = usd.balance; */

    // V2
    const rubusd = await api.rubusd();
    const cash = parseInt((await api.positions()).money.find(item => item.currency === 'usd').units);

    positions = positions
      // .filter(({ instrumentType }) => instrumentType === 'Stock')
      .filter(({ instrumentType }) => instrumentType !== 'currency')
      .sort((a,b) => b.percent - a.percent);

    // V1 to V2
    positions.forEach(item => {
      item.balance = parseInt(item.quantity.units);
      item.lots = parseInt(item.quantityLots.units);
    });

    const portfolioSize = positions.reduce((sum, item) =>
      sum + getValue(item.averagePositionPrice, rubusd) *  item.lots, 0).toFixed(2);
      // item.averagePositionPrice ? sum + item.averagePositionPrice.value * item.lots : sum, 0).toFixed(2);

    let stocks = Object.values(await DB.Stock.getStocks('signallength'));

    stocks.forEach(item => {
      if (item.signalling) {
        item.signalBars = (new Array(item.signallength)).fill('•').join('');
      }
    });

    positions.forEach(item => {
      item.expectedYield.currency = item.currentPrice.currency; // V2
      item.profit = getValue(item.expectedYield, rubusd);
      item.isProfit = item.profit > 0;
      item.stockSize = getValue(item.averagePositionPrice, rubusd) * item.balance;
      
      item.percent = (item.profit / item.stockSize * 100).toFixed(2);
      item.partOf = Math.min(Math.round(item.stockSize / portfolioSize * 100), 20);
      item.partOfBars = (new Array(item.partOf)).fill('|').join('');

      const stock = stocks.find(({ ticker }) => ticker === item.ticker) || {};
      item.signalBars = stock.signalling ? (new Array(stock.signallength)).fill('•').join('') : null;
      item.rsi = (stock.rsi >= 70 || stock.rsi <= 30) ? stock.rsi : null;
      item.rsiColor = stock.rsi >= 70 ? 'lime' : (stock.rsi <= 30 ? '#f33' : 'white');

      item.settings = stock;
    });

    positions = positions
      .sort((a,b) => b.percent - a.percent);

    positions.forEach((item, index) => {
      item.index = index + 1;
    });

    // remove duplicates
    stocks = stocks.filter(({ ticker, signalling }) =>
      !positions.find(item => item.ticker === ticker) && signalling
    );

    stocks.forEach(item => {
      item.doNotWant = item.amount === 0;
      item.rsi = (item.rsi >= 70 || item.rsi <= 30) ? item.rsi : null;
      item.rsiColor = item.rsi >= 70 ? 'lime' : (item.rsi <= 30 ? '#f33' : 'white');
    });

    const events = await DB.Event.getEvents();
    const errors = await DB.Errr.getErrors();
    const eventsLatest = events.concat(errors)
      .map(item => {
        if (item.action === 'sell') item.isIncome = true;
        if (item.deletedAt) item.isDeclined = true;
        return item;
      })
      .sort((a,b) => b.createdAt - a.createdAt);
    const moreEvents = 0;// Math.max(0, events.length - 10);

    const profit = events.reduce((sum, { action, value }) => sum + (action === 'sell' ? value : 0), 0);
    const possibleProfit = positions
      .filter(({ isProfit }) => isProfit)
      .reduce((sum, item) => sum + item.profit, 0);

    const dealsToday = await DB.Event.countBuys();

    res.render ('portfolio', {
      positions,
      stocks,
      events: eventsLatest,
      moreEvents,
      cash: Math.round(cash), 
      total: Math.round(parseFloat(portfolioSize) + parseFloat(cash)),
      profit: profit ? profit.toFixed(2) : 0,
      possibleProfit: possibleProfit ? possibleProfit.toFixed(2) : 0,
      dealsToday,
    });

  } catch(err) {
    console.error(err);
    next(err.message);
  }

};
