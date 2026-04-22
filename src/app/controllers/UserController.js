import * as Yup from 'yup';
import Users from '../models/User.js'; 
import bcrypt from 'bcrypt';

class UserController {
  /**
   * 🆕 MÉTODO: STORE (Cadastro de Usuários)
   * Agora configurado para que qualquer novo cadastro seja um 'user' comum.
   */
  async store(request, response) {
    const schema = Yup.object({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      password: Yup.string().required().min(6),
      // Adicionamos 'user' como uma opção válida na validação
      role: Yup.string().oneOf(['master', 'manager', 'operator', 'user']), 
    });

    try {
      schema.validateSync(request.body, { abortEarly: false });
    } catch (err) {
      return response.status(400).json({ error: err.errors });
    }

    const { name, email, password, role } = request.body;

    // Verifica se o e-mail já está em uso
    const existingUser = await Users.findOne({ where: { email } });

    if (existingUser) {
      return response.status(409).json({ error: 'User already exists' });
    }

    /**
     * 🛡️ PROTEÇÃO DE CARGOS (Ajustada para Core.Build):
     * 1. Por padrão, todo cadastro via site/app é 'user' (cliente sem acesso ao admin).
     * 2. Somente se um Master estiver logado e enviando a requisição, 
     * ele pode criar um usuário com cargos administrativos.
     */
    let finalRole = 'user'; 

    if (request.userRole === 'master') {
      finalRole = role || 'user';
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await Users.create({
      name,
      email,
      password_hash, 
      role: finalRole,
    });

    return response.status(201).json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });
  } 

  /**
   * 📋 MÉTODO: INDEX (Listagem de Equipe)
   * Permite que o Master veja todos os usuários para gerenciar permissões.
   */
  async index(request, response) {
    try {
      const users = await Users.findAll({
        attributes: ['id', 'name', 'email', 'role'], 
        order: [['name', 'ASC']], 
      });

      return response.json(users);
    } catch (err) {
      return response.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
  }

  /**
   * 🔄 MÉTODO: UPDATE (Alteração de Cargos)
   * O Master agora pode "rebaixar" alguém para 'user' ou promover.
   */
  async update(request, response) {
    const schema = Yup.object({
      userId: Yup.string().uuid().required(),
      // Incluímos 'user' no array de permissões permitidas para atualização
      role: Yup.string().oneOf(['master', 'manager', 'operator', 'user']).required(),
    });

    try {
      schema.validateSync(request.body, { abortEarly: false });
    } catch (err) {
      return response.status(400).json({ error: err.errors });
    }

    const { userId, role } = request.body;

    const user = await Users.findByPk(userId);

    if (!user) {
      return response.status(404).json({ error: 'User not found' });
    }

    // Impede que o Master tente alterar seu próprio cargo
    if (userId === request.userId) {
      return response.status(400).json({ error: 'Você não pode alterar seu próprio cargo.' });
    }

    await user.update({ role });

    return response.status(200).json({ 
      message: `O usuário ${user.name} agora tem o cargo de ${role}.` 
    });
  }
}

export default new UserController();