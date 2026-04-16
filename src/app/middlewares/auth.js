import jwt from 'jsonwebtoken';
import authConfig from '../../config/auth.js';

const authMiddleware = (req, resp, next) => {
  const authToken = req.headers.authorization;

  if (!authToken) {
    return resp.status(401).json({ error: 'Token not provided' });
  }

  const token = authToken.split(' ')[1];

  try {
    const decoded = jwt.verify(token, authConfig.secret);

    /**
     * 🛡️ TRANSIÇÃO DE PODER:
     * Substituímos o 'userAdmin' (booleano) pelo 'userRole' (cargo).
     * Agora o backend sabe exatamente se o usuário é master, manager ou operator.
     */
    req.userId = decoded.id;
    req.userRole = decoded.role; // ✅ Atribuímos o cargo vindo do token
    req.userName = decoded.name; 

    return next();
  } catch (err) {
    return resp.status(401).json({ error: 'Token is invalid' });
  }
};

export default authMiddleware;