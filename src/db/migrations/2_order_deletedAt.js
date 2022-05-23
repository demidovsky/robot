const { Sequelize } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    queryInterface.addColumn(
      'events',
      'deletedAt',
      Sequelize.STRING
    );
  },

  down: async (queryInterface) => {
    queryInterface.removeColumn(
      'events',
      'deletedAt',
    );
  }
};
