/**
 * @typedef {Object} PasswordHasherPort
 * @property {(plain: string) => Promise<string>} hash
 * @property {(plain: string, hash: string) => Promise<boolean>} compare
 */
module.exports = {};
