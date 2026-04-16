import { Sequelize } from 'sequelize'; 
import mongoose from 'mongoose';

import User from '../app/models/User.js'; 
import Product from '../app/models/Product.js'; // 3️⃣ Importando o Model Product
import databaseConfig from '../config/database.cjs'; 
import Category from '../app/models/Category.js'; 
import Coupon from '../app/models/Coupon.js'; 
import UserCoupon from '../app/models/UserCoupon.js';

const models = [User, Product, Category, Coupon, UserCoupon];

class Database {
  constructor() {
    this.init();
    this.mongo();
  }

  init() {
    /**
     * 🌐 CONEXÃO INTELIGENTE:
     * Se existir a variável DATABASE_URL (Produção/Render), usamos ela.
     * Caso contrário, usamos o objeto de configuração local (Development).
     */
    const connectionURL = process.env.DATABASE_URL;

    if (connectionURL) {
      // 🛡️ Configuração para PRODUÇÃO (Render/Cloud)
      this.connection = new Sequelize(connectionURL, {
        dialect: 'postgres',
        define: {
          timestamps: true,
          underscored: true,
          underscoredAll: true,
        },
        // 🔒 ESSENCIAL: O Render exige SSL para aceitar a conexão externa
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false, // Permite certificados auto-assinados comuns em nuvem
          },
        },
      });
    } else {
      // 💻 Configuração para DESENVOLVIMENTO (Localhost)
      this.connection = new Sequelize(databaseConfig);
    }

    // 🚀 Inicializa os models e as associações
    models
      .map((model) => model.init(this.connection))
      .map((model) => model.associate && model.associate(this.connection.models));
  }
mongo() {
  this.mongooseConnection = mongoose.connect(
    'mongodb://localhost:27017/devBurguer'
  )
  .then(() => console.log('MongoDB conectado com sucesso!'))
  .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));
}

}

export default new Database(); //