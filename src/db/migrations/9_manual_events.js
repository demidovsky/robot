const { Sequelize } = require('sequelize');
const path = require('path');
const NAME = path.basename(__filename);

module.exports = {
  up: async (queryInterface) => {
    queryInterface.changeColumn(
      'events',
      'action',
      { type: Sequelize.ENUM('buy', 'sell', 'error'), allowNull: false },
    );
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
    queryInterface.changeColumn(
      'events',
      'action',
      { type: Sequelize.ENUM('buy', 'sell'), allowNull: false },
    );
    queryInterface.removeColumn(
      'events',
      'info',
    );
    console.log(`migration down: ${NAME}`);
  }
};
