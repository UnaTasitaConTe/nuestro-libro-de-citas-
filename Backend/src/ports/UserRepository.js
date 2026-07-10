/**
 * @typedef {Object} UserRepository
 * @property {(email: string) => Promise<object|null>} findByEmail Incluye password_hash.
 * @property {(data: {parejaId: number, email: string, passwordHash: string, name: string}) => Promise<object>} create
 * @property {(parejaId: number) => Promise<number>} countByPareja
 * @property {(parejaId: number) => Promise<object[]>} findMembersByPareja {id,name,email} ORDER BY id.
 * @property {(parejaId: number, excludeUserId: number) => Promise<string|null>} findPartnerEmail
 */
module.exports = {};
