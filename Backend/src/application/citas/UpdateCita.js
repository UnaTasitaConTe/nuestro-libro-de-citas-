const { NotFoundError } = require('../../domain/errors');

function makeUpdateCita({ citaRepository }) {
  async function execute({ citaId, parejaId, data }) {
    const updated = await citaRepository.updateFields(citaId, parejaId, data);
    if (!updated) {
      throw new NotFoundError('Cita no encontrada');
    }
    return citaRepository.getCitaWithEntries(citaId, parejaId);
  }

  return { execute };
}

module.exports = makeUpdateCita;
