const makeDeleteCita = require('../../../src/application/citas/DeleteCita');
const InMemoryCitaRepository = require('../../fakes/InMemoryCitaRepository');
const FakeFileStoragePort = require('../../fakes/FakeFileStoragePort');
const FakeCachePort = require('../../fakes/FakeCachePort');
const { NotFoundError, ForbiddenError } = require('../../../src/domain/errors');

async function createCitaConEntries(citaRepository, entryCount) {
  const cita = await citaRepository.create({
    parejaId: 1,
    nombre: 'Cine',
    fecha: '2026-01-01',
    lugar: 'Centro',
    repetiriamos: 'SI',
  });
  for (let i = 0; i < entryCount; i++) {
    const { id: entryId } = await citaRepository.createEntry({
      citaId: cita.id,
      userId: i + 1,
      valoracion: 5,
    });
    await citaRepository.addPhoto({ entryId, fotoUrl: `/uploads/${i}.jpg`, orden: 0 });
  }
  return cita;
}

describe('DeleteCita', () => {
  it('un admin puede borrar la cita y sus fotos físicas aunque ya existan ambas entries', async () => {
    const citaRepository = new InMemoryCitaRepository();
    const fileStorage = new FakeFileStoragePort();
    const cita = await createCitaConEntries(citaRepository, 2);

    const deleteCita = makeDeleteCita({ citaRepository, fileStorage, cachePort: new FakeCachePort() });
    await deleteCita.execute({ citaId: cita.id, parejaId: 1, role: 'ADMIN' });

    expect(fileStorage.removedStoredFiles).toEqual(['/uploads/0.jpg', '/uploads/1.jpg']);
    expect(await citaRepository.findByIdAndPareja(cita.id, 1)).toBeNull();
  });

  it('rechaza con ForbiddenError si el usuario no es admin', async () => {
    const citaRepository = new InMemoryCitaRepository();
    const fileStorage = new FakeFileStoragePort();
    const cita = await createCitaConEntries(citaRepository, 1);

    const deleteCita = makeDeleteCita({ citaRepository, fileStorage, cachePort: new FakeCachePort() });
    await expect(
      deleteCita.execute({ citaId: cita.id, parejaId: 1, role: 'MEMBER' })
    ).rejects.toThrow(ForbiddenError);

    expect(await citaRepository.findByIdAndPareja(cita.id, 1)).not.toBeNull();
    expect(fileStorage.removedStoredFiles).toEqual([]);
  });

  it('lanza NotFoundError si la cita no existe, incluso siendo admin', async () => {
    const deleteCita = makeDeleteCita({
      citaRepository: new InMemoryCitaRepository(),
      fileStorage: new FakeFileStoragePort(),
      cachePort: new FakeCachePort(),
    });

    await expect(
      deleteCita.execute({ citaId: 999, parejaId: 1, role: 'ADMIN' })
    ).rejects.toThrow(NotFoundError);
  });
});
