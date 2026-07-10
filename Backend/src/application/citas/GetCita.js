const { NotFoundError } = require('../../domain/errors');

function makeGetCita({ citaRepository }) {
  async function execute({ citaId, parejaId }) {
    const cita = await citaRepository.getCitaWithEntries(citaId, parejaId);
    if (!cita) {
      throw new NotFoundError('Cita no encontrada');
    }
    return cita;
  }

  return { execute };
}

module.exports = makeGetCita;
