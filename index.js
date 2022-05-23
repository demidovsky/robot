const assert = require('assert');
require('dotenv').config();

assert(process.env.PORT);
assert(process.env.NODE_ENV);
assert(process.env.IS_DRY_RUN);
assert(process.env.CHECK_ON_START);
// assert(process.env.BASE_URL);
assert(process.env.TOKEN);
assert(process.env.DELAY);
assert(process.env.DB_HOST);
assert(process.env.DB_PORT);
assert(process.env.POSTGRES_USER);
assert(process.env.POSTGRES_DB);
assert(process.env.POSTGRES_PASSWORD);
// assert(process.env.SENTRY_DSN);
assert(process.env.HTTP_USER);
assert(process.env.HTTP_PASS);

console.log('NODE_ENV', process.env.NODE_ENV);
console.log('IS_DRY_RUN', process.env.IS_DRY_RUN);

const express = require('express');
const mustacheExpress = require('mustache-express');
const basicAuth = require('express-basic-auth');
const cron = require('node-cron');

const DB = require('./src/db');

const renderChart = require('./src/render/renderChart');
const renderStock = require('./src/render/renderStock');
const renderPortfolio = require('./src/render/renderPortfolio');
const renderSettings = require('./src/render/renderSettings');
const renderWatchlist = require('./src/render/renderWatchlist');
const renderEvents = require('./src/render/renderEvents');
const renderRegression = require('./src/render/renderRegression');
const renderStats = require('./src/render/renderStats');

const checkStock = require('./src/checkStock');
const setStockTarget = require('./src/setStockTarget');
const setStockParams = require('./src/setStockParams');
const updateSettings = require('./src/updateSettings');
const updateStockSettings = require('./src/updateStockSettings');
const manualBuy = require('./src/manualBuy');
const manualSell = require('./src/manualSell');
const getTimeline = require('./src/getTimeline');


const PORT = process.env.PORT || 7777;

function wrap (fn) {
  return async (req, res, next) => { try { await fn(req, res, next); } catch (err) { next(err); } };
}

function wrapParams (fn) {
  return async function(req, res, next) {
    try {
      const result = await fn(req.params, req.query);
      res.send(result);
    } catch (err) {
      next(err);
    }
  };
}

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'mustache');
app.engine('mustache', mustacheExpress());

app.use(basicAuth({ challenge: true, realm: 'fintech', users: { [process.env.HTTP_USER]: process.env.HTTP_PASS } }));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use('/ui/settings', wrap(renderSettings));
app.use('/ui/watchlist', wrap(renderWatchlist));
app.use('/ui/events', wrap(renderEvents));
app.use('/ui/regression', wrap(renderRegression));
app.use('/ui/stats', wrap(renderStats));
app.use('/ui/:ticker', wrap(renderStock));
app.use('/ui', wrap(renderPortfolio));
app.use('/chart', wrap(renderChart));

app.post('/stocksettings/', wrap(updateStockSettings));
app.post('/settings', wrap(updateSettings));
app.post('/stock/on/:ticker', wrapParams(async (params, query) => await DB.Stock.enable(params.ticker)));
app.post('/stock/off/:ticker', wrapParams(async (params, query) => await DB.Stock.disable(params.ticker)));
app.post('/stock/buy/:ticker', wrap(manualBuy));
app.post('/stock/sell/:ticker', wrap(manualSell));
app.get('/stock/timeline/:ticker', wrap(getTimeline));
app.get('/stock/:ticker', wrap(setStockParams));
app.get('/stock/:ticker/:amount', wrap(setStockTarget));

app.listen(PORT, function() {
  console.log(`Server started: http://localhost:${PORT}/ui`);
});

cron.schedule('0 4-20 * * 1-5', checkStock);

if (process.env.CHECK_ON_START === 'true') checkStock();
