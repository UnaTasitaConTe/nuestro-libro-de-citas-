const { ideasVersionKey, ideasListKey } = require('../shared/cacheKeys');

const CACHE_TTL_SECONDS = 60;

function makeListIdeasCitas({ ideaCitaRepository, cachePort }) {
  async function execute({ parejaId }) {
    const version = (await cachePort.get(ideasVersionKey(parejaId))) || '0';
    const cacheKey = ideasListKey(parejaId, version);

    const cached = await cachePort.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const ideas = await ideaCitaRepository.listByPareja(parejaId);
    await cachePort.set(cacheKey, JSON.stringify(ideas), CACHE_TTL_SECONDS);
    return ideas;
  }

  return { execute };
}

module.exports = makeListIdeasCitas;
