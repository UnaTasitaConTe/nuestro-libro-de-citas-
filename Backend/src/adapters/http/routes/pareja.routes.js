const express = require('express');
const { joinParejaSchema } = require('../schemas/pareja.schemas');
const { ValidationError } = require('../../../domain/errors');

function createParejaRouter({ requireAuth, useCases }) {
  const router = express.Router();
  router.use(requireAuth);

  router.get('/me', async (req, res) => {
    const result = await useCases.getPareja.execute({ parejaId: req.user.parejaId });
    res.json(result);
  });

  router.post('/unirme', async (req, res) => {
    const parsed = joinParejaSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0].message);
    }

    const result = await useCases.joinPareja.execute({
      user: req.user,
      inviteCode: parsed.data.inviteCode,
    });
    res.json(result);
  });

  return router;
}

module.exports = createParejaRouter;
