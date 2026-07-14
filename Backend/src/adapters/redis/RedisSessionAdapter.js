function key(sessionId) {
  return `session:${sessionId}`;
}

class RedisSessionAdapter {
  constructor(redis) {
    this.redis = redis;
  }

  async create(sessionId, payload, ttlSeconds) {
    await this.redis.set(key(sessionId), JSON.stringify(payload), 'EX', ttlSeconds);
  }

  async find(sessionId) {
    const raw = await this.redis.get(key(sessionId));
    return raw ? JSON.parse(raw) : null;
  }

  async revoke(sessionId) {
    await this.redis.del(key(sessionId));
  }
}

module.exports = RedisSessionAdapter;
