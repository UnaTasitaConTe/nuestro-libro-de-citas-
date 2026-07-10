const { NotFoundError, ValidationError } = require('../../domain/errors');
const CitaEntry = require('../../domain/entities/CitaEntry');

function makeAddFotosToEntrada({ citaRepository, fileStorage }) {
  async function execute({ citaId, parejaId, userId, files }) {
    if (!files?.length) {
      throw new ValidationError('No se recibió ninguna foto');
    }

    const cita = await citaRepository.findByIdAndPareja(citaId, parejaId);
    if (!cita) {
      fileStorage.removeFiles(files);
      throw new NotFoundError('Cita no encontrada');
    }

    const entry = await citaRepository.findEntryByCitaAndUser(citaId, userId);
    if (!entry) {
      fileStorage.removeFiles(files);
      throw new ValidationError('Primero debes crear tu versión de la cita');
    }

    const maxOrden = await citaRepository.getMaxOrden(entry.id);
    let orden = CitaEntry.nextOrden(maxOrden);
    for (const file of files) {
      await citaRepository.addPhoto({
        entryId: entry.id,
        fotoUrl: fileStorage.buildUrl(file.filename),
        orden: orden++,
      });
    }

    return citaRepository.getCitaWithEntries(citaId, parejaId);
  }

  return { execute };
}

module.exports = makeAddFotosToEntrada;
