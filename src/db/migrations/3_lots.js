const { Sequelize } = require('sequelize');
const path = require('path');
const NAME = path.basename(__filename);

module.exports = {
  up: async (queryInterface) => {
    queryInterface.addColumn(
      'events',
      'lots',
      {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
    );
    console.log(`migration up: ${NAME}`);
  },

  down: async (queryInterface) => {
    queryInterface.removeColumn(
      'events',
      'lots',
    );
    console.log(`migration down: ${NAME}`);
  }
};
