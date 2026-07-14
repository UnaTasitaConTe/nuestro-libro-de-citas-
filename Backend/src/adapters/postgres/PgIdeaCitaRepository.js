class PgIdeaCitaRepository {
  constructor(db) {
    this.db = db;
  }

  async listByPareja(parejaId) {
    const { rows } = await this.db.query(
      'SELECT * FROM ideas_citas WHERE pareja_id = $1 ORDER BY estado, orden, id',
      [parejaId]
    );
    return rows;
  }

  async findByIdAndPareja(id, parejaId) {
    const { rows } = await this.db.query(
      'SELECT * FROM ideas_citas WHERE id = $1 AND pareja_id = $2',
      [id, parejaId]
    );
    return rows[0] || null;
  }

  async create({ parejaId, userId, titulo, descripcion, orden }) {
    const { rows } = await this.db.query(
      `INSERT INTO ideas_citas (pareja_id, created_by, titulo, descripcion, orden)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [parejaId, userId, titulo, descripcion ?? null, orden]
    );
    return rows[0];
  }

  async updateFields(id, parejaId, { titulo, descripcion }) {
    const { rows } = await this.db.query(
      `UPDATE ideas_citas SET
         titulo = COALESCE($1, titulo),
         descripcion = COALESCE($2, descripcion),
         updated_at = now()
       WHERE id = $3 AND pareja_id = $4
       RETURNING id`,
      [titulo ?? null, descripcion ?? null, id, parejaId]
    );
    return Boolean(rows[0]);
  }

  async getMaxOrden(parejaId, estado) {
    const { rows } = await this.db.query(
      'SELECT COALESCE(MAX(orden), -1) AS max_orden FROM ideas_citas WHERE pareja_id = $1 AND estado = $2',
      [parejaId, estado]
    );
    return rows[0].max_orden;
  }

  async setEstadoAndReorder({ parejaId, id, estado, orderedIds }) {
    await this.db.query(
      'UPDATE ideas_citas SET estado = $1, updated_at = now() WHERE id = $2 AND pareja_id = $3',
      [estado, id, parejaId]
    );

    for (const [index, orderedId] of orderedIds.entries()) {
      await this.db.query(
        'UPDATE ideas_citas SET orden = $1 WHERE id = $2 AND pareja_id = $3',
        [index, orderedId, parejaId]
      );
    }
  }

  async deleteById(id, parejaId) {
    await this.db.query('DELETE FROM ideas_citas WHERE id = $1 AND pareja_id = $2', [
      id,
      parejaId,
    ]);
  }
}

module.exports = PgIdeaCitaRepository;
