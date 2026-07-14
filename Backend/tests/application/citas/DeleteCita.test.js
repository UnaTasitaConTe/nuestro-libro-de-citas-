const makeDeleteCita = require('../../../src/application/citas/DeleteCita');
const InMemoryCitaRepository = require('../../fakes/InMemoryCitaRepository');
const FakeFileStoragePort = require('../../fakes/FakeFileStoragePort');
const FakeCachePort = require('../../fakes/FakeCachePort');
const { NotFoundError, ValidationError } = require('../../../src/domain/errors');

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
  it('borra la cita y sus fotos físicas cuando tiene 0 o 1 entry', async () => {
    const citaRepository = new InMemoryCitaRepository();
    const fileStorage = new FakeFileStoragePort();
    const cita = await createCitaConEntries(citaRepository, 1);

    const deleteCita = makeDeleteCita({ citaRepository, fileStorage, cachePort: new FakeCachePort() });
    await deleteCita.execute({ citaId: cita.id, parejaId: 1 });

    expect(fileStorage.removedStoredFiles).toEqual(['/uploads/0.jpg']);
    expect(await citaRepository.findByIdAndPareja(cita.id, 1)).toBeNull();
  });

  it('rechaza borrar cuando ya existen ambas entries', async () => {
    const citaRepository = new InMemoryCitaRepository();
    const fileStorage = new FakeFileStoragePort();
    const cita = await createCitaConEntries(citaRepository, 2);

    const deleteCita = makeDeleteCita({ citaRepository, fileStorage, cachePort: new FakeCachePort() });
    await expect(deleteCita.execute({ citaId: cita.id, parejaId: 1 })).rejects.toThrow(
      ValidationError
    );

    expect(await citaRepository.findByIdAndPareja(cita.id, 1)).not.toBeNull();
    expect(fileStorage.removedStoredFiles).toEqual([]);
  });

  it('lanza NotFoundError si la cita no existe', async () => {
    const deleteCita = makeDeleteCita({
      citaRepository: new InMemoryCitaRepository(),
      fileStorage: new FakeFileStoragePort(),
      cachePort: new FakeCachePort(),
    });

    await expect(deleteCita.execute({ citaId: 999, parejaId: 1 })).rejects.toThrow(NotFoundError);
  });
});
