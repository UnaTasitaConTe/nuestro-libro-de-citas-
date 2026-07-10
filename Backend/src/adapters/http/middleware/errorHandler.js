const multer = require('multer');
const { ValidationError, UnauthorizedError, NotFoundError, ConflictError } = require('../../../domain/errors');

function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError || err.message === 'Formato de imagen no soportado') {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  if (err instanceof UnauthorizedError) return res.status(401).json({ error: err.message });
  if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
  if (err instanceof ConflictError) return res.status(409).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Error inesperado' });
}

module.exports = errorHandler;
