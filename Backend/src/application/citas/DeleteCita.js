const { NotFoundError, ForbiddenError } = require('../../domain/errors');
const { citasVersionKey } = require('../shared/cacheKeys');

function makeDeleteCita({ citaRepository, fileStorage, cachePort }) {
  async function execute({ citaId, parejaId, role }) {
    if (role !== 'ADMIN') {
      throw new ForbiddenError('Solo un administrador puede borrar citas');
    }

    const cita = await citaRepository.findByIdAndPareja(citaId, parejaId);
    if (!cita) {
      throw new NotFoundError('Cita no encontrada');
    }

    const entryIds = await citaRepository.findEntryIdsByCita(citaId);
    const photoUrls = await citaRepository.findPhotoUrlsByEntryIds(entryIds);
    await citaRepository.deleteById(citaId, parejaId);
    await cachePort.incr(citasVersionKey(parejaId));
    photoUrls.forEach((url) => fileStorage.removeStoredFile(url));
  }

  return { execute };
}

module.exports = makeDeleteCita;
