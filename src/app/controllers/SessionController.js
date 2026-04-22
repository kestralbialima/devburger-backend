import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as Yup from 'yup';

import User from '../models/User.js';
import authConfig from '../../config/auth.js';

class SessionController {
  /**
   * 🚀 MÉTODO STORE: Responsável por autenticar o usuário e gerar o Token JWT.
   */
  async store(req, res) {
    try {
      // 1️⃣ VALIDAÇÃO: Definimos o esquema do que esperamos receber no body
      const schema = Yup.object().shape({
        email: Yup.string().email().required(),
        password: Yup.string().min(6).required(),
      });

      // Validamos os dados vindos da requisição
      const isValid = await schema.isValid(req.body);

      // Função auxiliar para retornar erro de credenciais (Segurança: não dizemos se foi o email ou a senha que errou)
      const emailOrPasswordIncorrect = () => {
        return res.status(401).json({ error: 'Email or password incorrect' });
      };

      // Se o formato dos dados for inválido, paramos aqui
      if (!isValid) {
        return emailOrPasswordIncorrect();
      }

      const { email, password } = req.body;

      // 2️⃣ BUSCA NO BANCO: Procuramos o usuário pelo e-mail (PostgreSQL via Sequelize)
      const existingUser = await User.findOne({
        where: { email },
      });

      // Se o usuário não existir no banco de dados
      if (!existingUser) {
        return emailOrPasswordIncorrect();
      }

      // 3️⃣ COMPARAÇÃO DE SENHA: O bcrypt compara a senha digitada com o hash salvo no banco
      const isPasswordCorrect = await bcrypt.compare(
        password,
        existingUser.password_hash,
      );

      // Se a senha estiver errada
      if (!isPasswordCorrect) {
        return emailOrPasswordIncorrect();
      }

      // 4️⃣ SUCESSO: Geramos o Token e retornamos as informações para o Frontend
      // O cargo (role) é enviado tanto no JSON quanto dentro do "payload" do Token (segurança extra)
      return res.status(200).json({
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role, // 🛡️ Cargo real: client, manager, master, etc.
        token: jwt.sign(
          { 
            id: existingUser.id, 
            name: existingUser.name, 
            role: existingUser.role 
          }, 
          authConfig.secret, 
          {
            expiresIn: authConfig.expiresIn,
          }
        ),
      });
    } catch (error) {
      /**
       * 🚨 TRATAMENTO DE ERROS: 
       * Se o banco de dados cair ou houver erro de sintaxe, o erro aparece no terminal
       * e o Frontend recebe um status 500 em vez de ficar "pendurado".
       */
      console.error('❌ Erro no SessionController:', error);
      return res.status(500).json({ error: 'Internal server error. Please try again later.' });
    }
  }
}

// Exportamos uma instância da classe (padrão Singleton)
export default new SessionController();