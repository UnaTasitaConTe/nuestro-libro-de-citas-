const { ideasVersionKey } = require('../shared/cacheKeys');
const { IDEAS_CHANGES_CHANNEL } = require('../shared/channels');

function makeCreateIdeaCita({ ideaCitaRepository, cachePort, pubSubPort }) {
  async function execute({ parejaId, userId, data }) {
    const orden = (await ideaCitaRepository.getMaxOrden(parejaId, 'POR_HACER')) + 1;

    const idea = await ideaCitaRepository.create({
      parejaId,
      userId,
      titulo: data.titulo,
      descripcion: data.descripcion,
      orden,
    });

    await cachePort.incr(ideasVersionKey(parejaId));
    await pubSubPort.publish(IDEAS_CHANGES_CHANNEL, JSON.stringify({ parejaId }));

    return idea;
  }

  return { execute };
}

module.exports = makeCreateIdeaCita;
