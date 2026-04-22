import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';

// 📚 Manutenção dos seus Imports de Models (Nomes originais preservados)
import User from '../app/models/User.js';
import Product from '../app/models/Product.js';
import databaseConfig from '../config/database.cjs';
import Category from '../app/models/Category.js';
import Coupon from '../app/models/Coupon.js';
import UserCoupon from '../app/models/UserCoupon.js';

// 🏗️ Array de models para inicialização em lote
const models = [User, Product, Category, Coupon, UserCoupon];

class Database {
  constructor() {
    this.init();
    this.mongo();
  }

  /**
   * 🐘 POSTGRESQL (RELACIONAL)
   * Configuração para gerenciar Usuários, Produtos e Pedidos.
   */
  init() {
    const connectionURL = process.env.DATABASE_URL;

    if (connectionURL) {
      // 🚀 AMBIENTE: PRODUÇÃO (Render)
      // Utilizamos a URL externa e forçamos o SSL para segurança em nuvem.
      this.connection = new Sequelize(connectionURL, {
        dialect: 'postgres',
        define: {
          timestamps: true,
          underscored: true,
          underscoredAll: true,
        },
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
      });
    } else {
      // 💻 AMBIENTE: DESENVOLVIMENTO (Localhost)
      this.connection = new Sequelize(databaseConfig);
    }

    // 🔥 Execução do ciclo de vida dos models: Inicialização e Associações
    models
      .map((model) => model.init(this.connection))
      .map((model) => model.associate && model.associate(this.connection.models));
  }

  /**
   * 🍃 MONGODB (NÃO-RELACIONAL)
   * Configuração para logs e histórico persistente de transações.
   */
  mongo() {
    /**
     * 🕵️ Lógica de Conexão Dinâmica:
     * Tenta ler 'MONGO_URL' das variáveis de ambiente do Render.
     * Se não encontrar, faz o fallback para o endereço local.
     */
    const mongoURL = process.env.MONGO_URL || 'mongodb://localhost:27017/devBurguer';

    this.mongooseConnection = mongoose
      .connect(mongoURL)
      .then(() => {
        // Log informativo para confirmar o sucesso no terminal do Render
        console.log('✅ MongoDB conectado com sucesso!');
      })
      .catch((err) => {
        // Captura detalhada de erros para facilitar o debug sênior
        console.error('❌ Erro crítico ao conectar ao MongoDB:', err.message);
      });
  }
}

// 📦 Exportação da instância singleton (padrão de projeto para conexão única)
export default new Database();