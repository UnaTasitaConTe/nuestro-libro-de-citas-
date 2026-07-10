class FakeUnitOfWork {
  constructor(repos) {
    this.repos = repos;
  }

  async withTransaction(fn) {
    const snapshots = Object.fromEntries(
      Object.entries(this.repos).map(([key, repo]) => [key, repo._snapshot()])
    );
    try {
      return await fn(this.repos);
    } catch (err) {
      Object.entries(this.repos).forEach(([key, repo]) => repo._restore(snapshots[key]));
      throw err;
    }
  }
}

module.exports = FakeUnitOfWork;
