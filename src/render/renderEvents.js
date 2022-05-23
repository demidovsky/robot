const moment = require('moment-timezone');
const DB = require('./../db');

/* eslint-disable complexity */
module.exports = async function renderEvents (req, res, next) {
  try {
    const { from, till } = req.query;
    const events = await DB.Event.getEvents(null, from, till);
    events.forEach(item => {
      item.dateStr = moment(item.createdAt).tz('Europe/Moscow').format('D MMM YYYY  HH:mm');
      if (item.action === 'sell') item.isIncome = true;
      if (item.action === 'buy') item.action = '<b>buy</b>';
      if (item.deletedAt) item.isDeclined = true;
    });

    const dealsToday = await DB.Event.countBuys();

    res.render ('events', {
      events,
      dealsToday,
      yesterday: moment().subtract(1, 'd').tz('Europe/Moscow').format('YYYY-MM-DD'),
    });
  } catch(err) {
    console.error(err);
    next(err.message);
  }

};
