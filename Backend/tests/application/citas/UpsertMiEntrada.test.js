const { z } = require('zod');
const makeUpsertMiEntrada = require('../../../src/application/citas/UpsertMiEntrada');
const InMemoryCitaRepository = require('../../fakes/InMemoryCitaRepository');
const InMemoryUserRepository = require('../../fakes/InMemoryUserRepository');
const FakeFileStoragePort = require('../../fakes/FakeFileStoragePort');
const FakeNotificationPort = require('../../fakes/FakeNotificationPort');
const { NotFoundError, ValidationError } = require('../../../src/domain/errors');

const entryBodySchema = z.object({
  valoracion: z.coerce.number().int().min(1).max(5),
  queHicimos: z.string().optional(),
  comoTeSentiste: z.string().optional(),
  loQueMasGusto: z.string().optional(),
  loQueMenosGusto: z.string().optional(),
});

function buildDeps() {
  const citaRepository = new InMemoryCitaRepository();
  const userRepository = new InMemoryUserRepository();
  const fileStorage = new FakeFileStoragePort();
  const notificationPort = new FakeNotificationPort();
  const upsertMiEntrada = makeUpsertMiEntrada({
    citaRepository,
    fileStorage,
    userRepository,
    notificationPort,
    entryBodySchema,
  });
  return { citaRepository, userRepository, fileStorage, notificationPort, upsertMiEntrada };
}

describe('UpsertMiEntrada', () => {
  it('lanza NotFoundError y limpia archivos si la cita no existe (antes de validar el body)', async () => {
    const { fileStorage, upsertMiEntrada } = buildDeps();
    const files = [{ filename: 'a.jpg', path: '/tmp/a.jpg' }];

    await expect(
      upsertMiEntrada.execute({
        citaId: 999,
        parejaId: 1,
        userId: 1,
        userName: 'Ana',
        rawBody: { valoracion: 'no-numero' },
        files,
      })
    ).rejects.toThrow(NotFoundError);

    expect(fileStorage.removedFiles).toEqual(files);
  });

  it('lanza ValidationError y limpia archivos si el body es inválido', async () => {
    const { citaRepository, fileStorage, upsertMiEntrada } = buildDeps();
    const cita = await citaRepository.create({
      parejaId: 1,
      nombre: 'Cine',
      fecha: '2026-01-01',
      lugar: 'Centro',
      repetiriamos: 'SI',
    });
    const files = [{ filename: 'a.jpg', path: '/tmp/a.jpg' }];

    await expect(
      upsertMiEntrada.execute({
        citaId: cita.id,
        parejaId: 1,
        userId: 1,
        userName: 'Ana',
        rawBody: { valoracion: 99 },
        files,
      })
    ).rejects.toThrow(ValidationError);

    expect(fileStorage.removedFiles).toEqual(files);
  });

  it('crea la entry si no existe y agrega fotos con orden secuencial continuando desde el máximo', async () => {
    const { citaRepository, upsertMiEntrada } = buildDeps();
    const cita = await citaRepository.create({
      parejaId: 1,
      nombre: 'Cine',
      fecha: '2026-01-01',
      lugar: 'Centro',
      repetiriamos: 'SI',
    });
    const { id: entryId } = await citaRepository.createEntry({ citaId: cita.id, userId: 1, valoracion: 3 });
    await citaRepository.addPhoto({ entryId, fotoUrl: '/uploads/0.jpg', orden: 0 });
    await citaRepository.addPhoto({ entryId, fotoUrl: '/uploads/1.jpg', orden: 1 });

    const files = [{ filename: '2.jpg' }, { filename: '3.jpg' }];
    const { cita: result } = await upsertMiEntrada.execute({
      citaId: cita.id,
      parejaId: 1,
      userId: 1,
      userName: 'Ana',
      rawBody: { valoracion: 5 },
      files,
    });

    const entry = result.entries.find((e) => e.id === entryId);
    expect(entry.valoracion).toBe(5);
    expect(entry.photos.map((p) => p.orden)).toEqual([0, 1, 2, 3]);
    expect(entry.photos.map((p) => p.foto_url)).toEqual([
      '/uploads/0.jpg',
      '/uploads/1.jpg',
      '/uploads/2.jpg',
      '/uploads/3.jpg',
    ]);
  });

  it('notifyPartner no llama al notificationPort si no hay partner', async () => {
    const { citaRepository, notificationPort, upsertMiEntrada } = buildDeps();
    const cita = await citaRepository.create({
      parejaId: 1,
      nombre: 'Cine',
      fecha: '2026-01-01',
      lugar: 'Centro',
      repetiriamos: 'SI',
    });

    const { notifyPartner } = await upsertMiEntrada.execute({
      citaId: cita.id,
      parejaId: 1,
      userId: 1,
      userName: 'Ana',
      rawBody: { valoracion: 4 },
      files: [],
    });

    await notifyPartner();
    expect(notificationPort.notifications).toHaveLength(0);
  });
});
