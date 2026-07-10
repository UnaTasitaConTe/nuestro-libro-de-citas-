/**
 * @typedef {Object} FileStoragePort
 * @property {(filename: string) => string} buildUrl `/uploads/${filename}`.
 * @property {(files: {path: string}[]) => void} removeFiles Best-effort, no lanza.
 * @property {(fileUrl: string) => void} removeStoredFile Best-effort, no lanza.
 */
module.exports = {};
