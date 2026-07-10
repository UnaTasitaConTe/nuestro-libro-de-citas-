const makeUpdateCita = require('../../../src/application/citas/UpdateCita');
const InMemoryCitaRepository = require('../../fakes/InMemoryCitaRepository');
const { NotFoundError } = require('../../../src/domain/errors');

describe('UpdateCita', () => {
  it('actualiza solo los campos provistos', async () => {
    const citaRepository = new InMemoryCitaRepository();
    const cita = await citaRepository.create({
      parejaId: 1,
      nombre: 'Cine',
      fecha: '2026-01-01',
      lugar: 'Centro',
      repetiriamos: 'SI',
    });

    const updateCita = makeUpdateCita({ citaRepository });
    const result = await updateCita.execute({
      citaId: cita.id,
      parejaId: 1,
      data: { lugar: 'Otro lugar' },
    });

    expect(result.lugar).toBe('Otro lugar');
    expect(result.fecha).toBe('2026-01-01');
  });

  it('lanza NotFoundError si la cita no existe o es de otra pareja', async () => {
    const citaRepository = new InMemoryCitaRepository();
    const updateCita = makeUpdateCita({ citaRepository });

    await expect(
      updateCita.execute({ citaId: 999, parejaId: 1, data: { lugar: 'X' } })
    ).rejects.toThrow(NotFoundError);
  });
});
