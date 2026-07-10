const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;

function normalizePagination(rawPage, rawLimit) {
  const page = Math.max(DEFAULT_PAGE, parseInt(rawPage, 10) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(rawLimit, 10) || DEFAULT_LIMIT));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function totalPages(total, limit) {
  return Math.max(1, Math.ceil(total / limit));
}

module.exports = { normalizePagination, totalPages };
