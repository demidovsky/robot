const Sentry = require('@sentry/node');

if (process.env.NODE_ENV !== 'development' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
}

module.exports = Sentry;
