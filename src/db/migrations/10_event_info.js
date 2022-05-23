const { Sequelize } = require('sequelize');
const path = require('path');
const NAME = path.basename(__filename);

module.exports = {
  up: async (queryInterface) => {
    queryInterface.addColumn(
      'events',
      'info',
      {
        type: Sequelize.STRING,
        defaultValue: null,
        allowNull: true,
      },
    );
    console.log(`migration up: ${NAME}`);
  },

  down: async (queryInterface) => {
    queryInterface.removeColumn(
      'events',
      'info',
    );
    console.log(`migration down: ${NAME}`);
  }
};
