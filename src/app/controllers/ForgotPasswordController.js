import crypto from 'crypto';
import User from '../models/User.js';
import Mail from '../lib/Mail.js';

class ForgotPasswordController {
  async store(request, response) {
    const { email } = request.body;

    const user = await User.findOne({ where: { email } });

    // 🕵️ Segurança: Mesmo se o user não existir, damos um OK para evitar vazamento de dados
    if (!user) {
      return response.status(200).json({ message: 'Se o e-mail existir, um link foi enviado.' });
    }

    // 🔑 Gera um token de 20 caracteres e define expiração (1 hora)
    const token = crypto.randomBytes(10).toString('hex');
    const now = new Date();
    now.setHours(now.getHours() + 1);

    // Atualiza o usuário no banco com o token e a validade
    await user.update({
      password_reset_token: token,
      password_reset_expires: now,
    });

    // 📬 Envia o e-mail
    await Mail.sendMail({
      from: 'Dev Burger <suporte@corebuild.com>',
      to: email,
      subject: 'Recuperação de Senha - Dev Burger 🍔',
      html: `
        <h1>Olá, ${user.name}!</h1>
        <p>Você solicitou uma alteração de senha. Use o link abaixo para redefinir:</p>
        <a href="http://localhost:5173/reset-password?token=${token}">Redefinir Senha</a>
        <p>Se não foi você, apenas ignore este e-mail. O link expira em 1 hora.</p>
      `,
    });

    return response.status(200).json({ message: 'E-mail enviado com sucesso!' });
  }
}

export default new ForgotPasswordController();