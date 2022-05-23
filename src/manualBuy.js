const assert = require('assert');
const moment = require('moment');
const _ = require('lodash');

const DB = require('./db');
const api = require('./api');
const getAmount = require('./getAmount');

const INTERVALS = ['1min' , '2min' , '3min' , '5min' , '10min' , '15min' , '30min' , 'hour' , 'day' , 'week' , 'month'];
const DAYS = process.env.DAYS || 3;
const IS_DRY_RUN = (process.env.IS_DRY_RUN === 'true');

const getPrice = require('./getPrice');

/* eslint-disable complexity */
module.exports = async function manualBuy (req, res, next) {
  const { ticker } = req.params;
  assert(ticker);

  // const { price } = await DB.getStock(ticker);
  const lots = 1;

	const { figi } = await api.searchOne({ ticker });
	assert(figi);

  const price = await getPrice({ figi });


  if (!IS_DRY_RUN) {
    // if (order) {
    //   console.log('Cancelling order', order);
    //   await DB.Event.deleteEvent({ ticker, order_id: order.orderId });
    //   await api.cancelOrder(order);
    // }

    const { orderId } = await api.limitOrder({
      operation: 'Buy',
      figi,
      lots,
      price,
    });

    await DB.Event.createEvent({
      ticker,
      action: 'buy',
      info: 'manual',
      value: price,
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