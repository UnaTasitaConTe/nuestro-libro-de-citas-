function makeLogoutUser({ sessionPort }) {
  async function execute({ jti }) {
    await sessionPort.revoke(jti);
  }

  return { execute };
}

module.exports = makeLogoutUser;
