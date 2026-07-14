const express = require('express');
const cors = require('cors');
const path = require('path');
const createAuthRouter = require('./adapters/http/routes/auth.routes');
const createParejaRouter = require('./adapters/http/routes/pareja.routes');
const createCitasRouter = require('./adapters/http/routes/citas.routes');
const createIdeasCitasRouter = require('./adapters/http/routes/ideasCitas.routes');
const errorHandler = require('./adapters/http/middleware/errorHandler');
const { buildContainer } = require('./composition/container');

const { useCases, fileStorage, requireAuth, authenticate, rateLimiterPort, pubSubPort } = buildContainer();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', createAuthRouter({ useCases, requireAuth, rateLimiterPort }));
app.use('/api/citas', createCitasRouter({ requireAuth, useCases, fileStorage }));
app.use('/api/pareja', createParejaRouter({ requireAuth, useCases }));
app.use('/api/ideas-citas', createIdeasCitasRouter({ requireAuth, useCases }));

app.use(errorHandler);

module.exports = { app, authenticate, pubSubPort };
