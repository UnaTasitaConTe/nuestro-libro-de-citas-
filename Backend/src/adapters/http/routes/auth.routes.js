const express = require('express');
const { registerSchema, loginSchema } = require('../schemas/auth.schemas');
const { ValidationError } = require('../../../domain/errors');

function createAuthRouter({ useCases }) {
  const router = express.Router();

  router.post('/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0].message);
    }

    const result = await useCases.registerUser.execute(parsed.data);
    res.status(201).json(result);
  });

  router.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0].message);
    }

    const result = await useCases.loginUser.execute(parsed.data);
    res.json(result);
  });

  return router;
}

module.exports = createAuthRouter;
