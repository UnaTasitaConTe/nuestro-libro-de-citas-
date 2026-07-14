const { WebSocketServer } = require('ws');
const { IDEAS_CHANGES_CHANNEL } = require('../../application/shared/channels');

function createIdeasWsServer({ server, authenticate, pubSubPort }) {
  const wss = new WebSocketServer({ server, path: '/api/ideas-citas/ws' });

  wss.on('connection', async (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    try {
      const payload = await authenticate(token);
      ws.parejaId = payload.parejaId;
    } catch {
      ws.close(4001, 'No autenticado');
    }
  });

  pubSubPort.subscribe(IDEAS_CHANGES_CHANNEL, (message) => {
    let parejaId;
    try {
      ({ parejaId } = JSON.parse(message));
    } catch {
      return;
    }

    for (const client of wss.clients) {
      if (client.parejaId === parejaId && client.readyState === client.OPEN) {
        client.send('changed');
      }
    }
  });

  return wss;
}

module.exports = { createIdeasWsServer };
