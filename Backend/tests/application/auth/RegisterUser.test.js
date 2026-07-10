const makeRegisterUser = require('../../../src/application/auth/RegisterUser');
const InMemoryUserRepository = require('../../fakes/InMemoryUserRepository');
const InMemoryParejaRepository = require('../../fakes/InMemoryParejaRepository');
const FakeUnitOfWork = require('../../fakes/FakeUnitOfWork');
const FakePasswordHasher = require('../../fakes/FakePasswordHasher');
const FakeTokenService = require('../../fakes/FakeTokenService');
const { ConflictError, ValidationError } = require('../../../src/domain/errors');

describe('RegisterUser', () => {
  let userRepository;
  let parejaRepository;
  let unitOfWork;
  let registerUser;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    parejaRepository = new InMemoryParejaRepository();
    unitOfWork = new FakeUnitOfWork({ userRepository, parejaRepository });
    registerUser = makeRegisterUser({
      userRepository,
      unitOfWork,
      passwordHasher: new FakePasswordHasher(),
      tokenService: new FakeTokenService(),
    });
  });

  it('crea una pareja nueva cuando no se provee inviteCode', async () => {
    const result = await registerUser.execute({
      email: 'a@test.com',
      password: 'secret1',
      name: 'Ana',
    });

    expect(result.user).toEqual({ id: 1, email: 'a@test.com', name: 'Ana' });
    expect(await parejaRepository.findById(1)).not.toBeNull();
    expect(await userRepository.countByPareja(1)).toBe(1);
  });

  it('une al usuario a una pareja existente con inviteCode válido', async () => {
    await parejaRepository.create({ inviteCode: 'ABC123' });

    const result = await registerUser.execute({
      email: 'b@test.com',
      password: 'secret1',
      name: 'Beto',
      inviteCode: 'ABC123',
    });

    expect(result.user.email).toBe('b@test.com');
    expect(await userRepository.countByPareja(1)).toBe(1);
  });

  it('rechaza un inviteCode inexistente', async () => {
    await expect(
      registerUser.execute({
        email: 'c@test.com',
        password: 'secret1',
        name: 'Caro',
        inviteCode: 'NOPE',
      })
    ).rejects.toThrow(ValidationError);

    expect(await userRepository.findByEmail('c@test.com')).toBeNull();
  });

  it('rechaza unirse a una pareja que ya tiene 2 integrantes', async () => {
    await parejaRepository.create({ inviteCode: 'FULL01' });
    await userRepository.create({ parejaId: 1, email: 'm1@test.com', passwordHash: 'x', name: 'M1' });
    await userRepository.create({ parejaId: 1, email: 'm2@test.com', passwordHash: 'x', name: 'M2' });

    await expect(
      registerUser.execute({
        email: 'm3@test.com',
        password: 'secret1',
        name: 'M3',
        inviteCode: 'FULL01',
      })
    ).rejects.toThrow(ValidationError);

    expect(await userRepository.findByEmail('m3@test.com')).toBeNull();
  });

  it('rechaza un email ya registrado con ConflictError', async () => {
    await userRepository.create({ parejaId: 1, email: 'dup@test.com', passwordHash: 'x', name: 'Dup' });

    await expect(
      registerUser.execute({ email: 'dup@test.com', password: 'secret1', name: 'Otro' })
    ).rejects.toThrow(ConflictError);
  });

  it('hashea el password antes de guardarlo', async () => {
    await registerUser.execute({ email: 'hash@test.com', password: 'secret1', name: 'H' });
    const stored = await userRepository.findByEmail('hash@test.com');
    expect(stored.password_hash).toBe('hashed:secret1');
  });
});
