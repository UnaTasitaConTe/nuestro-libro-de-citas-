const makeUpdateIdeaCita = require('../../../src/application/ideasCitas/UpdateIdeaCita');
const InMemoryIdeaCitaRepository = require('../../fakes/InMemoryIdeaCitaRepository');
const FakeCachePort = require('../../fakes/FakeCachePort');
const FakePubSubPort = require('../../fakes/FakePubSubPort');
const { NotFoundError } = require('../../../src/domain/errors');

describe('UpdateIdeaCita', () => {
  it('actualiza solo los campos provistos', async () => {
    const ideaCitaRepository = new InMemoryIdeaCitaRepository();
    const idea = await ideaCitaRepository.create({
      parejaId: 1,
      userId: 1,
      titulo: 'Cine',
      descripcion: 'Ver algo',
      orden: 0,
    });

    const updateIdeaCita = makeUpdateIdeaCita({
      ideaCitaRepository,
      cachePort: new FakeCachePort(),
      pubSubPort: new FakePubSubPort(),
    });
    const result = await updateIdeaCita.execute({
      id: idea.id,
      parejaId: 1,
      data: { titulo: 'Cine al aire libre' },
    });

    expect(result.titulo).toBe('Cine al aire libre');
    expect(result.descripcion).toBe('Ver algo');
  });

  it('lanza NotFoundError si la idea no existe o es de otra pareja', async () => {
    const ideaCitaRepository = new InMemoryIdeaCitaRepository();
    const updateIdeaCita = makeUpdateIdeaCita({
      ideaCitaRepository,
      cachePort: new FakeCachePort(),
      pubSubPort: new FakePubSubPort(),
    });

    await expect(
      updateIdeaCita.execute({ id: 999, parejaId: 1, data: { titulo: 'X' } })
    ).rejects.toThrow(NotFoundError);
  });
});
