/**
 * @typedef {Object} ParejaRepository
 * @property {(code: string) => Promise<object|null>} findByInviteCode
 * @property {(data: {inviteCode: string}) => Promise<object>} create
 * @property {(id: number) => Promise<object|null>} findById id, invite_code, created_at.
 */
module.exports = {};
