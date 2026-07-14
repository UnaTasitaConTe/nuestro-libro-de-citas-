class FakeSessionPort {
  constructor() {
    this.sessions = new Map();
  }

  async create(sessionId, payload) {
    this.sessions.set(sessionId, payload);
  }

  async find(sessionId) {
    return this.sessions.has(sessionId) ? this.sessions.get(sessionId) : null;
  }

  async revoke(sessionId) {
    this.sessions.delete(sessionId);
  }
}

module.exports = FakeSessionPort;
