import Sequelize, { Model, DataTypes } from 'sequelize';

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        name: DataTypes.STRING,
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true, // Fundamental para segurança e login
        },
        password_hash: DataTypes.STRING,

        /**
         * 🛡️ A MUDANÇA ESTRATÉGICA:
         * Em vez de boolean admin, usamos STRING para definir o cargo.
         * Default 'operator' garante que ninguém nasça com superpoderes.
         */
        role: {
          type: DataTypes.ENUM('master', 'manager', 'operator'),
          defaultValue: 'operator',
          allowNull: false,
        },
        /** * 🔑 RECUPERAÇÃO DE SENHA:
                 * Adicionando os campos necessários para o fluxo de "Esqueci minha senha".
                 */
        password_reset_token: {
          type: DataTypes.STRING,
          allowNull: true, // Só preenchido quando solicitado
        },
        password_reset_expires: {
          type: DataTypes.DATE,
          allowNull: true, // Só preenchido quando solicitado
        },
      },

      {
        sequelize,
        tableName: 'users',
        underscored: true,
        timestamps: true,
      },
    );

    return this;
  }
}

export default User;