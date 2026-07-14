const makeCreateIdeaCita = require('../../../src/application/ideasCitas/CreateIdeaCita');
const InMemoryIdeaCitaRepository = require('../../fakes/InMemoryIdeaCitaRepository');
const FakeCachePort = require('../../fakes/FakeCachePort');
const FakePubSubPort = require('../../fakes/FakePubSubPort');
const { ideasVersionKey } = require('../../../src/application/shared/cacheKeys');
const { IDEAS_CHANGES_CHANNEL } = require('../../../src/application/shared/channels');

describe('CreateIdeaCita', () => {
  it('crea la idea en estado POR_HACER al final de la columna', async () => {
    const ideaCitaRepository = new InMemoryIdeaCitaRepository();
    const cachePort = new FakeCachePort();
    const pubSubPort = new FakePubSubPort();
    const createIdeaCita = makeCreateIdeaCita({ ideaCitaRepository, cachePort, pubSubPort });

    const primera = await createIdeaCita.execute({
      parejaId: 1,
      userId: 1,
      data: { titulo: 'Picnic en el parque' },
    });
    const segunda = await createIdeaCita.execute({
      parejaId: 1,
      userId: 1,
      data: { titulo: 'Cine', descripcion: 'La nueva de Marvel' },
    });

    expect(primera.estado).toBe('POR_HACER');
    expect(primera.orden).toBe(0);
    expect(segunda.orden).toBe(1);
    expect(segunda.descripcion).toBe('La nueva de Marvel');
  });

  it('incrementa la versión de caché y publica un evento por pareja', async () => {
    const ideaCitaRepository = new InMemoryIdeaCitaRepository();
    const cachePort = new FakeCachePort();
    const pubSubPort = new FakePubSubPort();
    const createIdeaCita = makeCreateIdeaCita({ ideaCitaRepository, cachePort, pubSubPort });

    await createIdeaCita.execute({ parejaId: 1, userId: 1, data: { titulo: 'Cine' } });

    expect(await cachePort.get(ideasVersionKey(1))).toBe('1');
    expect(pubSubPort.published).toEqual([
      { channel: IDEAS_CHANGES_CHANNEL, message: JSON.stringify({ parejaId: 1 }) },
    ]);
  });
});
