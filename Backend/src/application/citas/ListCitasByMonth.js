const { citasVersionKey } = require('../shared/cacheKeys');

function citasMonthKey(parejaId, version, year, month) {
  return `citas:month:${parejaId}:v${version}:${year}-${month}`;
}

const CACHE_TTL_SECONDS = 60;

function makeListCitasByMonth({ citaRepository, cachePort }) {
  async function execute({ parejaId, year, month }) {
    const version = (await cachePort.get(citasVersionKey(parejaId))) || '0';
    const cacheKey = citasMonthKey(parejaId, version, year, month);

    const cached = await cachePort.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const citas = await citaRepository.findByMonth(parejaId, year, month);
    await cachePort.set(cacheKey, JSON.stringify(citas), CACHE_TTL_SECONDS);
    return citas;
  }

  return { execute };
}

module.exports = makeListCitasByMonth;
