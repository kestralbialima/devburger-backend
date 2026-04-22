import Sequelize, { Model } from 'sequelize';


class Product extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        price: Sequelize.FLOAT,
        description: Sequelize.TEXT,
        category_id: Sequelize.INTEGER,
        path: Sequelize.STRING,
        offer: Sequelize.BOOLEAN,
        is_bonus: Sequelize.BOOLEAN, // 🛡️ Sincronizado com o Beekeeper
       url: {
          type: Sequelize.VIRTUAL,
          get() {
            /** * 🌐 LÓGICA DE AMBIENTE:
             * Se estivermos no Render, o NODE_ENV será 'production'.
             * Caso contrário, usamos o localhost.
             */
            const base_url = process.env.NODE_ENV === 'production'
              ? 'https://devburger-backend-a4zs.onrender.com'
              : 'http://localhost:3001';

            return `${base_url}/products-file/${this.path}`;
          }
        }
      },

      {
        sequelize,
        tableName: 'products',
        underscored: true,
        timestamps: true
      },
    );
    return this;
  }


  static associate(models) {
    this.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category',
    });
  }

  // Garante que o campo virtual 'url' sempre apareça no JSON,
  // inclusive em findAll(), findByPk() e após reload().
  toJSON() {
    return {
      ...this.dataValues,
      url: this.url,
    };
  }
}

export default Product;