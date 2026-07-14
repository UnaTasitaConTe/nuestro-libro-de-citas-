const { UnauthorizedError } = require('../../../domain/errors');

function makeAuthMiddleware({ tokenService, sessionPort }) {
  async function authenticate(token) {
    let payload;
    try {
      payload = tokenService.verify(token);
    } catch {
      throw new UnauthorizedError('Token inválido o expirado');
    }

    const session = await sessionPort.find(payload.jti);
    if (!session) {
      throw new UnauthorizedError('Sesión inválida o cerrada');
    }

    return payload;
  }

  async function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    try {
      req.user = await authenticate(header.slice('Bearer '.length));
      next();
    } catch {
      res.status(401).json({ error: 'Token inválido o expirado' });
    }
  }

  return { requireAuth, authenticate };
}

module.exports = { makeAuthMiddleware };
