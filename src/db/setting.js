const assert = require('assert');
const moment = require('moment');
const { DataTypes, Op } = require('sequelize');

const IS_DRY_RUN = (process.env.IS_DRY_RUN === 'true');


module.exports = class SettingTable {
  constructor (sequelize) {
    assert(sequelize);
    this.model = sequelize.define('Setting', {
      key: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
      value: { type: DataTypes.STRING, allowNull: false },
    }, {
      modelName: 'setting',
      tableName: 'settings',
      timestamps: true,
      updatedAt: true,
      paranoid: false,
    });
  }

  async updateSetting (key, value) {
    return this.model.upsert({ key, value });
  }

  async clearSetting (key) {
    return this.model.destroy({ where: { key } });
  }

  async getSetting (key) {
    return this.model.findOne({ where: { key } });
  }

  async getAllSettings () {
    const array = await this.model.findAll();
    const obj = array.reduce((result, { key, value }) => { result[key] = JSON.parse(value); return result; }, {});
    return obj;
  }
};