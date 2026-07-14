class RedisCacheAdapter {
  constructor(redis) {
    this.redis = redis;
  }

  async get(key) {
    return this.redis.get(key);
  }

  async set(key, value, ttlSeconds) {
    await this.redis.set(key, value, 'EX', ttlSeconds);
  }

  async del(key) {
    await this.redis.del(key);
  }

  async incr(key) {
    return this.redis.incr(key);
  }
}

module.exports = RedisCacheAdapter;
