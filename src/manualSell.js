const assert = require('assert');
const moment = require('moment');
const _ = require('lodash');

const DB = require('./db');
const api = require('./api');
const getAmount = require('./getAmount');
const getValue = require('./getValue');

const INTERVALS = ['1min' , '2min' , '3min' , '5min' , '10min' , '15min' , '30min' , 'hour' , 'day' , 'week' , 'month'];
const DAYS = process.env.DAYS || 3;
const IS_DRY_RUN = (process.env.IS_DRY_RUN === 'true');

const getPrice = require('./getPrice');

/* eslint-disable complexity */
module.exports = async function manualSell (req, res, next) {
  const { ticker } = req.params;
  assert(ticker);

  // const { price } = await DB.getStock(ticker);

	const { figi } = await api.searchOne({ ticker });
	assert(figi);

  const price = await getPrice({ figi });
  const { positions } = await api.portfolio();
	const position = positions.find(item => item.figi === figi);
  const lots = position.lots;

  const usd = positions.find(pos => pos.ticker === 'USD000UTSTOM');
  const rubusd = usd.averagePositionPrice.value;


  if (!IS_DRY_RUN) {
    // if (order) {
    //   console.log('Cancelling order', order);
    //   await DB.Event.deleteEvent({ ticker, order_id: order.orderId });
    //   await api.cancelOrder(order);
    // }

    const { orderId } = await api.limitOrder({
      operation: 'Sell',
      figi,
      lots,
      price,
    });

    await DB.Event.createEvent({
      ticker,
      action: 'sell',
      info: 'manual',
      value: Number(0.95 * getValue(position.expectedYield, rubusd)).toFixed(2),
      order_id: orderId,
      lots,
    });

    // if (price < AUTOBUY_MAX_PRICE) {
    //   await DB.Stock.schedule(ticker);
    // }

  } else {
    // для отладки
    /*await DB.Event.createEvent({
      ticker,
      action: 'buy',
      value: 0,
      order_id: '???',
      lots,
    });*/
  }

  res.send();
}