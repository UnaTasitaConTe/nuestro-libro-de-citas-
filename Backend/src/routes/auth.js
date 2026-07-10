const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const pool = require('../db');

const router = express.Router();

const MAX_MIEMBROS_POR_PAREJA = 2;

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  inviteCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, parejaId: user.pareja_id },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function generateInviteCode() {
  return crypto.randomBytes(5).toString('base64url');
}

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password, name, inviteCode } = parsed.data;

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Ese email ya está registrado' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let parejaId;
    if (inviteCode) {
      const { rows: parejaRows } = await client.query(
        'SELECT id FROM parejas WHERE invite_code = $1',
        [inviteCode]
      );
      if (!parejaRows[0]) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Código de invitación inválido' });
      }
      parejaId = parejaRows[0].id;

      const { rows: countRows } = await client.query(
        'SELECT count(*)::int AS count FROM users WHERE pareja_id = $1',
        [parejaId]
      );
      if (countRows[0].count >= MAX_MIEMBROS_POR_PAREJA) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Esa pareja ya tiene a sus dos integrantes' });
      }
    } else {
      const { rows: parejaRows } = await client.query(
        'INSERT INTO parejas (invite_code) VALUES ($1) RETURNING id',
        [generateInviteCode()]
      );
      parejaId = parejaRows[0].id;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await client.query(
      'INSERT INTO users (pareja_id, email, password_hash, name) VALUES ($1, $2, $3, $4) RETURNING id, pareja_id, email, name',
      [parejaId, email, passwordHash, name]
    );
    const user = rows[0];

    await client.query('COMMIT');

    const token = signToken(user);
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password } = parsed.data;

  const { rows } = await pool.query(
    'SELECT id, pareja_id, email, name, password_hash FROM users WHERE email = $1',
    [email]
  );
  const user = rows[0];
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = signToken(user);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

module.exports = router;
