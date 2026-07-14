class FakeCachePort {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  async set(key, value) {
    this.store.set(key, value);
  }

  async del(key) {
    this.store.delete(key);
  }

  async incr(key) {
    const next = (Number(this.store.get(key)) || 0) + 1;
    this.store.set(key, String(next));
    return next;
  }
}

module.exports = FakeCachePort;
