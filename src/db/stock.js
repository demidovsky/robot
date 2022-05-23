const assert = require('assert');
const { settings } = require('cluster');
const { DataTypes } = require('sequelize');
const IS_DRY_RUN = (process.env.IS_DRY_RUN === 'true');


module.exports = class StockTable {
  constructor (sequelize) {
    assert(sequelize);
    this.model = sequelize.define('Stock', {
      ticker:         { type: DataTypes.STRING,  allowNull: false, primaryKey: true },
      title:          { type: DataTypes.STRING,  allowNull: true },

      // metrics:
      price:          { type: DataTypes.FLOAT,   allowNull: true },
      signalling:     { type: DataTypes.BOOLEAN, allowNull: true },
      signallength:   { type: DataTypes.INTEGER, allowNull: true },
      rsi:            { type: DataTypes.INTEGER, allowNull: true },

      // settings:
      amount:         { type: DataTypes.INTEGER, allowNull: true },
      takeprofit:     { type: DataTypes.FLOAT,   allowNull: true },
      buyonstart:     { type: DataTypes.BOOLEAN, allowNull: true },
      buyonend:       { type: DataTypes.BOOLEAN, allowNull: true },
      sellcooldown:   { type: DataTypes.INTEGER, allowNull: true },
      buycooldown:    { type: DataTypes.INTEGER, allowNull: true },
      moredeals:      { type: DataTypes.BOOLEAN, allowNull: true },
      scheduledbuy:   { type: DataTypes.BOOLEAN, allowNull: true },
      maxprice:       { type: DataTypes.FLOAT,   allowNull: true },

    }, {
      modelName: 'stock',
      tableName: 'stocks',
      timestamps: true,
      updatedAt: true,
      paranoid: true,
    });
  }

  async getStocks (sortColumn) {
    const stocks = await this.model.findAll({
      where: { deletedAt: null },
      order: sortColumn ? [sortColumn] : null,
    });

    const result = {};
    for (let i = 0; i < stocks.length; i++) {
      const { ticker } = stocks[i];
      result[ticker] = stocks[i];
    }
    return result;
  }

  /**
   * Get stock parameters by ticker
   * @param  {String} ticker
   * @return {Stock}
   */
  async getStock (ticker) {
    const stock = await this.model.findOne({ where: { ticker }, paranoid: false });
    return stock;
  }

  async enable(ticker) {
    assert(ticker);
    const result = await this.model.update(
      { deletedAt: null },
      { where: { ticker }, paranoid: false }
    );
    return result;
  }

  async disable(ticker) {
    assert(ticker);
    const result = await this.model.destroy({
      where: { ticker }
    });
    return { status: result ? 'switched off' : 'already off' };
  }

  async setStockAmount ({ ticker, amount }) {
    await this.model.upsert({ ticker, amount });
  }

  async setStockPrice ({ ticker, title, price }) {
    await this.model.update({ price, title }, { where: { ticker } });
  }

  async setStockProfit ({ ticker, takeprofit }) {
    await this.model.update({ takeprofit }, { where: { ticker } });
  }

  async setStockParams (ticker, params) {
    await this.model.update(params, { where: { ticker } });
  }

  async setScheduledBuy ({ ticker, scheduledbuy }) {
    await this.model.update({ scheduledbuy }, { where: { ticker } });
  }

  async getSignalling (sortColumn) {
    const stocks = await this.model.findAll(sortColumn ? { order: [sortColumn] } : {});
    const result = {};
    for (let i = 0; i < stocks.length; i++) {
      const { ticker, signalling } = stocks[i];
      result[ticker] = signalling;
    }
    return result;
  }

  async setSignalling ({ ticker, signalling }) {
    const settings = await this.model.findOne({ where: { ticker } });
    if (!settings) return;
    let { signallength } = settings;
    if (signalling) {
      if (signallength) {
        signallength++;
      } else {
        signallength = 1;
      }
    } else {
      signallength = null;
    }

    if (!IS_DRY_RUN) {
      await this.model.update({ signalling, signallength }, { where: { ticker } });
    }
  }

  async schedule (ticker) {
    if (!IS_DRY_RUN) {
      await this.model.update({ buycooldown: 1, scheduledbuy: true }, { where: { ticker } });
    }
  }
};
