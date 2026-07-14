const { ideasVersionKey } = require('../shared/cacheKeys');
const { IDEAS_CHANGES_CHANNEL } = require('../shared/channels');

function makeDeleteIdeaCita({ ideaCitaRepository, cachePort, pubSubPort }) {
  async function execute({ id, parejaId }) {
    await ideaCitaRepository.deleteById(id, parejaId);
    await cachePort.incr(ideasVersionKey(parejaId));
    await pubSubPort.publish(IDEAS_CHANGES_CHANNEL, JSON.stringify({ parejaId }));
  }

  return { execute };
}

module.exports = makeDeleteIdeaCita;
