const { Sequelize } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    queryInterface.addColumn(
      'events',
      'order_id',
      Sequelize.STRING
    );
  },

  down: async (queryInterface) => {
    queryInterface.removeColumn(
      'events',
      'order_id',
    );
  }
};
