class PgParejaRepository {
  constructor(db) {
    this.db = db;
  }

  async findByInviteCode(code) {
    const { rows } = await this.db.query('SELECT id FROM parejas WHERE invite_code = $1', [
      code,
    ]);
    return rows[0] || null;
  }

  async create({ inviteCode }) {
    const { rows } = await this.db.query(
      'INSERT INTO parejas (invite_code) VALUES ($1) RETURNING id',
      [inviteCode]
    );
    return rows[0];
  }

  async findById(id) {
    const { rows } = await this.db.query(
      'SELECT id, invite_code, created_at FROM parejas WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = PgParejaRepository;
