class PgUserRepository {
  constructor(db) {
    this.db = db;
  }

  async findByEmail(email) {
    const { rows } = await this.db.query(
      'SELECT id, pareja_id, email, name, password_hash FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  }

  async create({ parejaId, email, passwordHash, name }) {
    const { rows } = await this.db.query(
      'INSERT INTO users (pareja_id, email, password_hash, name) VALUES ($1, $2, $3, $4) RETURNING id, pareja_id, email, name',
      [parejaId, email, passwordHash, name]
    );
    return rows[0];
  }

  async countByPareja(parejaId) {
    const { rows } = await this.db.query(
      'SELECT count(*)::int AS count FROM users WHERE pareja_id = $1',
      [parejaId]
    );
    return rows[0].count;
  }

  async findMembersByPareja(parejaId) {
    const { rows } = await this.db.query(
      'SELECT id, name, email FROM users WHERE pareja_id = $1 ORDER BY id',
      [parejaId]
    );
    return rows;
  }

  async findPartnerEmail(parejaId, excludeUserId) {
    const { rows } = await this.db.query(
      'SELECT email FROM users WHERE pareja_id = $1 AND id != $2',
      [parejaId, excludeUserId]
    );
    return rows[0] ? rows[0].email : null;
  }

  async updateParejaId(userId, parejaId) {
    await this.db.query('UPDATE users SET pareja_id = $1 WHERE id = $2', [parejaId, userId]);
  }
}

module.exports = PgUserRepository;
