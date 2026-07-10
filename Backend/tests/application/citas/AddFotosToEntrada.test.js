const makeAddFotosToEntrada = require('../../../src/application/citas/AddFotosToEntrada');
const InMemoryCitaRepository = require('../../fakes/InMemoryCitaRepository');
const FakeFileStoragePort = require('../../fakes/FakeFileStoragePort');
const { NotFoundError, ValidationError } = require('../../../src/domain/errors');

function buildDeps() {
  const citaRepository = new InMemoryCitaRepository();
  const fileStorage = new FakeFileStoragePort();
  const addFotos = makeAddFotosToEntrada({ citaRepository, fileStorage });
  return { citaRepository, fileStorage, addFotos };
}

describe('AddFotosToEntrada', () => {
  it('rechaza si no se envían archivos, sin tocar los repos', async () => {
    const { addFotos } = buildDeps();
    await expect(
      addFotos.execute({ citaId: 1, parejaId: 1, userId: 1, files: [] })
    ).rejects.toThrow(ValidationError);
  });

  it('lanza NotFoundError y limpia archivos si la cita no existe', async () => {
    const { fileStorage, addFotos } = buildDeps();
    const files = [{ filename: 'a.jpg', path: '/tmp/a.jpg' }];

    await expect(
      addFotos.execute({ citaId: 999, parejaId: 1, userId: 1, files })
    ).rejects.toThrow(NotFoundError);
    expect(fileStorage.removedFiles).toEqual(files);
  });

  it('rechaza y limpia archivos si el usuario no tiene una entry previa', async () => {
    const { citaRepository, fileStorage, addFotos } = buildDeps();
    const cita = await citaRepository.create({
      parejaId: 1,
      nombre: 'Cine',
      fecha: '2026-01-01',
      lugar: 'Centro',
      repetiriamos: 'SI',
    });
    const files = [{ filename: 'a.jpg', path: '/tmp/a.jpg' }];

    await expect(
      addFotos.execute({ citaId: cita.id, parejaId: 1, userId: 1, files })
    ).rejects.toThrow(ValidationError);
    expect(fileStorage.removedFiles).toEqual(files);
  });

  it('agrega fotos con orden secuencial a una entry existente', async () => {
    const { citaRepository, addFotos } = buildDeps();
    const cita = await citaRepository.create({
      parejaId: 1,
      nombre: 'Cine',
      fecha: '2026-01-01',
      lugar: 'Centro',
      repetiriamos: 'SI',
    });
    await citaRepository.createEntry({ citaId: cita.id, userId: 1, valoracion: 4 });

    const files = [{ filename: 'x.jpg' }, { filename: 'y.jpg' }];
    const result = await addFotos.execute({ citaId: cita.id, parejaId: 1, userId: 1, files });

    expect(result.entries[0].photos.map((p) => p.orden)).toEqual([0, 1]);
  });
});
