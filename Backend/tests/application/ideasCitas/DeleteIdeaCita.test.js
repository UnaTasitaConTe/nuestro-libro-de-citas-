const makeDeleteIdeaCita = require('../../../src/application/ideasCitas/DeleteIdeaCita');
const InMemoryIdeaCitaRepository = require('../../fakes/InMemoryIdeaCitaRepository');
const FakeCachePort = require('../../fakes/FakeCachePort');
const FakePubSubPort = require('../../fakes/FakePubSubPort');

describe('DeleteIdeaCita', () => {
  it('borra la idea de la pareja indicada', async () => {
    const ideaCitaRepository = new InMemoryIdeaCitaRepository();
    const idea = await ideaCitaRepository.create({ parejaId: 1, userId: 1, titulo: 'Cine', orden: 0 });

    const deleteIdeaCita = makeDeleteIdeaCita({
      ideaCitaRepository,
      cachePort: new FakeCachePort(),
      pubSubPort: new FakePubSubPort(),
    });
    await deleteIdeaCita.execute({ id: idea.id, parejaId: 1 });

    expect(await ideaCitaRepository.findByIdAndPareja(idea.id, 1)).toBeNull();
  });
});
