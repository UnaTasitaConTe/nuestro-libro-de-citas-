/**
 * @typedef {Object} UnitOfWork
 * @property {(fn: (repos: {citaRepository: import('./CitaRepository').CitaRepository, userRepository: import('./UserRepository').UserRepository, parejaRepository: import('./ParejaRepository').ParejaRepository}) => Promise<any>) => Promise<any>} withTransaction
 * Ejecuta fn dentro de BEGIN/COMMIT; hace ROLLBACK y relanza el error si fn falla.
 * Los repos recibidos están atados al mismo client de la transacción.
 */
module.exports = {};
