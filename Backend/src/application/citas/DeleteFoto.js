const { NotFoundError } = require('../../domain/errors');
const { citasVersionKey } = require('../shared/cacheKeys');

function makeDeleteFoto({ citaRepository, fileStorage, cachePort }) {
  async function execute({ citaId, fotoId, parejaId }) {
    const cita = await citaRepository.findByIdAndPareja(citaId, parejaId);
    if (!cita) {
      throw new NotFoundError('Cita no encontrada');
    }

    const fotoUrl = await citaRepository.deletePhoto(fotoId, citaId);
    if (!fotoUrl) {
      throw new NotFoundError('Foto no encontrada');
    }

    fileStorage.removeStoredFile(fotoUrl);
    await cachePort.incr(citasVersionKey(parejaId));
    return citaRepository.getCitaWithEntries(citaId, parejaId);
  }

  return { execute };
}

module.exports = makeDeleteFoto;
