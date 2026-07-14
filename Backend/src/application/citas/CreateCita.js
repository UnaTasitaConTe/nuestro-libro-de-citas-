const notifyPartner = require('./notifyPartner');
const { citasVersionKey } = require('../shared/cacheKeys');

function makeCreateCita({ citaRepository, unitOfWork, fileStorage, userRepository, notificationPort, cachePort }) {
  async function execute({ parejaId, userId, userName, data, files }) {
    let createdCitaId;

    try {
      const created = await unitOfWork.withTransaction(async (repos) => {
        const cita = await repos.citaRepository.create({
          parejaId,
          nombre: data.nombre,
          fecha: data.fecha,
          lugar: data.lugar,
          repetiriamos: data.repetiriamos,
        });

        const { id: entryId } = await repos.citaRepository.createEntry({
          citaId: cita.id,
          userId,
          valoracion: data.valoracion,
          queHicimos: data.queHicimos,
          comoTeSentiste: data.comoTeSentiste,
          loQueMasGusto: data.loQueMasGusto,
          loQueMenosGusto: data.loQueMenosGusto,
        });

        for (const [i, file] of (files || []).entries()) {
          await repos.citaRepository.addPhoto({
            entryId,
            fotoUrl: fileStorage.buildUrl(file.filename),
            orden: i,
          });
        }

        return cita;
      });
      createdCitaId = created.id;
    } catch (err) {
      fileStorage.removeFiles(files);
      throw err;
    }

    await cachePort.incr(citasVersionKey(parejaId));

    const cita = await citaRepository.getCitaWithEntries(createdCitaId, parejaId);

    return {
      cita,
      notifyPartner: () =>
        notifyPartner({
          userRepository,
          notificationPort,
          parejaId,
          authorUserId: userId,
          authorName: userName,
          citaNombre: data.nombre,
          citaId: createdCitaId,
        }),
    };
  }

  return { execute };
}

module.exports = makeCreateCita;
