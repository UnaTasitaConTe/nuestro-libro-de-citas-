const { normalizePagination, totalPages } = require('../../domain/services/pagination');

function makeListCitas({ citaRepository }) {
  async function execute({ parejaId, page: rawPage, limit: rawLimit }) {
    const { page, limit, offset } = normalizePagination(rawPage, rawLimit);
    const { citas, total } = await citaRepository.listWithEntries(parejaId, { limit, offset });
    return { citas, total, page, totalPages: totalPages(total, limit) };
  }

  return { execute };
}

module.exports = makeListCitas;
