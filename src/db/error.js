const assert = require('assert');
const moment = require('moment-timezone');
const { DataTypes, Op } = require('sequelize');

const IS_DRY_RUN = (process.env.IS_DRY_RUN === 'true');


module.exports = class ErrorTable {
  constructor (sequelize) {
    assert(sequelize);
    this.model = sequelize.define('Error', {
      ticker: { type: DataTypes.STRING, allowNull: false },
      info: { type: DataTypes.STRING, allowNull: false },
    }, {
      modelName: 'error',
      tableName: 'errors',
      timestamps: true,
      updatedAt: false,
      paranoid: true,
    });
  }

  async createError (data) {
    await this.model.create({
      ...data,
      ticker: (IS_DRY_RUN ? `DRY_${data.ticker}` : data.ticker),
    });
  }

  async getErrors (ticker = null, from = moment().startOf('d'), till) {
    // assert(ticker);

    const where = {
      // ticker,
      createdAt: {
        [Op.gt]: moment(from).toDate(),
        [Op.lt]: moment(till).toDate(),
      },
      deletedAt: null
    };
    if (ticker) where.ticker = ticker;

    const errors = await this.model.findAll({
      where,
      limit: 1000,
      order: [['createdAt', 'DESC']],
    });

    errors.forEach(item => {
      item.dateStr = moment(item.createdAt).tz('Europe/Moscow').format('D MMM YYYY  HH:mm');
      item.action = 'error';
    });

    return errors;
  }

};