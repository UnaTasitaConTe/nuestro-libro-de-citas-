class PgCitaRepository {
  constructor(db) {
    this.db = db;
  }

  async countByPareja(parejaId) {
    const { rows } = await this.db.query(
      'SELECT count(*)::int AS total FROM citas WHERE pareja_id = $1',
      [parejaId]
    );
    return rows[0].total;
  }

  async findPageByPareja(parejaId, { limit, offset }) {
    const { rows } = await this.db.query(
      'SELECT * FROM citas WHERE pareja_id = $1 ORDER BY fecha DESC LIMIT $2 OFFSET $3',
      [parejaId, limit, offset]
    );
    return rows;
  }

  async findEntriesWithUserByCitaIds(citaIds) {
    if (!citaIds.length) return [];
    const { rows } = await this.db.query(
      `SELECT e.*, u.name AS user_name
       FROM cita_entries e
       JOIN users u ON u.id = e.user_id
       WHERE e.cita_id = ANY($1::int[])`,
      [citaIds]
    );
    return rows;
  }

  async findPhotosByCitaIds(citaIds) {
    if (!citaIds.length) return [];
    const { rows } = await this.db.query(
      `SELECT p.* FROM entry_photos p
       JOIN cita_entries e ON e.id = p.entry_id
       WHERE e.cita_id = ANY($1::int[])
       ORDER BY p.orden, p.id`,
      [citaIds]
    );
    return rows;
  }

  async listWithEntries(parejaId, { limit, offset }) {
    const total = await this.countByPareja(parejaId);
    const citas = await this.findPageByPareja(parejaId, { limit, offset });

    const citaIds = citas.map((c) => c.id);
    const entries = await this.findEntriesWithUserByCitaIds(citaIds);
    const photos = await this.findPhotosByCitaIds(citaIds);

    const photosByEntry = new Map();
    for (const photo of photos) {
      if (!photosByEntry.has(photo.entry_id)) photosByEntry.set(photo.entry_id, []);
      photosByEntry.get(photo.entry_id).push(photo);
    }

    const entriesByCita = new Map();
    for (const entry of entries) {
      if (!entriesByCita.has(entry.cita_id)) entriesByCita.set(entry.cita_id, []);
      entriesByCita
        .get(entry.cita_id)
        .push({ ...entry, photos: photosByEntry.get(entry.id) || [] });
    }

    return {
      citas: citas.map((c) => ({ ...c, entries: entriesByCita.get(c.id) || [] })),
      total,
    };
  }

  async findByIdAndPareja(citaId, parejaId) {
    const { rows } = await this.db.query(
      'SELECT * FROM citas WHERE id = $1 AND pareja_id = $2',
      [citaId, parejaId]
    );
    return rows[0] || null;
  }

  async getCitaWithEntries(citaId, parejaId) {
    const cita = await this.findByIdAndPareja(citaId, parejaId);
    if (!cita) return null;

    const entries = await this.findEntriesWithUserByCitaIds([citaId]);
    const photos = await this.findPhotosByCitaIds([citaId]);

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

  async create({ parejaId, nombre, fecha, lugar, repetiriamos }) {
    const { rows } = await this.db.query(
      'INSERT INTO citas (pareja_id, nombre, fecha, lugar, repetiriamos) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [parejaId, nombre, fecha, lugar, repetiriamos]
    );
    return rows[0];
  }

  async createEntry({
    citaId,
    userId,
    valoracion,
    queHicimos,
    comoTeSentiste,
    loQueMasGusto,
    loQueMenosGusto,
  }) {
    const { rows } = await this.db.query(
      `INSERT INTO cita_entries
        (cita_id, user_id, valoracion, que_hicimos, como_te_sentiste, lo_que_mas_gusto, lo_que_menos_gusto)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        citaId,
        userId,
        valoracion,
        queHicimos ?? null,
        comoTeSentiste ?? null,
        loQueMasGusto ?? null,
        loQueMenosGusto ?? null,
      ]
    );
    return rows[0];
  }

  async addPhoto({ entryId, fotoUrl, orden }) {
    await this.db.query(
      'INSERT INTO entry_photos (entry_id, foto_url, orden) VALUES ($1, $2, $3)',
      [entryId, fotoUrl, orden]
    );
  }

  async updateFields(citaId, parejaId, { fecha, lugar, repetiriamos }) {
    const { rows } = await this.db.query(
      `UPDATE citas SET
         fecha = COALESCE($1, fecha),
         lugar = COALESCE($2, lugar),
         repetiriamos = COALESCE($3, repetiriamos)
       WHERE id = $4 AND pareja_id = $5
       RETURNING id`,
      [fecha ?? null, lugar ?? null, repetiriamos ?? null, citaId, parejaId]
    );
    return Boolean(rows[0]);
  }

  async upsertEntry({
    citaId,
    userId,
    valoracion,
    queHicimos,
    comoTeSentiste,
    loQueMasGusto,
    loQueMenosGusto,
  }) {
    const { rows } = await this.db.query(
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
        userId,
        valoracion,
        queHicimos ?? null,
        comoTeSentiste ?? null,
        loQueMasGusto ?? null,
        loQueMenosGusto ?? null,
      ]
    );
    return rows[0];
  }

  async findEntryByCitaAndUser(citaId, userId) {
    const { rows } = await this.db.query(
      'SELECT id FROM cita_entries WHERE cita_id = $1 AND user_id = $2',
      [citaId, userId]
    );
    return rows[0] || null;
  }

  async getMaxOrden(entryId) {
    const { rows } = await this.db.query(
      'SELECT COALESCE(MAX(orden), -1) AS max_orden FROM entry_photos WHERE entry_id = $1',
      [entryId]
    );
    return rows[0].max_orden;
  }

  async deletePhoto(fotoId, citaId) {
    const { rows } = await this.db.query(
      `DELETE FROM entry_photos p
       USING cita_entries e
       WHERE p.id = $1 AND p.entry_id = e.id AND e.cita_id = $2
       RETURNING p.foto_url`,
      [fotoId, citaId]
    );
    return rows[0] ? rows[0].foto_url : null;
  }

  async findEntryIdsByCita(citaId) {
    const { rows } = await this.db.query('SELECT id FROM cita_entries WHERE cita_id = $1', [
      citaId,
    ]);
    return rows.map((r) => r.id);
  }

  async findPhotoUrlsByEntryIds(entryIds) {
    const { rows } = await this.db.query(
      'SELECT foto_url FROM entry_photos WHERE entry_id = ANY($1::int[])',
      [entryIds]
    );
    return rows.map((r) => r.foto_url);
  }

  async deleteById(citaId, parejaId) {
    await this.db.query('DELETE FROM citas WHERE id = $1 AND pareja_id = $2', [
      citaId,
      parejaId,
    ]);
  }
}

module.exports = PgCitaRepository;
