const express = require('express');
const pool    = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/profile
// Equivale a: get(ref(db, `users/${uid}`))
// Security Rule: "$uid === auth.uid"
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar perfil.' });
  }
});

// GET /api/public-data
// Equivale a: get(ref(db, "public-data/announcements"))
// Security Rule: "auth != null" — qualquer usuário autenticado
router.get('/public-data', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, title, body FROM announcements ORDER BY id'
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar dados públicos.' });
  }
});

// GET /api/admin-data
// Equivale a: get(ref(db, "admin-data"))
// Security Rule: "role === 'admin'" — bloqueado para user
router.get('/admin-data', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [reportsResult, settingsResult] = await Promise.all([
      pool.query('SELECT quarter, title, value FROM reports ORDER BY id'),
      pool.query('SELECT key, value FROM settings'),
    ]);

    const settings = {};
    for (const row of settingsResult.rows) {
      settings[row.key] = row.value === 'true' ? true
                        : row.value === 'false' ? false
                        : isNaN(row.value) ? row.value
                        : Number(row.value);
    }

    res.json({
      reports:  reportsResult.rows,
      settings: settings,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar dados administrativos.' });
  }
});

module.exports = router;
