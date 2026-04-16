import * as Yup from 'yup';
import Users from '../models/User.js'; 
import bcrypt from 'bcrypt';

class UserController {
  /**
   * 🆕 MÉTODO: STORE (Cadastro de Usuários)
   * Responsável por criar novos perfis no sistema.
   */
  async store(request, response) {
    const schema = Yup.object({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      password: Yup.string().required().min(6),
      role: Yup.string().oneOf(['master', 'manager', 'operator']), 
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
     * 🛡️ PROTEÇÃO DE CARGOS:
     * Por padrão, todo cadastro novo é 'operator' (cliente ou funcionário base).
     * Somente se um Master estiver logado, ele pode definir um cargo diferente.
     */
    let finalRole = 'operator';
    if (request.userRole === 'master') {
      finalRole = role || 'operator';
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
        // Selecionamos apenas campos seguros (não enviamos password_hash)
        attributes: ['id', 'name', 'email', 'role'], 
        order: [['name', 'ASC']], // Organiza por ordem alfabética
      });

      return response.json(users);
    } catch (err) {
      return response.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
  }

  /**
   * 🔄 MÉTODO: UPDATE (Alteração de Cargos)
   * Onde o Master "atribui os poderes" aos outros usuários.
   */
  async update(request, response) {
    const schema = Yup.object({
      userId: Yup.string().uuid().required(), // Validamos se o ID enviado é um UUID válido
      role: Yup.string().oneOf(['master', 'manager', 'operator']).required(),
    });

    try {
      schema.validateSync(request.body, { abortEarly: false });
    } catch (err) {
      return response.status(400).json({ error: err.errors });
    }

    const { userId, role } = request.body;

    // 1. Localiza o usuário alvo no banco de dados
    const user = await Users.findByPk(userId);

    if (!user) {
      return response.status(404).json({ error: 'User not found' });
    }

    // 2. Impede que o Master tente alterar seu próprio cargo (evita auto-bloqueio)
    if (userId === request.userId) {
      return response.status(400).json({ error: 'Você não pode alterar seu próprio cargo.' });
    }

    // 3. Salva a nova permissão no banco
    await user.update({ role });

    return response.status(200).json({ 
      message: `O usuário ${user.name} agora tem o cargo de ${role}.` 
    });
  }
}

// Exportamos a instância da classe para ser usada nas rotas
export default new UserController();