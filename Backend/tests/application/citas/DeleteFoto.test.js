const makeDeleteFoto = require('../../../src/application/citas/DeleteFoto');
const InMemoryCitaRepository = require('../../fakes/InMemoryCitaRepository');
const FakeFileStoragePort = require('../../fakes/FakeFileStoragePort');
const FakeCachePort = require('../../fakes/FakeCachePort');
const { NotFoundError } = require('../../../src/domain/errors');

describe('DeleteFoto', () => {
  it('borra la foto y limpia el archivo físico', async () => {
    const citaRepository = new InMemoryCitaRepository();
    const fileStorage = new FakeFileStoragePort();
    const cita = await citaRepository.create({
      parejaId: 1,
      nombre: 'Cine',
      fecha: '2026-01-01',
      lugar: 'Centro',
      repetiriamos: 'SI',
    });
    const { id: entryId } = await citaRepository.createEntry({ citaId: cita.id, userId: 1, valoracion: 5 });
    await citaRepository.addPhoto({ entryId, fotoUrl: '/uploads/a.jpg', orden: 0 });
    const fotoId = citaRepository.photos[0].id;

    const deleteFoto = makeDeleteFoto({ citaRepository, fileStorage, cachePort: new FakeCachePort() });
    await deleteFoto.execute({ citaId: cita.id, fotoId, parejaId: 1 });

    expect(fileStorage.removedStoredFiles).toEqual(['/uploads/a.jpg']);
    expect(citaRepository.photos).toHaveLength(0);
  });

  it('lanza NotFoundError si la cita no existe', async () => {
    const deleteFoto = makeDeleteFoto({
      citaRepository: new InMemoryCitaRepository(),
      fileStorage: new FakeFileStoragePort(),
      cachePort: new FakeCachePort(),
    });

    await expect(deleteFoto.execute({ citaId: 999, fotoId: 1, parejaId: 1 })).rejects.toThrow(
      NotFoundError
    );
  });

  it('lanza NotFoundError si la foto no existe', async () => {
    const citaRepository = new InMemoryCitaRepository();
    const cita = await citaRepository.create({
      parejaId: 1,
      nombre: 'Cine',
      fecha: '2026-01-01',
      lugar: 'Centro',
      repetiriamos: 'SI',
    });

    const deleteFoto = makeDeleteFoto({
      citaRepository,
      fileStorage: new FakeFileStoragePort(),
      cachePort: new FakeCachePort(),
    });
    await expect(
      deleteFoto.execute({ citaId: cita.id, fotoId: 999, parejaId: 1 })
    ).rejects.toThrow(NotFoundError);
  });
});
