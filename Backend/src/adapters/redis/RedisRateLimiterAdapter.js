class RedisRateLimiterAdapter {
  constructor(redis) {
    this.redis = redis;
  }

  async consume(key, limit, windowSeconds) {
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
  }
}

module.exports = RedisRateLimiterAdapter;
