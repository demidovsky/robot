// V1
/*const OpenAPI = require('@tinkoff/invest-openapi-js-sdk');
const socketURL = 'wss://api-invest.tinkoff.ru/openapi/md/v1/md-openapi/ws';
// const apiURL = 'https://api-invest.tinkoff.ru/openapi';
// const sandboxApiURL = 'https://api-invest.tinkoff.ru/openapi/sandbox/';

let api;
try {
  api = new OpenAPI({ apiURL: process.env.BASE_URL, secretToken: process.env.TOKEN, socketURL });
} catch (err) {
  console.error(err);
  console.log('--- Cannot start! ---');
}*/

// V2
const api = new (require('./api2'))(process.env.TOKEN);

module.exports = api;