require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const pool    = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve o frontend estático (pasta ../frontend)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── Rotas da API ────────────────────────────────────────────
app.use('/auth', require('./routes/auth'));
app.use('/api',  require('./routes/data'));

// Qualquer rota desconhecida retorna o index.html (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ── Inicialização do banco ──────────────────────────────────
async function inicializarBanco() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('✔ Banco inicializado (tabelas e dados de exemplo prontos)');
}

// ── Start ───────────────────────────────────────────────────
inicializarBanco()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✔ VAULT rodando na porta ${PORT}`);
    });
  })
  .catch((e) => {
    console.error('✘ Falha ao inicializar banco:', e.message);
    process.exit(1);
  });
