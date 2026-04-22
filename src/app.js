import express from 'express';
import { resolve, dirname } from 'node:path'; // 👈 Adicionamos o dirname aqui
import { fileURLToPath } from 'node:url';    // 👈 Necessário para criar o __dirname
import cors from 'cors';

import routes from './routes.js';

// 🛠️ CONFIGURAÇÃO SÊNIOR PARA ES MODULES:
// Como __dirname não existe nativamente aqui, nós o criamos usando a URL do arquivo atual.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class App {
  constructor() {
    this.app = express();

    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    /**
     * 🖼️ SERVINDO ARQUIVOS ESTÁTICOS
     * Agora que definimos o __dirname acima, o caminho para a pasta 'uploads' funcionará.
     */
    this.app.use(
      '/products-file',
      express.static(resolve(__dirname, '..', 'uploads'))
    );
  }

  routes() {
    this.app.use(routes);
  }
}

export default new App().app;