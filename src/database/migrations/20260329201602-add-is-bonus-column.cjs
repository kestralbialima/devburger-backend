'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 🚀 Adiciona a coluna 'is_bonus' na tabela 'products'
    await queryInterface.addColumn('products', 'is_bonus', {
      type: Sequelize.BOOLEAN,
      defaultValue: false, // Começa como falso para não dar erro nos itens antigos
      allowNull: false,
    });
  },

  down: async (queryInterface) => {
    // ⏪ Caso queira desfazer, ele remove a coluna
    await queryInterface.removeColumn('products', 'is_bonus');
  }
};