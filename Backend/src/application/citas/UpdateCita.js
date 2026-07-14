const { NotFoundError } = require('../../domain/errors');
const { citasVersionKey } = require('../shared/cacheKeys');

function makeUpdateCita({ citaRepository, cachePort }) {
  async function execute({ citaId, parejaId, data }) {
    const updated = await citaRepository.updateFields(citaId, parejaId, data);
    if (!updated) {
      throw new NotFoundError('Cita no encontrada');
    }
    await cachePort.incr(citasVersionKey(parejaId));
    return citaRepository.getCitaWithEntries(citaId, parejaId);
  }

  return { execute };
}

module.exports = makeUpdateCita;
