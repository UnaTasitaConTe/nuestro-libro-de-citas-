class FakePubSubPort {
  constructor() {
    this.published = [];
    this.handlers = new Map();
  }

  async publish(channel, message) {
    this.published.push({ channel, message });
    for (const handler of this.handlers.get(channel) || []) handler(message);
  }

  subscribe(channel, handler) {
    if (!this.handlers.has(channel)) this.handlers.set(channel, []);
    this.handlers.get(channel).push(handler);
  }
}

module.exports = FakePubSubPort;
