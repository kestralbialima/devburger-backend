'use strict';

/**
 * Este arquivo é uma "Seed" (Semente).
 * O objetivo dele é popular o banco de dados com dados iniciais 
 * para que o Frontend tenha o que exibir logo no primeiro acesso.
 */

module.exports = {
  /**
   * Método UP: Executado quando você roda 'npx sequelize-cli db:seed:all'.
   * Ele insere os dados nas tabelas.
   */
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('categories', [
      {
        name: 'Hambúrgueres',
        // O path deve ser o nome exato da imagem que está na sua pasta /uploads
        path: 'teste.jpg',
        created_at: new Date(), // Sequelize exige que preenchamos manualmente nas seeds
        updated_at: new Date(),
      },
      {
        name: 'Bebidas',
        path: 'teste.jpg',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Sobremesas',
        path: 'teste.jpg',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Combos',
        path: 'teste.jpg',
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {});
  },

  /**
   * Método DOWN: Executado quando você roda 'npx sequelize-cli db:seed:undo'.
   * Ele serve para "limpar" ou reverter o que o método UP fez.
   */
  async down(queryInterface, Sequelize) {
    // Remove todos os dados da tabela 'categories'
    return queryInterface.bulkDelete('categories', null, {});
  }
};