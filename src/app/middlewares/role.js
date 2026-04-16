/**
 * 🛡️ MIDDLEWARE DE AUTORIZAÇÃO (RBAC)
 * Este middleware recebe uma lista de cargos permitidos e verifica
 * se o usuário que está tentando acessar a rota tem esse poder.
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    const { userRole } = req;

    // 🔒 Verifica se o cargo do usuário está na lista de permitidos
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Acesso negado: Você não tem nível de permissão para esta área.' 
      });
    }

    return next();
  };
};

export default authorize;