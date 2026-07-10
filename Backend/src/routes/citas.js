const express = require('express');
const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { sendEntryNotification } = require('../mailer');

const router = express.Router();

const REPETIRIAMOS_VALUES = ['SI', 'TALVEZ', 'NO'];
const MAX_FOTOS = 6;

const entryBodySchema = z.object({
  valoracion: z.coerce.number().int().min(1).max(5),
  queHicimos: z.string().optional(),
  comoTeSentiste: z.string().optional(),
  loQueMasGusto: z.string().optional(),
  loQueMenosGusto: z.string().optional(),
});

const citaFieldsSchema = z.object({
  nombre: z.string().min(1),
  fecha: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha inválida'),
  lugar: z.string().min(1),
  repetiriamos: z.enum(REPETIRIAMOS_VALUES),
});

const createCitaSchema = entryBodySchema.merge(citaFieldsSchema);

const updateCitaSchema = z.object({
  fecha: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha inválida').optional(),
  lugar: z.string().min(1).optional(),
  repetiriamos: z.enum(REPETIRIAMOS_VALUES).optional(),
});

router.use(requireAuth);

function removeUploadedFiles(files) {
  (files || []).forEach((f) => fs.unlink(f.path, () => {}));
}

function removeStoredPhoto(fotoUrl) {
  if (!fotoUrl) return;
  const oldPath = path.join(__dirname, '..', '..', fotoUrl);
  fs.unlink(oldPath, () => {});
}

async function fetchCitaWithEntries(citaId, parejaId) {
  const { rows: citaRows } = await pool.query(
    'SELECT * FROM citas WHERE id = $1 AND pareja_id = $2',
    [citaId, parejaId]
  );
  const cita = citaRows[0];
  if (!cita) return null;

  const { rows: entries } = await pool.query(
    `SELECT e.*, u.name AS user_name
     FROM cita_entries e
     JOIN users u ON u.id = e.user_id
     WHERE e.cita_id = $1
     ORDER BY e.user_id`,
    [citaId]
  );

  const { rows: photos } = await pool.query(
    `SELECT p.* FROM entry_photos p
     JOIN cita_entries e ON e.id = p.entry_id
     WHERE e.cita_id = $1
     ORDER BY p.orden, p.id`,
    [citaId]
  );

  const photosByEntry = new Map();
  for (const photo of photos) {
    if (!photosByEntry.has(photo.entry_id)) photosByEntry.set(photo.entry_id, []);
    photosByEntry.get(photo.entry_id).push(photo);
  }

  return {
    ...cita,
    entries: entries.map((e) => ({ ...e, photos: photosByEntry.get(e.id) || [] })),
  };
}

