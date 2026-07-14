class FakeRateLimiterPort {
  constructor() {
    this.counters = new Map();
  }

  async consume(key, limit) {
    const count = (this.counters.get(key) || 0) + 1;
    this.counters.set(key, count);
    return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
  }
}

module.exports = FakeRateLimiterPort;
