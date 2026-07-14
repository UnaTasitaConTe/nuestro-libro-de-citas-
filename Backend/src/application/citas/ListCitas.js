const { normalizePagination, totalPages } = require('../../domain/services/pagination');
const { citasVersionKey, citasListKey } = require('../shared/cacheKeys');

const CACHE_TTL_SECONDS = 60;

function makeListCitas({ citaRepository, cachePort }) {
  async function execute({ parejaId, page: rawPage, limit: rawLimit }) {
    const { page, limit, offset } = normalizePagination(rawPage, rawLimit);

    const version = (await cachePort.get(citasVersionKey(parejaId))) || '0';
    const cacheKey = citasListKey(parejaId, version, page, limit);

    const cached = await cachePort.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const { citas, total } = await citaRepository.listWithEntries(parejaId, { limit, offset });
    const result = { citas, total, page, totalPages: totalPages(total, limit) };

    await cachePort.set(cacheKey, JSON.stringify(result), CACHE_TTL_SECONDS);
    return result;
  }

  return { execute };
}

module.exports = makeListCitas;
