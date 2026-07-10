const Usuario = {
  toPublic(row) {
    return { id: row.id, email: row.email, name: row.name };
  },
};

module.exports = Usuario;
