/**
 * @typedef {Object} TokenPort
 * @property {(payload: object) => string} sign
 * @property {(token: string) => object} verify Lanza si el token es inválido o expiró.
 */
module.exports = {};
