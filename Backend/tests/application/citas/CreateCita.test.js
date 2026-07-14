const makeCreateCita = require('../../../src/application/citas/CreateCita');
const InMemoryCitaRepository = require('../../fakes/InMemoryCitaRepository');
const InMemoryUserRepository = require('../../fakes/InMemoryUserRepository');
const FakeUnitOfWork = require('../../fakes/FakeUnitOfWork');
const FakeFileStoragePort = require('../../fakes/FakeFileStoragePort');
const FakeNotificationPort = require('../../fakes/FakeNotificationPort');
const FakeCachePort = require('../../fakes/FakeCachePort');

function baseData() {
  return { nombre: 'Cine', fecha: '2026-01-01', lugar: 'Centro', repetiriamos: 'SI', valoracion: 5 };
}

describe('CreateCita', () => {
  let citaRepository;
  let userRepository;
  let unitOfWork;
  let fileStorage;
  let notificationPort;
  let createCita;

  beforeEach(() => {
    citaRepository = new InMemoryCitaRepository();
    userRepository = new InMemoryUserRepository();
    unitOfWork = new FakeUnitOfWork({ citaRepository, userRepository });
    fileStorage = new FakeFileStoragePort();
    notificationPort = new FakeNotificationPort();
    createCita = makeCreateCita({
      citaRepository,
      unitOfWork,
      fileStorage,
      userRepository,
      notificationPort,
      cachePort: new FakeCachePort(),
    });
  });

  it('crea la cita, la entry del creador y las fotos de forma atómica', async () => {
    const files = [{ filename: 'a.jpg', path: '/tmp/a.jpg' }, { filename: 'b.jpg', path: '/tmp/b.jpg' }];

    const { cita, notifyPartner } = await createCita.execute({
      parejaId: 1,
      userId: 1,
      userName: 'Ana',
      data: baseData(),
      files,
    });

    expect(cita.nombre).toBe('Cine');
    expect(cita.entries).toHaveLength(1);
    expect(cita.entries[0].photos.map((p) => p.foto_url)).toEqual(['/uploads/a.jpg', '/uploads/b.jpg']);
    expect(typeof notifyPartner).toBe('function');
  });

  it('hace rollback y limpia los archivos si algo falla dentro de la transacción', async () => {
    citaRepository.addPhoto = async () => {
      throw new Error('fallo simulado de escritura');
    };
    const files = [{ filename: 'a.jpg', path: '/tmp/a.jpg' }];

    await expect(
      createCita.execute({ parejaId: 1, userId: 1, userName: 'Ana', data: baseData(), files })
    ).rejects.toThrow('fallo simulado de escritura');

    expect(fileStorage.removedFiles).toEqual(files);
    expect(citaRepository.citas).toHaveLength(0);
    expect(citaRepository.entries).toHaveLength(0);
  });

  it('notifyPartner no llama al notificationPort si no hay partner', async () => {
    const { notifyPartner } = await createCita.execute({
      parejaId: 1,
      userId: 1,
      userName: 'Ana',
      data: baseData(),
      files: [],
    });

    await notifyPartner();
    expect(notificationPort.notifications).toHaveLength(0);
  });

  it('notifyPartner llama al notificationPort con los datos del partner', async () => {
    await userRepository.create({ parejaId: 1, email: 'author@test.com', passwordHash: 'x', name: 'Ana' });
    await userRepository.create({ parejaId: 1, email: 'partner@test.com', passwordHash: 'x', name: 'Beto' });

    const { notifyPartner } = await createCita.execute({
      parejaId: 1,
      userId: 1,
      userName: 'Ana',
      data: baseData(),
      files: [],
    });

    await notifyPartner();
    expect(notificationPort.notifications).toEqual([
      { to: 'partner@test.com', authorName: 'Ana', citaNombre: 'Cine', citaId: 1 },
    ]);
  });
});
