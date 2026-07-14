const express = require('express');
const { registerSchema, loginSchema } = require('../schemas/auth.schemas');
const { ValidationError } = require('../../../domain/errors');
const { createRateLimiter } = require('../middleware/rateLimiter');

function createAuthRouter({ useCases, requireAuth, rateLimiterPort }) {
  const router = express.Router();

  const registerLimiter = createRateLimiter({
    rateLimiterPort,
    limit: 20,
    windowSeconds: 60 * 60,
    keyFn: (req) => `register:${req.ip}`,
  });

  const loginLimiter = createRateLimiter({
    rateLimiterPort,
    limit: 10,
    windowSeconds: 15 * 60,
    keyFn: (req) => `login:${req.ip}:${req.body?.email || ''}`,
  });

  router.post('/register', registerLimiter, async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0].message);
    }

    const result = await useCases.registerUser.execute(parsed.data);
    res.status(201).json(result);
  });

  router.post('/login', loginLimiter, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0].message);
    }

    const result = await useCases.loginUser.execute(parsed.data);
    res.json(result);
  });

  router.post('/logout', requireAuth, async (req, res) => {
    await useCases.logoutUser.execute({ jti: req.user.jti });
    res.status(204).send();
  });

  return router;
}

module.exports = createAuthRouter;
