const jwt = require('jsonwebtoken');

// Verifica se o token JWT é válido.
// Equivale ao onAuthStateChanged do Firebase — protege rotas autenticadas.
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente.' });
  }

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

// Verifica se o usuário autenticado tem cargo admin.
// Equivale à Security Rule:
//   "root.child('users').child(auth.uid).child('role').val() === 'admin'"
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'PERMISSION_DENIED — /admin-data' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
