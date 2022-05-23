const { Sequelize, QueryTypes } = require('sequelize');
const Umzug = require('umzug');
const path = require('path');

const {
  DB_HOST,
  DB_PORT,
  POSTGRES_DB,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
} = process.env;


const DB_CONNECTION = `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DB_HOST}:${DB_PORT}/${POSTGRES_DB}`;
const sequelize = new Sequelize(DB_CONNECTION, { logging: false });

const umzug = new Umzug({
  storage: 'sequelize',
  storageOptions: { sequelize },
  migrations: {
    path: path.join(__dirname, 'migrations'),
    params: [
      sequelize.getQueryInterface()
    ]
  },
  // storage: new Umzug.SequelizeStorage({ sequelize })
});


(async () => {
  await sequelize.sync({ /*force: true*/ });
  // await umzug.down({ to: '2_order_deletedAt' });
  // await umzug.up(); // вкл когда потребуются миграции
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();


const EventTable = require('./event');
const CashTable = require('./cash');
const StockTable = require('./stock');
const SettingTable = require('./setting');
const ErrorTable = require('./error');

const Event = new EventTable(sequelize);
const Cash = new CashTable(sequelize);
const Stock = new StockTable(sequelize);
const Setting = new SettingTable(sequelize);
const Errr = new ErrorTable(sequelize);


const QUERY_SCORE = `
SELECT * FROM (SELECT
stocks.ticker,
stocks.price,
SUM(events.lots) AS deals,
ROUND(SUM(events.value) * 100) / 100 AS total,
ROUND(SUM(events.value) / SUM(events.lots) * 100) / 100 AS average_deal,
ROUND(SUM(events.value) / SUM(events.lots) / stocks.price * 10000) / 100 AS volatility_score,
CEIL(SUM(events.value) / SUM(events.lots) / stocks.price * 100) AS multiplier
FROM events
INNER JOIN stocks ON events.ticker = stocks.ticker
WHERE events."deletedAt" IS NULL AND events.action = 'sell'
GROUP BY stocks.ticker
ORDER BY stocks.ticker) s WHERE deals > 4
`;

const MAX_MULTIPLIED_COST = 500;

/* eslint-disable prefer-const */
async function getScore () {
  const scores = await sequelize.query(QUERY_SCORE, { type: QueryTypes.SELECT });

  const result = {};
  for (const score of scores) {
    let { ticker, multiplier } = score;

    if (score.price * multiplier > MAX_MULTIPLIED_COST) {
      multiplier = Math.round(MAX_MULTIPLIED_COST / score.price);
    }

    result[ticker] = multiplier;
  }

  return result;
}

const STATS = {
  DAILY: `SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS timeseries, SUM ("value") AS total FROM events where action = 'sell' and "deletedAt" is null and "createdAt" > now() - interval '1 month' GROUP BY timeseries ORDER BY timeseries`,
  WEEKLY: `SELECT DATE_PART( 'week', "createdAt" ) as timeseries, round(SUM ("value")) AS total FROM events where action = 'sell' and "deletedAt" is null GROUP BY timeseries ORDER BY timeseries`,
  MONTHLY: `SELECT TO_CHAR( "createdAt", 'yyyy.mm') as timeseries, round(SUM ("value")) AS total FROM events where action = 'sell' and "deletedAt" is null GROUP BY timeseries ORDER BY timeseries`,
  TOP: `SELECT ticker, SUM(VALUE) as "total" FROM events where action = 'sell' and "deletedAt" is null GROUP BY ticker ORDER BY total desc`,
};


async function getStatsDaily () {
  return sequelize.query(STATS.DAILY, { type: QueryTypes.SELECT });
}

async function getStatsWeekly () {
  return sequelize.query(STATS.WEEKLY, { type: QueryTypes.SELECT });
}

async function getStatsMonthly () {
  return sequelize.query(STATS.MONTHLY, { type: QueryTypes.SELECT });
}

async function getStatsTop () {
  return sequelize.query(STATS.TOP, { type: QueryTypes.SELECT });
}


module.exports = {
  Event,
  Cash,
  Stock,
  Setting,
  Errr,

  getScore,
  getStatsDaily,
  getStatsWeekly,
  getStatsMonthly,
  getStatsTop,
};
