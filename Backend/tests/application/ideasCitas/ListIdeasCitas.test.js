const makeListIdeasCitas = require('../../../src/application/ideasCitas/ListIdeasCitas');
const InMemoryIdeaCitaRepository = require('../../fakes/InMemoryIdeaCitaRepository');
const FakeCachePort = require('../../fakes/FakeCachePort');
const { ideasVersionKey } = require('../../../src/application/shared/cacheKeys');

describe('ListIdeasCitas', () => {
  it('lista solo las ideas de la pareja indicada', async () => {
    const ideaCitaRepository = new InMemoryIdeaCitaRepository();
    const cachePort = new FakeCachePort();
    await ideaCitaRepository.create({ parejaId: 1, userId: 1, titulo: 'Cine', orden: 0 });
    await ideaCitaRepository.create({ parejaId: 2, userId: 2, titulo: 'Otra pareja', orden: 0 });

    const listIdeasCitas = makeListIdeasCitas({ ideaCitaRepository, cachePort });
    const ideas = await listIdeasCitas.execute({ parejaId: 1 });

    expect(ideas).toHaveLength(1);
    expect(ideas[0].titulo).toBe('Cine');
  });

  it('sirve la segunda llamada desde caché y refresca tras invalidar', async () => {
    const ideaCitaRepository = new InMemoryIdeaCitaRepository();
    const cachePort = new FakeCachePort();
    await ideaCitaRepository.create({ parejaId: 1, userId: 1, titulo: 'Cine', orden: 0 });

    const listIdeasCitas = makeListIdeasCitas({ ideaCitaRepository, cachePort });
    const first = await listIdeasCitas.execute({ parejaId: 1 });

    ideaCitaRepository.ideas = [];
    const cached = await listIdeasCitas.execute({ parejaId: 1 });
    expect(cached).toEqual(first);

    await cachePort.incr(ideasVersionKey(1));
    const fresh = await listIdeasCitas.execute({ parejaId: 1 });
    expect(fresh).toEqual([]);
  });
});
