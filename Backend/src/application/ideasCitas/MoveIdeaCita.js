const { NotFoundError } = require('../../domain/errors');
const { ideasVersionKey } = require('../shared/cacheKeys');
const { IDEAS_CHANGES_CHANNEL } = require('../shared/channels');

function makeMoveIdeaCita({ ideaCitaRepository, unitOfWork, cachePort, pubSubPort }) {
  async function execute({ id, parejaId, estado, orderedIds }) {
    const idea = await ideaCitaRepository.findByIdAndPareja(id, parejaId);
    if (!idea) throw new NotFoundError('Idea no encontrada');

    await unitOfWork.withTransaction((repos) =>
      repos.ideaCitaRepository.setEstadoAndReorder({ parejaId, id, estado, orderedIds })
    );

    await cachePort.incr(ideasVersionKey(parejaId));
    await pubSubPort.publish(IDEAS_CHANGES_CHANNEL, JSON.stringify({ parejaId }));

    return ideaCitaRepository.listByPareja(parejaId);
  }

  return { execute };
}

module.exports = makeMoveIdeaCita;
