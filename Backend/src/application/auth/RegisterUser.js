const crypto = require('crypto');
const { ConflictError, ValidationError } = require('../../domain/errors');
const Pareja = require('../../domain/entities/Pareja');
const Usuario = require('../../domain/entities/Usuario');
const { generateInviteCode } = require('../../domain/services/inviteCode');

function makeRegisterUser({ userRepository, unitOfWork, passwordHasher, tokenService, sessionPort, sessionTtlSeconds }) {
  async function execute({ email, password, name, inviteCode }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('Ese email ya está registrado');
    }

    const user = await unitOfWork.withTransaction(async (repos) => {
      let parejaId;
      if (inviteCode) {
        const pareja = await repos.parejaRepository.findByInviteCode(inviteCode);
        if (!pareja) {
          throw new ValidationError('Código de invitación inválido');
        }
        parejaId = pareja.id;

        const memberCount = await repos.userRepository.countByPareja(parejaId);
        Pareja.assertHasCapacity(memberCount);
      } else {
        const pareja = await repos.parejaRepository.create({ inviteCode: generateInviteCode() });
        parejaId = pareja.id;
      }

      const passwordHash = await passwordHasher.hash(password);
      return repos.userRepository.create({ parejaId, email, passwordHash, name });
    });

    const jti = crypto.randomUUID();
    const token = tokenService.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      parejaId: user.pareja_id,
      jti,
    });
    await sessionPort.create(jti, { userId: user.id }, sessionTtlSeconds);

    return { token, user: Usuario.toPublic(user) };
  }

  return { execute };
}

module.exports = makeRegisterUser;
