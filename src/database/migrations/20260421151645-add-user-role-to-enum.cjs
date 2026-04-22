'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // Este comando adiciona 'user' à lista de opções do ENUM existente
    return queryInterface.sequelize.query(
      "ALTER TYPE enum_users_role ADD VALUE 'user';"
    );
  },

  async down (queryInterface, Sequelize) {
    /** * Nota: O Postgres não permite remover valores de um ENUM facilmente. 
     * Em caso de rollback, o valor 'user' continuará lá, o que não causa erros.
     */
  }
};