/**
 * @typedef {Object} CachePort
 * @property {(key: string) => Promise<string|null>} get
 * @property {(key: string, value: string, ttlSeconds: number) => Promise<void>} set
 * @property {(key: string) => Promise<void>} del
 * @property {(key: string) => Promise<number>} incr
 */
module.exports = {};
