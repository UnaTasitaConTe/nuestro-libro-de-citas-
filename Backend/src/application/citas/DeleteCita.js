const { NotFoundError } = require('../../domain/errors');
const Cita = require('../../domain/entities/Cita');

function makeDeleteCita({ citaRepository, fileStorage }) {
  async function execute({ citaId, parejaId }) {
    const cita = await citaRepository.findByIdAndPareja(citaId, parejaId);
    if (!cita) {
      throw new NotFoundError('Cita no encontrada');
    }

    const entryIds = await citaRepository.findEntryIdsByCita(citaId);
    Cita.assertDeletable(entryIds.length);

    const photoUrls = await citaRepository.findPhotoUrlsByEntryIds(entryIds);
    await citaRepository.deleteById(citaId, parejaId);
    photoUrls.forEach((url) => fileStorage.removeStoredFile(url));
  }

  return { execute };
}

module.exports = makeDeleteCita;
