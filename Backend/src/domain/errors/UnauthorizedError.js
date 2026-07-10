const DomainError = require('./DomainError');

class UnauthorizedError extends DomainError {}

module.exports = UnauthorizedError;
