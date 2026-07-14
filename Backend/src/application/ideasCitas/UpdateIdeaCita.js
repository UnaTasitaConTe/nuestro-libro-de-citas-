const { NotFoundError } = require('../../domain/errors');
const { ideasVersionKey } = require('../shared/cacheKeys');
const { IDEAS_CHANGES_CHANNEL } = require('../shared/channels');

function makeUpdateIdeaCita({ ideaCitaRepository, cachePort, pubSubPort }) {
  async function execute({ id, parejaId, data }) {
    const updated = await ideaCitaRepository.updateFields(id, parejaId, data);
    if (!updated) throw new NotFoundError('Idea no encontrada');

    await cachePort.incr(ideasVersionKey(parejaId));
    await pubSubPort.publish(IDEAS_CHANGES_CHANNEL, JSON.stringify({ parejaId }));

    return ideaCitaRepository.findByIdAndPareja(id, parejaId);
  }

  return { execute };
}

module.exports = makeUpdateIdeaCita;
