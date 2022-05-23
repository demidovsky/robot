const assert = require('assert');
const { DataTypes } = require('sequelize');
const IS_DRY_RUN = (process.env.IS_DRY_RUN === 'true');


module.exports = class CashTable {
  constructor (sequelize) {
    assert(sequelize);
    this.model = sequelize.define('Cash', {
      value: { type: DataTypes.FLOAT, allowNull: false },
    }, {
      modelName: 'cash',
      tableName: 'cash',
      timestamps: true,
      updatedAt: false,
    });    
  }

  async createCash (value) {
    assert(typeof value !== 'undefined');
    if (IS_DRY_RUN) return;

    await this.model.create({
      value,
    });
  }
};
