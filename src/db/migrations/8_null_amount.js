const { Sequelize } = require('sequelize');
const path = require('path');
const NAME = path.basename(__filename);

module.exports = {
  up: async (queryInterface) => {
    queryInterface.changeColumn(
      'stocks',
      'amount',
      {
        type: Sequelize.INTEGER,
        defaultValue: null,
        allowNull: true,
      },
    );
    console.log(`migration up: ${NAME}`);
  },

  down: async (queryInterface) => {
    queryInterface.changeColumn(
      'stocks',
      'title',
      {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
    );
    console.log(`migration down: ${NAME}`);
  }
};
