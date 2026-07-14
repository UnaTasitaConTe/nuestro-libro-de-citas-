const PgCitaRepository = require('./PgCitaRepository');
const PgUserRepository = require('./PgUserRepository');
const PgParejaRepository = require('./PgParejaRepository');
const PgIdeaCitaRepository = require('./PgIdeaCitaRepository');

class PgUnitOfWork {
  constructor(pool) {
    this.pool = pool;
  }

  async withTransaction(fn) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn({
        citaRepository: new PgCitaRepository(client),
        userRepository: new PgUserRepository(client),
        parejaRepository: new PgParejaRepository(client),
        ideaCitaRepository: new PgIdeaCitaRepository(client),
      });
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = PgUnitOfWork;
