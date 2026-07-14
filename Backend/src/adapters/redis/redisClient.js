const Redis = require('ioredis');

function createRedisClients(url) {
  const main = new Redis(url);
  const subscriber = new Redis(url);
  return { main, subscriber };
}

module.exports = { createRedisClients };
