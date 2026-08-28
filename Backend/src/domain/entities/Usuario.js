const ROLE_VALUES = ['MEMBER', 'ADMIN'];

const Usuario = {
  ROLE_VALUES,

  toPublic(row) {
    return { id: row.id, email: row.email, name: row.name, role: row.role };
  },
};

module.exports = Usuario;
