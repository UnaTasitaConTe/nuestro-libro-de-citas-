const makeJoinPareja = require('../../../src/application/pareja/JoinPareja');
const InMemoryUserRepository = require('../../fakes/InMemoryUserRepository');
const InMemoryParejaRepository = require('../../fakes/InMemoryParejaRepository');
const InMemoryCitaRepository = require('../../fakes/InMemoryCitaRepository');
const InMemoryIdeaCitaRepository = require('../../fakes/InMemoryIdeaCitaRepository');
const FakeTokenService = require('../../fakes/FakeTokenService');
const FakeSessionPort = require('../../fakes/FakeSessionPort');
const { ValidationError } = require('../../../src/domain/errors');

function buildDeps() {
  const userRepository = new InMemoryUserRepository();
  const parejaRepository = new InMemoryParejaRepository();
  const citaRepository = new InMemoryCitaRepository();
  const ideaCitaRepository = new InMemoryIdeaCitaRepository();
  const sessionPort = new FakeSessionPort();
  const joinPareja = makeJoinPareja({
    userRepository,
    parejaRepository,
    citaRepository,
    ideaCitaRepository,
    tokenService: new FakeTokenService(),
    sessionPort,
    sessionTtlSeconds: 2592000,
  });
  return { userRepository, parejaRepository, citaRepository, ideaCitaRepository, sessionPort, joinPareja };
}

describe('JoinPareja', () => {
  it('mueve al usuario a la pareja del código de invitación y rota su sesión', async () => {
    const { userRepository, parejaRepository, sessionPort, joinPareja } = buildDeps();
    await parejaRepository.create({ inviteCode: 'MINE01' });
    await parejaRepository.create({ inviteCode: 'THEIRS' });
    const ana = await userRepository.create({ parejaId: 2, email: 'ana@test.com', passwordHash: 'x', name: 'Ana' });
    await sessionPort.create('old-jti', { userId: ana.id }, 100);

    const result = await joinPareja.execute({
      user: { id: ana.id, email: ana.email, name: ana.name, parejaId: 2, jti: 'old-jti' },
      inviteCode: 'MINE01',
    });

    expect(result.token).toBeTypeOf('string');
    expect((await userRepository.findByEmail('ana@test.com')).pareja_id).toBe(1);
    expect(await sessionPort.find('old-jti')).toBeNull();
  });

  it('rechaza un código de invitación inexistente', async () => {
    const { joinPareja } = buildDeps();

    await expect(
      joinPareja.execute({ user: { id: 1, parejaId: 1, jti: 'x' }, inviteCode: 'NOPE' })
    ).rejects.toThrow(ValidationError);
  });

  it('rechaza unirse a la propia pareja actual', async () => {
    const { parejaRepository, joinPareja } = buildDeps();
    await parejaRepository.create({ inviteCode: 'SAME01' });

    await expect(
      joinPareja.execute({ user: { id: 1, parejaId: 1, jti: 'x' }, inviteCode: 'SAME01' })
    ).rejects.toThrow(ValidationError);
  });

  it('rechaza si la pareja destino ya tiene 2 integrantes', async () => {
    const { userRepository, parejaRepository, joinPareja } = buildDeps();
    await parejaRepository.create({ inviteCode: 'MINE01' });
    await parejaRepository.create({ inviteCode: 'FULL01' });
    await userRepository.create({ parejaId: 2, email: 'm1@test.com', passwordHash: 'x', name: 'M1' });
    await userRepository.create({ parejaId: 2, email: 'm2@test.com', passwordHash: 'x', name: 'M2' });

    await expect(
      joinPareja.execute({ user: { id: 1, parejaId: 1, jti: 'x' }, inviteCode: 'FULL01' })
    ).rejects.toThrow(ValidationError);
  });

  it('rechaza si el usuario ya tiene citas guardadas en su pareja actual', async () => {
    const { citaRepository, parejaRepository, joinPareja } = buildDeps();
    await parejaRepository.create({ inviteCode: 'MINE01' });
    await parejaRepository.create({ inviteCode: 'THEIRS' });
    await citaRepository.create({ parejaId: 1, nombre: 'Cine', fecha: '2026-01-01', lugar: 'X', repetiriamos: 'SI' });

    await expect(
      joinPareja.execute({ user: { id: 1, parejaId: 1, jti: 'x' }, inviteCode: 'THEIRS' })
    ).rejects.toThrow(ValidationError);
  });

  it('rechaza si el usuario ya tiene ideas guardadas en su pareja actual', async () => {
    const { ideaCitaRepository, parejaRepository, joinPareja } = buildDeps();
    await parejaRepository.create({ inviteCode: 'MINE01' });
    await parejaRepository.create({ inviteCode: 'THEIRS' });
    await ideaCitaRepository.create({ parejaId: 1, userId: 1, titulo: 'Picnic', orden: 0 });

    await expect(
      joinPareja.execute({ user: { id: 1, parejaId: 1, jti: 'x' }, inviteCode: 'THEIRS' })
    ).rejects.toThrow(ValidationError);
  });
});
