const makeMoveIdeaCita = require('../../../src/application/ideasCitas/MoveIdeaCita');
const InMemoryIdeaCitaRepository = require('../../fakes/InMemoryIdeaCitaRepository');
const FakeUnitOfWork = require('../../fakes/FakeUnitOfWork');
const FakeCachePort = require('../../fakes/FakeCachePort');
const FakePubSubPort = require('../../fakes/FakePubSubPort');
const { NotFoundError } = require('../../../src/domain/errors');
const { IDEAS_CHANGES_CHANNEL } = require('../../../src/application/shared/channels');

describe('MoveIdeaCita', () => {
  it('mueve la idea a otra columna y reordena la columna destino', async () => {
    const ideaCitaRepository = new InMemoryIdeaCitaRepository();
    const unitOfWork = new FakeUnitOfWork({ ideaCitaRepository });
    const pubSubPort = new FakePubSubPort();
    const moveIdeaCita = makeMoveIdeaCita({
      ideaCitaRepository,
      unitOfWork,
      cachePort: new FakeCachePort(),
      pubSubPort,
    });

    const a = await ideaCitaRepository.create({ parejaId: 1, userId: 1, titulo: 'A', orden: 0 });
    const b = await ideaCitaRepository.create({ parejaId: 1, userId: 1, titulo: 'B', orden: 1 });
    await ideaCitaRepository.setEstadoAndReorder({
      parejaId: 1,
      id: a.id,
      estado: 'HACIENDO',
      orderedIds: [a.id],
    });

    const ideas = await moveIdeaCita.execute({
      id: b.id,
      parejaId: 1,
      estado: 'HACIENDO',
      orderedIds: [b.id, a.id],
    });

    const movida = ideas.find((i) => i.id === b.id);
    const otra = ideas.find((i) => i.id === a.id);
    expect(movida.estado).toBe('HACIENDO');
    expect(movida.orden).toBe(0);
    expect(otra.orden).toBe(1);
    expect(pubSubPort.published).toEqual([
      { channel: IDEAS_CHANGES_CHANNEL, message: JSON.stringify({ parejaId: 1 }) },
    ]);
  });

  it('lanza NotFoundError si la idea no existe o es de otra pareja', async () => {
    const ideaCitaRepository = new InMemoryIdeaCitaRepository();
    const unitOfWork = new FakeUnitOfWork({ ideaCitaRepository });
    const moveIdeaCita = makeMoveIdeaCita({
      ideaCitaRepository,
      unitOfWork,
      cachePort: new FakeCachePort(),
      pubSubPort: new FakePubSubPort(),
    });

    await expect(
      moveIdeaCita.execute({ id: 999, parejaId: 1, estado: 'HACIENDO', orderedIds: [999] })
    ).rejects.toThrow(NotFoundError);
  });
});
