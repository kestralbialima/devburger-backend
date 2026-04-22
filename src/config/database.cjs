// Precisamos carregar o dotenv para que este arquivo entenda o que está no .env
require('dotenv').config();

module.exports = {
  dialect: 'postgres',
  // Se existir DATABASE_URL (Render), ele usa ela. Se não, usa o localhost.
  url: process.env.DATABASE_URL, 
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASS || '12345',
  database: process.env.DB_NAME || 'dev-burguer-db',
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
  // 🛡️ ADICIONE ISSO: Essencial para bancos na nuvem (Render/Neon)
  dialectOptions: {
    ssl: process.env.DATABASE_URL ? {
      require: true,
      rejectUnauthorized: false,
    } : false,
  },
};