async function notifyPartner(parejaId, authorUserId, authorName, citaNombre, citaId) {
  const { rows } = await pool.query(
    'SELECT email FROM users WHERE pareja_id = $1 AND id != $2',
    [parejaId, authorUserId]
  );
  const partner = rows[0];
  if (!partner) return;

  await sendEntryNotification({
    to: partner.email,
    authorName,
    citaNombre,
    citaId,
  });
}

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const offset = (page - 1) * limit;

  const { rows: countRows } = await pool.query(
    'SELECT count(*)::int AS total FROM citas WHERE pareja_id = $1',
    [req.user.parejaId]
  );
  const total = countRows[0].total;

  const { rows: citas } = await pool.query(
    'SELECT * FROM citas WHERE pareja_id = $1 ORDER BY fecha DESC LIMIT $2 OFFSET $3',
    [req.user.parejaId, limit, offset]
  );

  const citaIds = citas.map((c) => c.id);
  let entries = [];
  let photos = [];
  if (citaIds.length) {
    ({ rows: entries } = await pool.query(
      `SELECT e.*, u.name AS user_name
       FROM cita_entries e
       JOIN users u ON u.id = e.user_id
       WHERE e.cita_id = ANY($1::int[])`,
      [citaIds]
    ));
    ({ rows: photos } = await pool.query(
      `SELECT p.* FROM entry_photos p
       JOIN cita_entries e ON e.id = p.entry_id
       WHERE e.cita_id = ANY($1::int[])
       ORDER BY p.orden, p.id`,
      [citaIds]
    ));
  }

  const photosByEntry = new Map();
  for (const photo of photos) {
    if (!photosByEntry.has(photo.entry_id)) photosByEntry.set(photo.entry_id, []);
    photosByEntry.get(photo.entry_id).push(photo);
  }

  const entriesByCita = new Map();
  for (const entry of entries) {
    if (!entriesByCita.has(entry.cita_id)) entriesByCita.set(entry.cita_id, []);
    entriesByCita.get(entry.cita_id).push({ ...entry, photos: photosByEntry.get(entry.id) || [] });
  }

  res.json({
    citas: citas.map((c) => ({ ...c, entries: entriesByCita.get(c.id) || [] })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

router.get('/:id', async (req, res) => {
  const cita = await fetchCitaWithEntries(Number(req.params.id), req.user.parejaId);
  if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
  res.json(cita);
});

router.post('/', upload.array('fotos', MAX_FOTOS), async (req, res) => {
  const parsed = createCitaSchema.safeParse(req.body);
  if (!parsed.success) {
    removeUploadedFiles(req.files);
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const data = parsed.data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: citaRows } = await client.query(
      'INSERT INTO citas (pareja_id, nombre, fecha, lugar, repetiriamos) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.parejaId, data.nombre, data.fecha, data.lugar, data.repetiriamos]
    );
    const cita = citaRows[0];

    const { rows: entryRows } = await client.query(
      `INSERT INTO cita_entries
        (cita_id, user_id, valoracion, que_hicimos, como_te_sentiste, lo_que_mas_gusto, lo_que_menos_gusto)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        cita.id,
        req.user.id,
        data.valoracion,
        data.queHicimos ?? null,
        data.comoTeSentiste ?? null,
        data.loQueMasGusto ?? null,
        data.loQueMenosGusto ?? null,
      ]
    );
    const entryId = entryRows[0].id;

    for (const [i, file] of (req.files || []).entries()) {
      await client.query(
        'INSERT INTO entry_photos (entry_id, foto_url, orden) VALUES ($1, $2, $3)',
        [entryId, `/uploads/${file.filename}`, i]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(await fetchCitaWithEntries(cita.id, req.user.parejaId));
    notifyPartner(req.user.parejaId, req.user.id, req.user.name, data.nombre, cita.id).catch(() => {});
  } catch (err) {
    await client.query('ROLLBACK');
    removeUploadedFiles(req.files);
    throw err;
  } finally {
    client.release();
  }
});

router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const parsed = updateCitaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const data = parsed.data;

  const { rows } = await pool.query(
    `UPDATE citas SET
       fecha = COALESCE($1, fecha),
       lugar = COALESCE($2, lugar),
       repetiriamos = COALESCE($3, repetiriamos)
     WHERE id = $4 AND pareja_id = $5
     RETURNING id`,
    [data.fecha ?? null, data.lugar ?? null, data.repetiriamos ?? null, id, req.user.parejaId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Cita no encontrada' });

  res.json(await fetchCitaWithEntries(id, req.user.parejaId));
});

router.put('/:id/mi-entrada', upload.array('fotos', MAX_FOTOS), async (req, res) => {
  const citaId = Number(req.params.id);
  const { rows: citaRows } = await pool.query(
    'SELECT id, nombre FROM citas WHERE id = $1 AND pareja_id = $2',
    [citaId, req.user.parejaId]
  );
  const cita = citaRows[0];
  if (!cita) {
    removeUploadedFiles(req.files);
    return res.status(404).json({ error: 'Cita no encontrada' });
  }

  const parsed = entryBodySchema.safeParse(req.body);
  if (!parsed.success) {
    removeUploadedFiles(req.files);
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const data = parsed.data;

  const { rows: upsertRows } = await pool.query(
    `INSERT INTO cita_entries
      (cita_id, user_id, valoracion, que_hicimos, como_te_sentiste, lo_que_mas_gusto, lo_que_menos_gusto)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (cita_id, user_id) DO UPDATE SET
       valoracion = EXCLUDED.valoracion,
       que_hicimos = EXCLUDED.que_hicimos,
       como_te_sentiste = EXCLUDED.como_te_sentiste,
       lo_que_mas_gusto = EXCLUDED.lo_que_mas_gusto,
       lo_que_menos_gusto = EXCLUDED.lo_que_menos_gusto,
       updated_at = now()
     RETURNING id`,
    [
      citaId,
      req.user.id,
      data.valoracion,
      data.queHicimos ?? null,
      data.comoTeSentiste ?? null,
      data.loQueMasGusto ?? null,
      data.loQueMenosGusto ?? null,
    ]
  );
  const entryId = upsertRows[0].id;

  if (req.files?.length) {
    const { rows: maxOrdenRows } = await pool.query(
      'SELECT COALESCE(MAX(orden), -1) AS max_orden FROM entry_photos WHERE entry_id = $1',
      [entryId]
    );
    let orden = maxOrdenRows[0].max_orden + 1;
    for (const file of req.files) {
      await pool.query('INSERT INTO entry_photos (entry_id, foto_url, orden) VALUES ($1, $2, $3)', [
        entryId,
        `/uploads/${file.filename}`,
        orden++,
      ]);
    }
  }

  res.json(await fetchCitaWithEntries(citaId, req.user.parejaId));
  notifyPartner(req.user.parejaId, req.user.id, req.user.name, cita.nombre, citaId).catch(() => {});
});

router.post('/:id/mi-entrada/fotos', upload.array('fotos', MAX_FOTOS), async (req, res) => {
  const citaId = Number(req.params.id);

  if (!req.files?.length) {
    return res.status(400).json({ error: 'No se recibió ninguna foto' });
  }

  const { rows: citaRows } = await pool.query(
    'SELECT id FROM citas WHERE id = $1 AND pareja_id = $2',
    [citaId, req.user.parejaId]
  );
  if (!citaRows[0]) {
    removeUploadedFiles(req.files);
    return res.status(404).json({ error: 'Cita no encontrada' });
  }

  const { rows: entryRows } = await pool.query(
    'SELECT id FROM cita_entries WHERE cita_id = $1 AND user_id = $2',
    [citaId, req.user.id]
  );
  const entry = entryRows[0];
  if (!entry) {
    removeUploadedFiles(req.files);
    return res.status(400).json({ error: 'Primero debes crear tu versión de la cita' });
  }

  const { rows: maxOrdenRows } = await pool.query(
    'SELECT COALESCE(MAX(orden), -1) AS max_orden FROM entry_photos WHERE entry_id = $1',
    [entry.id]
  );
  let orden = maxOrdenRows[0].max_orden + 1;
  for (const file of req.files) {
    await pool.query('INSERT INTO entry_photos (entry_id, foto_url, orden) VALUES ($1, $2, $3)', [
      entry.id,
      `/uploads/${file.filename}`,
      orden++,
    ]);
  }

  res.json(await fetchCitaWithEntries(citaId, req.user.parejaId));
});

router.delete('/:id/fotos/:fotoId', async (req, res) => {
  const citaId = Number(req.params.id);
  const fotoId = Number(req.params.fotoId);

  const { rows: citaRows } = await pool.query(
    'SELECT id FROM citas WHERE id = $1 AND pareja_id = $2',
    [citaId, req.user.parejaId]
  );
  if (!citaRows[0]) return res.status(404).json({ error: 'Cita no encontrada' });

  const { rows: photoRows } = await pool.query(
    `DELETE FROM entry_photos p
     USING cita_entries e
     WHERE p.id = $1 AND p.entry_id = e.id AND e.cita_id = $2
     RETURNING p.foto_url`,
    [fotoId, citaId]
  );
  if (!photoRows[0]) return res.status(404).json({ error: 'Foto no encontrada' });

  removeStoredPhoto(photoRows[0].foto_url);

  res.json(await fetchCitaWithEntries(citaId, req.user.parejaId));
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rows: citaRows } = await pool.query(
    'SELECT id FROM citas WHERE id = $1 AND pareja_id = $2',
    [id, req.user.parejaId]
  );
  if (!citaRows[0]) return res.status(404).json({ error: 'Cita no encontrada' });

  const { rows: entries } = await pool.query(
    'SELECT id FROM cita_entries WHERE cita_id = $1',
    [id]
  );

  if (entries.length >= 2) {
    return res
      .status(400)
      .json({ error: 'No se puede borrar una cita cuando ambas versiones ya fueron contadas' });
  }

  const { rows: photos } = await pool.query(
    `SELECT foto_url FROM entry_photos WHERE entry_id = ANY($1::int[])`,
    [entries.map((e) => e.id)]
  );

  await pool.query('DELETE FROM citas WHERE id = $1 AND pareja_id = $2', [id, req.user.parejaId]);

  photos.forEach((p) => removeStoredPhoto(p.foto_url));
  res.status(204).send();
});

module.exports = router;
