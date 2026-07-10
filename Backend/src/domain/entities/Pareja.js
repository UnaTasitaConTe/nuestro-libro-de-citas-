const { ValidationError } = require('../errors');

const MAX_MIEMBROS_POR_PAREJA = 2;

const Pareja = {
  MAX_MIEMBROS_POR_PAREJA,

  assertHasCapacity(currentMemberCount) {
    if (currentMemberCount >= MAX_MIEMBROS_POR_PAREJA) {
      throw new ValidationError('Esa pareja ya tiene a sus dos integrantes');
    }
  },
};

module.exports = Pareja;
