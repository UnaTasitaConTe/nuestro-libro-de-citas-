const express = require('express');
const { ValidationError } = require('../../../domain/errors');
const { MAX_FOTOS, createCitaSchema, updateCitaSchema } = require('../schemas/citas.schemas');
const upload = require('../middleware/upload');

function createCitasRouter({ requireAuth, useCases, fileStorage }) {
  const router = express.Router();
  router.use(requireAuth);

  router.post('/', upload.array('fotos', MAX_FOTOS), async (req, res) => {
    const parsed = createCitaSchema.safeParse(req.body);
    if (!parsed.success) {
      fileStorage.removeFiles(req.files);
      throw new ValidationError(parsed.error.issues[0].message);
    }

    const { cita, notifyPartner } = await useCases.createCita.execute({
      parejaId: req.user.parejaId,
      userId: req.user.id,
      userName: req.user.name,
      data: parsed.data,
      files: req.files,
    });
    res.status(201).json(cita);
    notifyPartner().catch(() => {});
  });

  router.get('/', async (req, res) => {
    const result = await useCases.listCitas.execute({
      parejaId: req.user.parejaId,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  });

  router.get('/:id', async (req, res) => {
    const cita = await useCases.getCita.execute({
      citaId: Number(req.params.id),
      parejaId: req.user.parejaId,
    });
    res.json(cita);
  });

  router.patch('/:id', async (req, res) => {
    const parsed = updateCitaSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0].message);
    }

    const cita = await useCases.updateCita.execute({
      citaId: Number(req.params.id),
      parejaId: req.user.parejaId,
      data: parsed.data,
    });
    res.json(cita);
  });

  router.put('/:id/mi-entrada', upload.array('fotos', MAX_FOTOS), async (req, res) => {
    const { cita, notifyPartner } = await useCases.upsertMiEntrada.execute({
      citaId: Number(req.params.id),
      parejaId: req.user.parejaId,
      userId: req.user.id,
      userName: req.user.name,
      rawBody: req.body,
      files: req.files,
    });
    res.json(cita);
    notifyPartner().catch(() => {});
  });

  router.post('/:id/mi-entrada/fotos', upload.array('fotos', MAX_FOTOS), async (req, res) => {
    const cita = await useCases.addFotosToEntrada.execute({
      citaId: Number(req.params.id),
      parejaId: req.user.parejaId,
      userId: req.user.id,
      files: req.files,
    });
    res.json(cita);
  });

  router.delete('/:id/fotos/:fotoId', async (req, res) => {
    const cita = await useCases.deleteFoto.execute({
      citaId: Number(req.params.id),
      fotoId: Number(req.params.fotoId),
      parejaId: req.user.parejaId,
    });
    res.json(cita);
  });

  router.delete('/:id', async (req, res) => {
    await useCases.deleteCita.execute({
      citaId: Number(req.params.id),
      parejaId: req.user.parejaId,
    });
    res.status(204).send();
  });

  return router;
}

module.exports = createCitasRouter;
