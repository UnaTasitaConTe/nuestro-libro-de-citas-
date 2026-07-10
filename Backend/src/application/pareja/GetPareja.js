const { NotFoundError } = require('../../domain/errors');

function makeGetPareja({ parejaRepository, userRepository }) {
  async function execute({ parejaId }) {
    const pareja = await parejaRepository.findById(parejaId);
    if (!pareja) {
      throw new NotFoundError('Pareja no encontrada');
    }

    const members = await userRepository.findMembersByPareja(pareja.id);

    return { id: pareja.id, inviteCode: pareja.invite_code, members };
  }

  return { execute };
}

module.exports = makeGetPareja;
