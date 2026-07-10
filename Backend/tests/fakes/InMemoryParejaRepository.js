class InMemoryParejaRepository {
  constructor(seed = []) {
    this.rows = [...seed];
    this.nextId = this.rows.length ? Math.max(...this.rows.map((r) => r.id)) + 1 : 1;
  }

  async findByInviteCode(code) {
    const row = this.rows.find((r) => r.invite_code === code);
    return row ? { id: row.id } : null;
  }

  async create({ inviteCode }) {
    const row = { id: this.nextId++, invite_code: inviteCode, created_at: new Date().toISOString() };
    this.rows.push(row);
    return { id: row.id };
  }

  async findById(id) {
    return this.rows.find((r) => r.id === id) || null;
  }

  _snapshot() {
    return { rows: this.rows.map((r) => ({ ...r })), nextId: this.nextId };
  }

  _restore(snapshot) {
    this.rows = snapshot.rows;
    this.nextId = snapshot.nextId;
  }
}

module.exports = InMemoryParejaRepository;
