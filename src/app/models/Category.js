import Sequelize, { Model } from 'sequelize';

class Category extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        path: Sequelize.STRING, // ✅ Guarda o nome do arquivo
        url: {                  // ✅ Gera o link para o frontend
          type: Sequelize.VIRTUAL,
          get() {
            return `http://localhost:3001/category-file/${this.path}`;
          },
        },
      },
      {
        sequelize,
        tableName: 'categories',
      },
    );
    return this;
  }
}
export default Category;