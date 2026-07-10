class FakePasswordHasher {
  async hash(plain) {
    return `hashed:${plain}`;
  }

  async compare(plain, hash) {
    return hash === `hashed:${plain}`;
  }
}

module.exports = FakePasswordHasher;
