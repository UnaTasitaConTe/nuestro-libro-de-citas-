class InMemoryUserRepository {
  constructor(seed = []) {
    this.rows = [...seed];
    this.nextId = this.rows.length ? Math.max(...this.rows.map((r) => r.id)) + 1 : 1;
  }

  async findByEmail(email) {
    return this.rows.find((r) => r.email === email) || null;
  }

  async create({ parejaId, email, passwordHash, name }) {
    const row = { id: this.nextId++, pareja_id: parejaId, email, password_hash: passwordHash, name };
    this.rows.push(row);
    return { id: row.id, pareja_id: row.pareja_id, email: row.email, name: row.name };
  }

  async countByPareja(parejaId) {
    return this.rows.filter((r) => r.pareja_id === parejaId).length;
  }

  async findMembersByPareja(parejaId) {
    return this.rows
      .filter((r) => r.pareja_id === parejaId)
      .sort((a, b) => a.id - b.id)
      .map((r) => ({ id: r.id, name: r.name, email: r.email }));
  }

  async findPartnerEmail(parejaId, excludeUserId) {
    const partner = this.rows.find((r) => r.pareja_id === parejaId && r.id !== excludeUserId);
    return partner ? partner.email : null;
  }

  _snapshot() {
    return { rows: this.rows.map((r) => ({ ...r })), nextId: this.nextId };
  }

  _restore(snapshot) {
    this.rows = snapshot.rows;
    this.nextId = snapshot.nextId;
  }
}

module.exports = InMemoryUserRepository;
