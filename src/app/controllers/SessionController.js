import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as Yup from 'yup';
import User from '../models/User.js';
import authConfig from '../../config/auth.js';

class sessionController {
  async store(req, res) {
    const schema = Yup.object().shape({
      email: Yup.string().email().required(),
      password: Yup.string().min(6).required(),
    });

    const isValid = await schema.isValid(req.body);

    const emailOrPasswordIncorrect = () => {
      return res.status(401).json({ error: 'Email or password incorrect' });
    };

    if (!isValid) {
      return emailOrPasswordIncorrect(); 
    }

    const { email, password } = req.body;

    const existingUser = await User.findOne({ 
      where: { email },
    });

    if (!existingUser) {
      return emailOrPasswordIncorrect();
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password_hash,
    );

    if (!isPasswordCorrect) {
      return emailOrPasswordIncorrect(); 
    }
    
   // ✅ Geramos o token com o novo sistema de cargos (Roles)
    return res.status(200).json({
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role, // 🛡️ Substituímos o admin pelo cargo real
      token: jwt.sign(
        { 
          id: existingUser.id, 
          name: existingUser.name, 
          role: existingUser.role // 🚀 AGORA O CARGO ESTÁ NO "PAYLOAD" DO TOKEN!
        }, 
        authConfig.secret, 
        {
          expiresIn: authConfig.expiresIn,
        }
      ),
    });
  }
}

export default new sessionController();