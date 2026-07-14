const crypto = require('crypto');
const { ValidationError } = require('../../domain/errors');
const Pareja = require('../../domain/entities/Pareja');

function makeJoinPareja({
  userRepository,
  parejaRepository,
  citaRepository,
  ideaCitaRepository,
  tokenService,
  sessionPort,
  sessionTtlSeconds,
}) {
  async function execute({ user, inviteCode }) {
    const targetPareja = await parejaRepository.findByInviteCode(inviteCode);
    if (!targetPareja) {
      throw new ValidationError('Código de invitación inválido');
    }
    if (targetPareja.id === user.parejaId) {
      throw new ValidationError('Ya perteneces a esta pareja');
    }

    const memberCount = await userRepository.countByPareja(targetPareja.id);
    Pareja.assertHasCapacity(memberCount);

    const citasCount = await citaRepository.countByPareja(user.parejaId);
    const ideas = await ideaCitaRepository.listByPareja(user.parejaId);
    if (citasCount > 0 || ideas.length > 0) {
      throw new ValidationError(
        'Ya tienes citas o ideas guardadas en tu libro actual; no podemos unirte a otra pareja automáticamente'
      );
    }

    await userRepository.updateParejaId(user.id, targetPareja.id);

    const jti = crypto.randomUUID();
    const token = tokenService.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      parejaId: targetPareja.id,
      jti,
    });
    await sessionPort.create(jti, { userId: user.id }, sessionTtlSeconds);
    await sessionPort.revoke(user.jti);

    return { token };
  }

  return { execute };
}

module.exports = makeJoinPareja;
