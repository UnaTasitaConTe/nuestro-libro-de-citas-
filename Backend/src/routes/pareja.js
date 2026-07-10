const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/me', async (req, res) => {
  const { rows: parejaRows } = await pool.query(
    'SELECT id, invite_code, created_at FROM parejas WHERE id = $1',
    [req.user.parejaId]
  );
  const pareja = parejaRows[0];
  if (!pareja) return res.status(404).json({ error: 'Pareja no encontrada' });

  const { rows: members } = await pool.query(
    'SELECT id, name, email FROM users WHERE pareja_id = $1 ORDER BY id',
    [pareja.id]
  );

  res.json({
    id: pareja.id,
    inviteCode: pareja.invite_code,
    members,
  });
});

module.exports = router;
