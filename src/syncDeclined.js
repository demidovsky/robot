const chalk = require('chalk');
const DB = require('./db');
const Sentry = require('./Sentry');

module.exports = async function syncDeclined ({ ticker, operations }) {
  const declinedIds = operations
    .filter(({ status }) => status === 'Decline')
    .map(({ id }) => id);

  for (var order_id of declinedIds) {
    if (await DB.Event.findEvent({ ticker, order_id })) {
      await DB.Event.deleteEvent({ ticker, order_id });
      const text = `Sync declined ${ticker}`;
      console.log(chalk.red(text));
      Sentry.captureMessage(text);
    }
  }
};
