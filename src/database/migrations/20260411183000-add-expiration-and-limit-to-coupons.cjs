'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('coupons', 'expiration_date', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('coupons', 'limit_per_user', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('coupons', 'expiration_date');
    await queryInterface.removeColumn('coupons', 'limit_per_user');
  },
};
