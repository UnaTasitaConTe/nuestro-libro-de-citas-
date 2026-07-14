require('dotenv/config');
const http = require('http');
const { app, authenticate, pubSubPort } = require('./app');
const { createIdeasWsServer } = require('./adapters/ws/ideasWsServer');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
createIdeasWsServer({ server, authenticate, pubSubPort });

server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
