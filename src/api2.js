const axios = require('axios');

const URL = {
  accounts: '/tinkoff.public.invest.api.contract.v1.UsersService/GetAccounts',
  orders: '/tinkoff.public.invest.api.contract.v1.OrdersService/GetOrders',
  portfolio: '/tinkoff.public.invest.api.contract.v1.OperationsService/GetPortfolio',
  positions: '/tinkoff.public.invest.api.contract.v1.OperationsService/GetPositions',
  operations: '/tinkoff.public.invest.api.contract.v1.OperationsService/GetOperations',
  candlesGet: '/tinkoff.public.invest.api.contract.v1.MarketDataService/GetCandles',
  // searchOne: '/tinkoff.public.invest.api.contract.v1.InstrumentsService/GetInstrumentBy',
  cancelOrder: '/tinkoff.public.invest.api.contract.v1.OrdersService/CancelOrder',
  limitOrder: '/tinkoff.public.invest.api.contract.v1.OrdersService/PostOrder',
  lastPrice: '/tinkoff.public.invest.api.contract.v1.MarketDataService/GetLastPrices',
  instrument: '/tinkoff.public.invest.api.contract.v1.InstrumentsService/GetInstrumentBy',
};

const OPERATION_TYPE_V1_V2 = {
  OPERATION_TYPE_BUY: 'Buy',
  OPERATION_TYPE_SELL: 'Sell',
  OPERATION_TYPE_BROKER_FEE: 'BrokerCommission',
};

const OPERATION_STATUS_V1_V2 = {
  OPERATION_STATE_EXECUTED: 'Done',
  OPERATION_STATE_CANCELED: 'Decline'
};

const instrumentCache = {};

