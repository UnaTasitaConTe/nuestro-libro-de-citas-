const makeGetPareja = require('../../../src/application/pareja/GetPareja');
const InMemoryUserRepository = require('../../fakes/InMemoryUserRepository');
const InMemoryParejaRepository = require('../../fakes/InMemoryParejaRepository');
const { NotFoundError } = require('../../../src/domain/errors');

describe('GetPareja', () => {
  it('devuelve la pareja con sus miembros', async () => {
    const parejaRepository = new InMemoryParejaRepository();
    const userRepository = new InMemoryUserRepository();
    await parejaRepository.create({ inviteCode: 'ABC123' });
    await userRepository.create({ parejaId: 1, email: 'a@test.com', passwordHash: 'x', name: 'Ana' });
    await userRepository.create({ parejaId: 1, email: 'b@test.com', passwordHash: 'x', name: 'Beto' });

    const getPareja = makeGetPareja({ parejaRepository, userRepository });
    const result = await getPareja.execute({ parejaId: 1 });

    expect(result).toEqual({
      id: 1,
      inviteCode: 'ABC123',
      members: [
        { id: 1, name: 'Ana', email: 'a@test.com' },
        { id: 2, name: 'Beto', email: 'b@test.com' },
      ],
    });
  });

  it('lanza NotFoundError si la pareja no existe', async () => {
    const getPareja = makeGetPareja({
      parejaRepository: new InMemoryParejaRepository(),
      userRepository: new InMemoryUserRepository(),
    });

    await expect(getPareja.execute({ parejaId: 999 })).rejects.toThrow(NotFoundError);
  });
});
