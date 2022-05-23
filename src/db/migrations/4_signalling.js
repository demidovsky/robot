const { Sequelize } = require('sequelize');
const path = require('path');
const NAME = path.basename(__filename);

module.exports = {
  up: async (queryInterface) => {
    queryInterface.addColumn(
      'stocks',
      'signalling',
      {
        type: Sequelize.BOOLEAN,
        defaultValue: null,
        allowNull: true,
      },
    );
    console.log(`migration up: ${NAME}`);
  },

  down: async (queryInterface) => {
    queryInterface.removeColumn(
      'stocks',
      'signalling',
    );
    console.log(`migration down: ${NAME}`);
  }
};
