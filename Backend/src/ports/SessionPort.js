/**
 * @typedef {Object} SessionPort
 * @property {(sessionId: string, payload: object, ttlSeconds: number) => Promise<void>} create
 * @property {(sessionId: string) => Promise<object|null>} find
 * @property {(sessionId: string) => Promise<void>} revoke
 */
module.exports = {};
