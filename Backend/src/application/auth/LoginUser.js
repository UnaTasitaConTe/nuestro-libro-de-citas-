const { UnauthorizedError } = require('../../domain/errors');
const Usuario = require('../../domain/entities/Usuario');

function makeLoginUser({ userRepository, passwordHasher, tokenService }) {
  async function execute({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const valid = await passwordHasher.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const token = tokenService.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      parejaId: user.pareja_id,
    });

    return { token, user: Usuario.toPublic(user) };
  }

  return { execute };
}

module.exports = makeLoginUser;
