/**
 * @typedef {Object} RateLimiterPort
 * @property {(key: string, limit: number, windowSeconds: number) => Promise<{allowed: boolean, remaining: number}>} consume
 */
module.exports = {};
