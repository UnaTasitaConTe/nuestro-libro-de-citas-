const express = require('express');
const { ValidationError } = require('../../../domain/errors');
const { createIdeaSchema, updateIdeaSchema, moveIdeaSchema } = require('../schemas/ideasCitas.schemas');

function createIdeasCitasRouter({ requireAuth, useCases }) {
  const router = express.Router();
  router.use(requireAuth);

  router.post('/', async (req, res) => {
    const parsed = createIdeaSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0].message);

    const idea = await useCases.createIdeaCita.execute({
      parejaId: req.user.parejaId,
      userId: req.user.id,
      data: parsed.data,
    });
    res.status(201).json(idea);
  });

  router.get('/', async (req, res) => {
    const ideas = await useCases.listIdeasCitas.execute({ parejaId: req.user.parejaId });
    res.json(ideas);
  });

  router.patch('/:id', async (req, res) => {
    const parsed = updateIdeaSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0].message);

    const idea = await useCases.updateIdeaCita.execute({
      id: Number(req.params.id),
      parejaId: req.user.parejaId,
      data: parsed.data,
    });
    res.json(idea);
  });

  router.patch('/:id/mover', async (req, res) => {
    const parsed = moveIdeaSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0].message);

    const ideas = await useCases.moveIdeaCita.execute({
      id: Number(req.params.id),
      parejaId: req.user.parejaId,
      estado: parsed.data.estado,
      orderedIds: parsed.data.orderedIds,
    });
    res.json(ideas);
  });

  router.delete('/:id', async (req, res) => {
    await useCases.deleteIdeaCita.execute({
      id: Number(req.params.id),
      parejaId: req.user.parejaId,
    });
    res.status(204).send();
  });

  return router;
}

module.exports = createIdeasCitasRouter;
