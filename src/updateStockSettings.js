const assert = require('assert');
const DB = require('./db');

module.exports = async function updateSettings (req, res, next) {
  const params = {};
  const ticker = req.body.ticker;
  assert.match(ticker, /[A-Z0-9@]/);

  for (const key in req.body) {
  	if (key === 'ticker') continue;

	// auto
  	if (key.match(/_auto$/)) {
		if (req.body[key] === 'on') {
			const targetKey = key.replace('_auto', '');
			params[targetKey] = null;
		}
		continue;
	}

	let value = req.body[key];
	if (value === 'on') value = true;
	if (value === 'off') value = key === 'buyonstart' ? false : null;
	params[key] = JSON.parse(value);
  }

  const result = await DB.Stock.setStockParams(ticker, params);

  res.send({ body: req.body, params, result });
};
