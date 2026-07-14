const { NotFoundError, ValidationError } = require('../../domain/errors');
const CitaEntry = require('../../domain/entities/CitaEntry');
const notifyPartner = require('./notifyPartner');
const { citasVersionKey } = require('../shared/cacheKeys');

// entryBodySchema se recibe inyectado (en vez de validarse en el router) porque el
// orden original de validaciones es: 1) existe la cita (404) 2) valida el body (400).
// Validar en el router antes de invocar el caso de uso cambiaría el status code en el
// caso borde "cita no existe + body inválido".
function makeUpsertMiEntrada({ citaRepository, fileStorage, userRepository, notificationPort, entryBodySchema, cachePort }) {
  async function execute({ citaId, parejaId, userId, userName, rawBody, files }) {
    const citaRow = await citaRepository.findByIdAndPareja(citaId, parejaId);
    if (!citaRow) {
      fileStorage.removeFiles(files);
      throw new NotFoundError('Cita no encontrada');
    }

    const parsed = entryBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      fileStorage.removeFiles(files);
      throw new ValidationError(parsed.error.issues[0].message);
    }
    const data = parsed.data;

    const { id: entryId } = await citaRepository.upsertEntry({ citaId, userId, ...data });

    if (files?.length) {
      const maxOrden = await citaRepository.getMaxOrden(entryId);
      let orden = CitaEntry.nextOrden(maxOrden);
      for (const file of files) {
        await citaRepository.addPhoto({
          entryId,
          fotoUrl: fileStorage.buildUrl(file.filename),
          orden: orden++,
        });
      }
    }

    await cachePort.incr(citasVersionKey(parejaId));
    const cita = await citaRepository.getCitaWithEntries(citaId, parejaId);

    return {
      cita,
      notifyPartner: () =>
        notifyPartner({
          userRepository,
          notificationPort,
          parejaId,
          authorUserId: userId,
          authorName: userName,
          citaNombre: citaRow.nombre,
          citaId,
        }),
    };
  }

  return { execute };
}

module.exports = makeUpsertMiEntrada;
