const { Sequelize } = require('sequelize');
const path = require('path');
const NAME = path.basename(__filename);

module.exports = {
  up: async (queryInterface) => {
    queryInterface.addColumn('stocks', 'takeprofit',   { type: Sequelize.FLOAT,   defaultValue: null, allowNull: true });
    queryInterface.addColumn('stocks', 'buyonstart',   { type: Sequelize.BOOLEAN, defaultValue: null, allowNull: true });
    queryInterface.addColumn('stocks', 'buyonend',     { type: Sequelize.BOOLEAN, defaultValue: null, allowNull: true });
    queryInterface.addColumn('stocks', 'sellcooldown', { type: Sequelize.INTEGER, defaultValue: null, allowNull: true });
    queryInterface.addColumn('stocks', 'buycooldown',  { type: Sequelize.INTEGER, defaultValue: null, allowNull: true });
    queryInterface.addColumn('stocks', 'moredeals',    { type: Sequelize.BOOLEAN, defaultValue: null, allowNull: true });
    queryInterface.addColumn('stocks', 'scheduledbuy', { type: Sequelize.BOOLEAN, defaultValue: null, allowNull: true });
    queryInterface.addColumn('stocks', 'maxprice',     { type: Sequelize.FLOAT,   defaultValue: null, allowNull: true });
    console.log(`migration up: ${NAME}`);
  },

  down: async (queryInterface) => {
    queryInterface.removeColumn('stocks', 'takeprofit');
    queryInterface.removeColumn('stocks', 'buyonstart');
    queryInterface.removeColumn('stocks', 'buyonend');
    queryInterface.removeColumn('stocks', 'sellcooldown');
    queryInterface.removeColumn('stocks', 'buycooldown');
    queryInterface.removeColumn('stocks', 'moredeals');
    queryInterface.removeColumn('stocks', 'scheduledbuy');
    queryInterface.removeColumn('stocks', 'maxprice');
    console.log(`migration down: ${NAME}`);
  }
};
