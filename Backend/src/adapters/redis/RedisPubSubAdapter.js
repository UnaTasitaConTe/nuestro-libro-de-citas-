class RedisPubSubAdapter {
  constructor(main, subscriber) {
    this.main = main;
    this.subscriber = subscriber;
    this.handlers = new Map();

    this.subscriber.on('message', (channel, message) => {
      const channelHandlers = this.handlers.get(channel);
      if (!channelHandlers) return;
      for (const handler of channelHandlers) handler(message);
    });
  }

  async publish(channel, message) {
    await this.main.publish(channel, message);
  }

  subscribe(channel, handler) {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, []);
      this.subscriber.subscribe(channel).catch(() => {});
    }
    this.handlers.get(channel).push(handler);
  }
}

module.exports = RedisPubSubAdapter;
