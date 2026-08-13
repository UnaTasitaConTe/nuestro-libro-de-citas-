const makeUpdateCita = require('../../../src/application/citas/UpdateCita');
const InMemoryCitaRepository = require('../../fakes/InMemoryCitaRepository');
const FakeCachePort = require('../../fakes/FakeCachePort');
const { NotFoundError, ForbiddenError } = require('../../../src/domain/errors');

describe('UpdateCita', () => {
  it('un admin puede actualizar el nombre y los campos provistos', async () => {
    const citaRepository = new InMemoryCitaRepository();
    const cita = await citaRepository.create({
      parejaId: 1,
      nombre: 'Cine',
      fecha: '2026-01-01',
      lugar: 'Centro',
      repetiriamos: 'SI',
    });

    const updateCita = makeUpdateCita({ citaRepository, cachePort: new FakeCachePort() });
    const result = await updateCita.execute({
      citaId: cita.id,
      parejaId: 1,
      role: 'ADMIN',
      data: { nombre: 'Cine renombrado', lugar: 'Otro lugar' },
    });

    expect(result.nombre).toBe('Cine renombrado');
    expect(result.lugar).toBe('Otro lugar');
    expect(result.fecha).toBe('2026-01-01');
  });

  it('rechaza con ForbiddenError si el usuario no es admin', async () => {
    const citaRepository = new InMemoryCitaRepository();
    const cita = await citaRepository.create({
      parejaId: 1,
      nombre: 'Cine',
      fecha: '2026-01-01',
      lugar: 'Centro',
      repetiriamos: 'SI',
    });

    const updateCita = makeUpdateCita({ citaRepository, cachePort: new FakeCachePort() });
    await expect(
      updateCita.execute({ citaId: cita.id, parejaId: 1, role: 'MEMBER', data: { lugar: 'X' } })
    ).rejects.toThrow(ForbiddenError);

    expect((await citaRepository.findByIdAndPareja(cita.id, 1)).lugar).toBe('Centro');
  });

  it('lanza NotFoundError si la cita no existe o es de otra pareja', async () => {
    const citaRepository = new InMemoryCitaRepository();
    const updateCita = makeUpdateCita({ citaRepository, cachePort: new FakeCachePort() });

    await expect(
      updateCita.execute({ citaId: 999, parejaId: 1, role: 'ADMIN', data: { lugar: 'X' } })
    ).rejects.toThrow(NotFoundError);
  });
});
