const { normalizePagination, totalPages } = require('../../domain/services/pagination');
const { citasVersionKey } = require('../shared/cacheKeys');

function galleryKey(parejaId, version, page, limit) {
  return `gallery:${parejaId}:v${version}:${page}:${limit}`;
}

const CACHE_TTL_SECONDS = 60;

function makeListGallery({ citaRepository, cachePort }) {
  async function execute({ parejaId, page: rawPage, limit: rawLimit }) {
    const { page, limit, offset } = normalizePagination(rawPage, rawLimit || 24);

    const version = (await cachePort.get(citasVersionKey(parejaId))) || '0';
    const cacheKey = galleryKey(parejaId, version, page, limit);

    const cached = await cachePort.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const total = await citaRepository.countPhotosByPareja(parejaId);
    const photos = await citaRepository.findPhotosByPareja(parejaId, { limit, offset });
    const result = { photos, total, page, totalPages: totalPages(total, limit) };

    await cachePort.set(cacheKey, JSON.stringify(result), CACHE_TTL_SECONDS);
    return result;
  }

  return { execute };
}

module.exports = makeListGallery;
