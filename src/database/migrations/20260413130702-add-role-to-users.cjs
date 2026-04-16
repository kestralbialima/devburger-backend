module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Criar a coluna 'role'
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.ENUM('master', 'manager', 'operator'),
      defaultValue: 'operator',
      allowNull: false,
    });

    // 2. Lógica de Migração de Dados:
    // Quem era admin vira master. Quem não era, vira operator.
    await queryInterface.sequelize.query(
      "UPDATE users SET role = 'master' WHERE admin = true"
    );
    await queryInterface.sequelize.query(
      "UPDATE users SET role = 'operator' WHERE admin = false OR admin IS NULL"
    );

    // 3. Remover a coluna 'admin' antiga
    await queryInterface.removeColumn('users', 'admin');
  },

  down: async (queryInterface, Sequelize) => {
    // Caso precise desfazer (rollback)
    await queryInterface.addColumn('users', 'admin', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
    
    await queryInterface.removeColumn('users', 'role');
    // Nota: O tipo ENUM no Postgres pode exigir um comando extra para ser removido totalmente
  },
};