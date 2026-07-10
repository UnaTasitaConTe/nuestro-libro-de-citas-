const makeGetCita = require('../../../src/application/citas/GetCita');
const InMemoryCitaRepository = require('../../fakes/InMemoryCitaRepository');
const { NotFoundError } = require('../../../src/domain/errors');

describe('GetCita', () => {
  it('devuelve la cita con sus entries y fotos', async () => {
    const citaRepository = new InMemoryCitaRepository();
    const cita = await citaRepository.create({
      parejaId: 1,
      nombre: 'Cine',
      fecha: '2026-01-01',
      lugar: 'Centro',
      repetiriamos: 'SI',
    });

    const getCita = makeGetCita({ citaRepository });
    const result = await getCita.execute({ citaId: cita.id, parejaId: 1 });

    expect(result.id).toBe(cita.id);
    expect(result.entries).toEqual([]);
  });

  it('lanza NotFoundError si la cita no existe', async () => {
    const getCita = makeGetCita({ citaRepository: new InMemoryCitaRepository() });
    await expect(getCita.execute({ citaId: 999, parejaId: 1 })).rejects.toThrow(NotFoundError);
  });

  it('lanza NotFoundError si la cita pertenece a otra pareja', async () => {
    const citaRepository = new InMemoryCitaRepository();
    const cita = await citaRepository.create({
      parejaId: 1,
      nombre: 'Cine',
      fecha: '2026-01-01',
      lugar: 'Centro',
      repetiriamos: 'SI',
    });

    const getCita = makeGetCita({ citaRepository });
    await expect(getCita.execute({ citaId: cita.id, parejaId: 2 })).rejects.toThrow(NotFoundError);
  });
});
