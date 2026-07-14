/**
 * @typedef {Object} PubSubPort
 * @property {(channel: string, message: string) => Promise<void>} publish
 * @property {(channel: string, handler: (message: string) => void) => void} subscribe
 */
module.exports = {};
