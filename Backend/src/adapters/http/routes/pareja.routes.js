const express = require('express');

function createParejaRouter({ requireAuth, useCases }) {
  const router = express.Router();
  router.use(requireAuth);

  router.get('/me', async (req, res) => {
    const result = await useCases.getPareja.execute({ parejaId: req.user.parejaId });
    res.json(result);
  });

  return router;
}

module.exports = createParejaRouter;