module.exports = class TinkoffInvestAPI2 {

  constructor(token) {
    this.token = token;
    this.accountId = null; // 2007859792

    this.baseURL = 'https://invest-public-api.tinkoff.ru/rest';

    this.headers = {
      Authorization: `Bearer ${this.token}`, 
      'x-app-name': 'demidovsky.robot',
      'Content-Type': 'application/json',
      'accept': 'application/json' 
    };

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: this.headers
    });
  }

  async init() {
    if (this.accountId) return;
    const accounts = await this.accounts();
    const currentAccount = accounts.filter(item => item.accessLevel !== 'ACCOUNT_ACCESS_LEVEL_NO_ACCESS');
    this.accountId = currentAccount[0].id;
  }

  async accounts() {
    try {
      const response = await axios.request({
        url: `${this.baseURL}${URL.accounts}`,
        method: 'post',
        headers: this.headers,
        data: {}
      });
      console.log(response.data);
      return response.data.accounts;
    } catch (error) {
      console.error(error.response?.data?.message);
      return [];
    }
  }

  async orders() {
    try {
      const response = await axios.request({
        url: `${this.baseURL}${URL.orders}`,
        method: 'post',
        data: { accountId: this.accountId },
        headers: this.headers
      });
      console.log(response.data);
      return response.data.orders;
    } catch (error) {
      console.error(error.response?.data?.message);
      return [];
    }
  }

  async portfolio() {
    try {
      const response = await axios.request({
        url: `${this.baseURL}${URL.portfolio}`,
        method: 'post',
        data: { accountId: this.accountId },
        headers: this.headers
      });
      console.log(response.data);
      for (let i=0; i<response.data.positions.length; i++) {
        const figi = response.data.positions[i].figi;
        if (!instrumentCache[figi]) {
          instrumentCache[figi] = await this.instrument(figi);
        }
        const instr = instrumentCache[figi];
        response.data.positions[i].name = instr.name;
        response.data.positions[i].ticker = instr.ticker;
        response.data.positions[i].balance = parseInt(response.data.positions[i].quantity?.units);
        response.data.positions[i].lots = parseInt(response.data.positions[i].quantityLots?.units);
      }
      return response.data;
    } catch (error) {
      console.error(error.response?.data?.message);
      return [];
    }
  }

  async instrument(figi) {
    try {
      const response = await axios.request({
        url: `${this.baseURL}${URL.instrument}`,
        method: 'post',
        data: { idType: 'INSTRUMENT_ID_TYPE_FIGI', id: figi },
        headers: this.headers
      });
      console.log(response.data.instrument);
      return response.data.instrument;
    } catch (error) {
      console.error(error.response?.data?.message);
      return {};
    }
  }

  async positions() {
    try {
      const response = await axios.request({
        url: `${this.baseURL}${URL.positions}`,
        method: 'post',
        data: { accountId: this.accountId },
        headers: this.headers
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error(error.response?.data?.message);
      return [];
    }
  }

  async rubusd() {
    try {
      const response = await axios.request({
        url: `${this.baseURL}${URL.lastPrice}`,
        method: 'post',
        data: { figi: ['BBG0013HGFT4'] },
        headers: this.headers
      });
      console.log(response.data);
      const value = parseFloat(`${response.data.lastPrices[0].price.units}.${response.data.lastPrices[0].price.nano}`);
      return value;
    } catch (error) {
      console.error(error.response?.data?.message);
      return 60; // default
    }
  }

  async operations({ from, to, figi }) {
    try {
      const response = await axios.request({
        url: `${this.baseURL}${URL.operations}`,
        method: 'post',
        data: {
          accountId: this.accountId,
          from,
          to,
          figi,
          state: 'OPERATION_STATE_UNSPECIFIED',
        },
        headers: this.headers
      });
      console.log(response.data);
      response.data.operations.forEach(item => {
        item.operationType = OPERATION_TYPE_V1_V2[item.operationType];
        item.status = OPERATION_STATUS_V1_V2[item.state];
        item.price = parseFloat(`${item.price.units}.${item.price.nano}`);
        item.payment = parseFloat(`${item.payment.units}.${Math.abs(item.payment.nano)}`);
      });
      return response.data;
    } catch (error) {
      console.error(error.response?.data?.message);
      return [];
    }
  }

  async candlesGet({ from, to, figi, interval }) {
    try {
      const response = await axios.request({
        url: `${this.baseURL}${URL.candlesGet}`,
        method: 'post',
        data: {
          from: new Date(from),
          to: new Date(to),
          figi,
          interval,
        },
        headers: this.headers
      });
      console.log(response.data);
      const candles = response.data.candles.map(({ close, open, high, low, time }) => ({
        c: parseFloat(`${close.units}.${close.nano}`),
        o: parseFloat(`${open.units}.${open.nano}`),
        h: parseFloat(`${high.units}.${high.nano}`),
        l: parseFloat(`${low.units}.${low.nano}`),
        time
      }));
      return { candles };
    } catch (error) {
      const errText = error.response?.data?.message;
      console.error(errText);
      return { candles: [], error: errText };
    }
  }

  async searchOne({ ticker }) {
    let response;
    try {
      response = await axios.request({
        url: `${this.baseURL}${URL.instrument}`,
        method: 'post',
        data: { idType: 'INSTRUMENT_ID_TYPE_TICKER', classCode: 'SPBXM', id: ticker },
        headers: this.headers
      });
    } catch (error) {
      console.error(error.response?.data?.message);
    }

    try {
      if (!response?.data?.instrument) {
        response = await axios.request({
          url: `${this.baseURL}${URL.instrument}`,
          method: 'post',
          data: { idType: 'INSTRUMENT_ID_TYPE_TICKER', classCode: 'TQBR', id: ticker },
          headers: this.headers
        });
      }

      console.log(response.data.instrument);
      return response.data.instrument;
    } catch (error) {
      console.error(error.response?.data?.message);
      return {};
    }
  }

  async instrumentPortfolio({ figi }) {
    const portfolio = await this.portfolio();
    return portfolio.positions.filter(item => item.figi === figi);
  }

  async cancelOrder({ orderId }) {
    try {
      const response = await axios.request({
        url: `${this.baseURL}${URL.cancelOrder}`,
        method: 'post',
        data: { accountId: this.accountId, orderId },
        headers: this.headers
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error(error.response?.data?.message);
      return {};
    }
  }

  async limitOrder({ operation, figi, lots, price }) {
    const directions = {
      Sell: 'ORDER_DIRECTION_SELL',
      Buy: 'ORDER_DIRECTION_BUY',
    };
    const data = {
      accountId: this.accountId,
      figi,
      quantity: lots,
      price: {
        units: Math.floor(price),
        nano: Math.round(price % 1 * 1000000000)
      },
      direction: directions[operation],
      orderType: 'ORDER_TYPE_LIMIT',
      orderId: Math.random().toString().slice(2)
    };

    try {
      const response = await axios.request({
        url: `${this.baseURL}${URL.limitOrder}`,
        method: 'post',
        data,
        headers: this.headers
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error(error.response?.data?.message);
      return {};
    }
  }
};
