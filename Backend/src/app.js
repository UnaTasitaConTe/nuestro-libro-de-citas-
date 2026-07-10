const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const authRoutes = require('./routes/auth');
const citasRoutes = require('./routes/citas');
const parejaRoutes = require('./routes/pareja');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/pareja', parejaRoutes);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Formato de imagen no soportado') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Error inesperado' });
});

module.exports = app;
