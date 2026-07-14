const makeLoginUser = require('../../../src/application/auth/LoginUser');
const InMemoryUserRepository = require('../../fakes/InMemoryUserRepository');
const FakePasswordHasher = require('../../fakes/FakePasswordHasher');
const FakeTokenService = require('../../fakes/FakeTokenService');
const FakeSessionPort = require('../../fakes/FakeSessionPort');
const { UnauthorizedError } = require('../../../src/domain/errors');

describe('LoginUser', () => {
  let userRepository;
  let sessionPort;
  let loginUser;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    await userRepository.create({
      parejaId: 1,
      email: 'ok@test.com',
      passwordHash: 'hashed:secret1',
      name: 'Ok',
    });

    sessionPort = new FakeSessionPort();
    loginUser = makeLoginUser({
      userRepository,
      passwordHasher: new FakePasswordHasher(),
      tokenService: new FakeTokenService(),
      sessionPort,
      sessionTtlSeconds: 2592000,
    });
  });

  it('devuelve token y usuario público con credenciales válidas', async () => {
    const result = await loginUser.execute({ email: 'ok@test.com', password: 'secret1' });
    expect(result.user).toEqual({ id: 1, email: 'ok@test.com', name: 'Ok' });
    expect(result.token).toBeTypeOf('string');
  });

  it('crea una sesión en Redis asociada al jti del token', async () => {
    await loginUser.execute({ email: 'ok@test.com', password: 'secret1' });
    expect(sessionPort.sessions.size).toBe(1);
  });

  it('rechaza un email inexistente', async () => {
    await expect(
      loginUser.execute({ email: 'nope@test.com', password: 'secret1' })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('rechaza un password incorrecto', async () => {
    await expect(
      loginUser.execute({ email: 'ok@test.com', password: 'wrong' })
    ).rejects.toThrow(UnauthorizedError);
  });
});
