const crypto = require('crypto');

function generateInviteCode() {
  return crypto.randomBytes(5).toString('base64url');
}

module.exports = { generateInviteCode };
