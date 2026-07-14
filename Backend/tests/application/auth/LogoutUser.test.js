const makeLogoutUser = require('../../../src/application/auth/LogoutUser');
const FakeSessionPort = require('../../fakes/FakeSessionPort');

describe('LogoutUser', () => {
  it('revoca la sesión asociada al jti', async () => {
    const sessionPort = new FakeSessionPort();
    await sessionPort.create('jti-1', { userId: 1 }, 100);

    const logoutUser = makeLogoutUser({ sessionPort });
    await logoutUser.execute({ jti: 'jti-1' });

    expect(await sessionPort.find('jti-1')).toBeNull();
  });
});
