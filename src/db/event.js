const assert = require('assert');
const moment = require('moment-timezone');
const { DataTypes, Op } = require('sequelize');

const IS_DRY_RUN = (process.env.IS_DRY_RUN === 'true');


module.exports = class EventTable {
  constructor (sequelize) {
    assert(sequelize);
    this.model = sequelize.define('Event', {
      ticker: { type: DataTypes.STRING, allowNull: false },
      action: { type: DataTypes.ENUM('buy', 'sell', 'error'), allowNull: false },
      value: { type: DataTypes.FLOAT, allowNull: false },
      order_id: { type: DataTypes.STRING, allowNull: false },
      lots: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      info: { type: DataTypes.STRING, allowNull: true },
    }, {
      modelName: 'event',
      tableName: 'events',
      timestamps: true,
      updatedAt: false,
      paranoid: true,
    });
  }

  async createEvent (data) {
    await this.model.create({
      ...data,
      ticker: (IS_DRY_RUN ? `DRY_${data.ticker}` : data.ticker),
    });
  }

  async findEvent ({ ticker, order_id }) {
    assert(ticker);
    assert(order_id);
    return this.model.findOne({
      where: { ticker, order_id }
    });
  }

  async deleteEvent ({ ticker, order_id }) {
    assert(ticker);
    assert(order_id);
    await this.model.destroy({
      where: { ticker, order_id }
    });
  }

  async getLatestBuyPrice (ticker) {
    assert(ticker);
    const latestEvent = await this.model.findOne({
      where: { ticker, action: 'buy' },
      limit: 1,
      order: [['createdAt', 'DESC']],
    });

    return latestEvent ? latestEvent.value : null;
  }

  async countBuys (date) {
    const { count } = await this.model.findAndCountAll({
      where: {
        action: 'buy',
        createdAt: { [Op.gt]: moment(date).startOf('d').toDate() },
        deletedAt: null
      },
    });

    return count;
  }

  async getEvents (ticker = null, from = moment().startOf('d'), till) {
    // assert(ticker);

    const where = {
      // ticker,
      createdAt: {
        [Op.gt]: moment(from).toDate(),
        [Op.lt]: moment(till).toDate(),
      },
      deletedAt: null,
      action: {
        [Op.not]: 'error'
      }
    };
    if (ticker) where.ticker = ticker;

    const events = await this.model.findAll({
      where,
      limit: 1000,
      order: [['createdAt', 'DESC']],
    });

    events.forEach(item => {
      item.dateStr = moment(item.createdAt).tz('Europe/Moscow').format('D MMM YYYY  HH:mm');
    });

    return events;
  }


  /*async getProfit (ticker = null, from = moment().startOf('d'), till) {
    // assert(ticker);

    const where = {
      // ticker,
      action: 'sell',
      createdAt: {
        [Op.gt]: moment(from).toDate(),
        [Op.lt]: moment(till).toDate(),
      },
      deletedAt: null
    };
    if (ticker) where.ticker = ticker;

    const events = await this.model.findAll({ where });

    return events.reduce((sum, item) => sum + item.value, 0);
  }*/

};