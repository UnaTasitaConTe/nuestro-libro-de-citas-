class FakeTokenService {
  constructor() {
    this.signedPayloads = [];
  }

  sign(payload) {
    this.signedPayloads.push(payload);
    return `token:${JSON.stringify(payload)}`;
  }

  verify(token) {
    return JSON.parse(token.replace(/^token:/, ''));
  }
}

module.exports = FakeTokenService;
