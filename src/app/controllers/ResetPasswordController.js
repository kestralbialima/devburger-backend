import User from '../models/User.js';

class ResetPasswordController {
  async store(request, response) {
    const { token, password } = request.body;

    const user = await User.findOne({ where: { password_reset_token: token } });

    if (!user) {
      return response.status(400).json({ error: 'Token inválido!' });
    }

    // ⏱️ Verifica se o token expirou
    if (new Date() > user.password_reset_expires) {
      return response.status(400).json({ error: 'Token expirado, peça um novo.' });
    }

    // 🆙 Atualiza a senha e limpa o token
    user.password = password;
    user.password_reset_token = null;
    user.password_reset_expires = null;

    await user.save();

    return response.status(200).json({ message: 'Senha atualizada com sucesso!' });
  }
}

export default new ResetPasswordController();