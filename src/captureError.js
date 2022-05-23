const DB = require('./db');
const IS_DRY_RUN = (process.env.IS_DRY_RUN === 'true');

module.exports = async function captureError(ticker, text) {
  if (IS_DRY_RUN) return;

  await DB.Errr.createError({
    ticker,
    info: text
  });
};
