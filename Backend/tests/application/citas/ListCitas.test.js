const makeListCitas = require('../../../src/application/citas/ListCitas');
const InMemoryCitaRepository = require('../../fakes/InMemoryCitaRepository');
const FakeCachePort = require('../../fakes/FakeCachePort');
const { citasVersionKey } = require('../../../src/application/shared/cacheKeys');

describe('ListCitas', () => {
  let citaRepository;
  let cachePort;
  let listCitas;

  beforeEach(async () => {
    citaRepository = new InMemoryCitaRepository();
    cachePort = new FakeCachePort();
    for (let i = 1; i <= 3; i++) {
      await citaRepository.create({
        parejaId: 1,
        nombre: `Cita ${i}`,
        fecha: `2026-01-0${i}`,
        lugar: 'Lugar',
        repetiriamos: 'SI',
      });
    }
    listCitas = makeListCitas({ citaRepository, cachePort });
  });

  it('pagina con valores por defecto', async () => {
    const result = await listCitas.execute({ parejaId: 1 });
    expect(result.total).toBe(3);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.citas).toHaveLength(3);
  });

  it('usa page=1 cuando page no es numérico', async () => {
    const result = await listCitas.execute({ parejaId: 1, page: 'abc' });
    expect(result.page).toBe(1);
  });

  it('limita el límite a 50 aunque se pida más', async () => {
    const result = await listCitas.execute({ parejaId: 1, limit: '1000' });
    expect(result.citas.length).toBeLessThanOrEqual(50);
  });

  it('usa limit=10 cuando limit no es numérico', async () => {
    const result = await listCitas.execute({ parejaId: 1, limit: 'abc' });
    expect(result.totalPages).toBe(1);
  });

  it('sirve la segunda llamada desde caché aunque el repositorio cambie', async () => {
    const first = await listCitas.execute({ parejaId: 1 });
    citaRepository.citas = [];

    const second = await listCitas.execute({ parejaId: 1 });
    expect(second).toEqual(first);
  });

  it('devuelve datos frescos tras bumpear la versión (invalidación)', async () => {
    await listCitas.execute({ parejaId: 1 });
    await cachePort.incr(citasVersionKey(1));
    citaRepository.citas = [];

    const result = await listCitas.execute({ parejaId: 1 });
    expect(result.citas).toHaveLength(0);
  });
});
