const { NotFoundError } = require('../../domain/errors');

function makeDeleteFoto({ citaRepository, fileStorage }) {
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
    return citaRepository.getCitaWithEntries(citaId, parejaId);
  }

  return { execute };
}

module.exports = makeDeleteFoto;
