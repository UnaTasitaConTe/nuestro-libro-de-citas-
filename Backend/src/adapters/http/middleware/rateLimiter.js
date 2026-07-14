function createRateLimiter({ rateLimiterPort, limit, windowSeconds, keyFn }) {
  return async function rateLimiter(req, res, next) {
    const key = `ratelimit:${keyFn(req)}`;
    const { allowed } = await rateLimiterPort.consume(key, limit, windowSeconds);
    if (!allowed) {
      return res.status(429).json({ error: 'Demasiados intentos, probá de nuevo en unos minutos' });
    }
    next();
  };
}

module.exports = { createRateLimiter };
