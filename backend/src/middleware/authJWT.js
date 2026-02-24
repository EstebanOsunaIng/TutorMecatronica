import { verifyToken } from '../utils/tokens.js';
import { User } from '../models/User.model.js';

export async function authJWT(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }
  try {
    const payload = verifyToken(token);

    const user = await User.findById(payload.id).select('isActive role');
    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'Perfil inactivo. No puedes ingresar.' });
    }

    req.user = { ...payload, role: user.role, isActive: user.isActive };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
