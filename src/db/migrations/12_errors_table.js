const { Sequelize } = require('sequelize');
const path = require('path');
const NAME = path.basename(__filename);

module.exports = {
  up: async (queryInterface) => {
    queryInterface.createTable('errors', {
      ticker: { type: Sequelize.STRING, allowNull: false },
      info: { type: Sequelize.STRING, allowNull: false },
    });
    console.log(`migration up: ${NAME}`);
  },

  down: async (queryInterface) => {
    queryInterface.dropTable('errors');
    console.log(`migration down: ${NAME}`);
  }
};
