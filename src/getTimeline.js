const assert = require('assert');
const moment = require('moment-timezone');
const _ = require('lodash');

const DB = require('./db');
const api = require('./api');

/* eslint-disable complexity */
module.exports = async function getTimeline (req, res, next) {
  await api.init();
  const { ticker } = req.params;
  assert(ticker);

  const { figi } = await api.searchOne({ ticker });
  assert(figi);

  const events = await DB.Event.getEvents(ticker, moment().subtract(1, 'y'));
  events.forEach(item => {
    if (item.action === 'sell') item.isIncome = true;
    if (item.deletedAt) item.isDeclined = true;
  });

  const errors = await DB.Errr.getErrors(ticker, moment().subtract(1, 'y'));

  let { operations } = await api.operations({
    from: (moment().subtract(1, 'y')).toISOString(),
    to: moment().toISOString(),
    figi,
  });

  operations = operations
    .filter(({ operationType, status, state }) => operationType !== 'OPERATION_TYPE_BROKER_FEE' &&
      status !== 'Decline' && state === 'OPERATION_STATE_EXECUTED');

  operations.forEach(item => {
    item.dateStr = moment(item.date).tz('Europe/Moscow').format('D MMM YYYY  HH:mm');
    item.payment = Math.abs(item.payment);
    if (item.status === 'Decline' || item.state !== 'OPERATION_STATE_EXECUTED') item.isDeclined = true;
    if (item.operationType === 'OPERATION_TYPE_SELL') item.isIncome = true;
  });

  let timeline = operations.concat(events).concat(errors).map(item => ({
    dateStr: item.dateStr,
    createdAt: new Date(item.createdAt || item.date),
    action: item.action || item.operationType,
    value: item.value || item.payment || 0,
    info: item.info,
    isSell: item.operationType === 'Sell' || item.action === 'sell' || item.operationType === 'OPERATION_TYPE_SELL',
    isIncome: item.action === 'sell',
  })).sort((a,b) => b.createdAt - a.createdAt);

  timeline = _.uniqBy(timeline, ({ action, value, dateStr }) => `${action.toLowerCase()} ${dateStr} ${value ? value.toFixed(1) : null}`);

  const daysIn = getDaysIn(timeline);

  res.send({
    events,
    operations,
    timeline,
    daysIn
  });
};


function getDaysIn(timeline) {
  const lastSellIndex = timeline.findIndex(({ action }) => action === 'Sell');
  if (!lastSellIndex) return 0;
  const buyingStart = timeline.slice(0, lastSellIndex).filter(({ action }) => action.toLowerCase() === 'buy').pop();
  if (!buyingStart) return 0;

  return moment().diff(moment(buyingStart.createdAt), 'd');

}