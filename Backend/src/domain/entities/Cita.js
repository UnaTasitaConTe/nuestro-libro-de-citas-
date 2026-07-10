const { ValidationError } = require('../errors');

const REPETIRIAMOS_VALUES = ['SI', 'TALVEZ', 'NO'];

const Cita = {
  REPETIRIAMOS_VALUES,

  assertDeletable(entryCount) {
    if (entryCount >= 2) {
      throw new ValidationError(
        'No se puede borrar una cita cuando ambas versiones ya fueron contadas'
      );
    }
  },
};

module.exports = Cita;
