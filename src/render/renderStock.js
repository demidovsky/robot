const assert = require('assert');
const moment = require('moment');

const DB = require('./../db');
const api = require('./../api');
const getAmount = require('./../getAmount');
const getValue = require('./../getValue');


/* eslint-disable complexity */
module.exports = async function renderStock (req, res, next) {
  await api.init();
  const { ticker } = req.params;
  assert(ticker);

  try {
    const settings = await DB.Stock.getStock(ticker) || {};
    // if (!settings) throw new Error('404');

    const globalSettings = await DB.Setting.getAllSettings();

    const defaultSettings = {
      amount: getAmount(settings.price, settings.amount),
      takeprofit: settings.takeprofit || globalSettings.takeprofit,
      buyonstart: globalSettings.buyonstart,
      buyonend: globalSettings.buyonend,
      sellcooldown: settings.sellcooldown || globalSettings.sellcooldown || 42,
      buycooldown: settings.buycooldown || globalSettings.buycooldown || 42,
      moredeals: settings.moredeals || globalSettings.moredeals || false,
      scheduledbuy: settings.scheduledbuy || globalSettings.scheduledbuy || false,
    };

    const { figi, /*name*/ } = await api.searchOne({ ticker });

    const { positions } = await api.portfolio();
    // const usd = positions.find(pos => pos.ticker === 'USD000UTSTOM');
    // const rubusd = usd.averagePositionPrice.value;
    const rubusd = await api.rubusd();


    let position = positions.find(item => item.ticker === ticker);

    if (!position) {
      position = {
        lots: 0,
        balance: 0,
        averagePositionPrice: { value: 0 },
        expectedYield: { value: 0 },
        name: settings.name || settings.ticker,
        ticker: settings.ticker || ticker,
      };
    }

    const portfolioSize = positions.reduce((sum, item) =>
      sum + getValue(item.averagePositionPrice, rubusd) * item.balance, 0);

    // V2
    position.balance = parseInt(position.quantity?.units) || 0;
    position.lots = parseInt(position.quantityLots?.units) || 0;
    position.expectedYield.currency = position.currentPrice?.currency;

    const { balance, lots, averagePositionPrice, expectedYield } = position;
    const stockSize = getValue(averagePositionPrice, rubusd) * balance;

    const takeprofit = settings.takeprofit || defaultSettings.takeprofit;
    const buycooldown = settings.buycooldown || defaultSettings.buycooldown;
    const sellcooldown = settings.sellcooldown || defaultSettings.sellcooldown;
    const amount = settings.amount || defaultSettings.amount || lots;

    res.render ('stock', {
      defaultSettings,
      settings,
      ...settings,
      ...position,
      takeprofit,
      buycooldown,
      sellcooldown,
      amount,
      doNotWant: amount === 0,
      amountPercent: Math.round(lots / amount * 100),
      amountAuto: settings.amount === null,
      profitValue: getValue(expectedYield, rubusd) || 0,
      profitPercent: stockSize ? (getValue(expectedYield, rubusd) / stockSize * 100).toFixed(2) : 0,
      maxProfitValue: stockSize ? (getValue(averagePositionPrice, rubusd) * balance * takeprofit / 100).toFixed(2) : 0,
      averagePrice: (getValue(averagePositionPrice, rubusd) * balance / lots || settings.price)?.toFixed(2),
      currentPrice: settings.price,
      stockSize: stockSize.toFixed(2),
      partOf: Math.round(stockSize / portfolioSize * 100),
      color: getValue(expectedYield, rubusd) > 0 ? 'lime' : 'orange',
      /*events,
      operations,
      timeline,
      daysIn,*/
      signallength: settings.signallength ? (new Array(settings.signallength)).fill('•').join('') : '',
      chartHalfyear: moment().subtract(6, 'month').format('YYYY-MM-DD'),
      chartMonth: moment().subtract(2, 'month').format('YYYY-MM-DD'),
      chartToday: moment().subtract(23, 'h').format('YYYY-MM-DDTHH:00'),
      rsiColor: (settings.rsi >= 70 || settings.rsi <= 30) ? 'lime' : 'white',
      currencySign: getCurrencySign(averagePositionPrice),
    });

  } catch(err) {
    console.error(err);
    next(err.message);
  }

};

function getCurrencySign(price) {
  if (!price) return '';
  switch (price.currency) {
    case 'RUB': return '₽';
    case 'USD': return '$';
    case 'EUR': return '€';
    default: return '';
  }
}