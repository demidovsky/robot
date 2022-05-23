const DB = require('./../db');

module.exports = async function renderChart (req, res, next) {
  try {
    const daily = (await DB.getStatsDaily()).map(item => Object.values(item));
    const weekly = (await DB.getStatsWeekly()).map(item => Object.values(item));
    const monthly = (await DB.getStatsMonthly()).map(item => Object.values(item));

    const top = (await DB.getStatsTop())
      .filter(item => item.total >= 10) // отфильтруем инструменты с низкой прибылью
      .map(item => Object.values(item));

    res.render ('stats', {
      daily: JSON.stringify(daily, null, 2),
      weekly: JSON.stringify(weekly, null, 2),
      monthly: JSON.stringify(monthly, null, 2),
      toptickers: JSON.stringify(top, null, 2),
    });

  } catch(err) {
    console.error(err);
    next(err.message);
  }
};