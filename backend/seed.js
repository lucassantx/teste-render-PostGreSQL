// ============================================================
// VAULT — seed.js
// Popula o banco com dados fictícios para testes.
//
// Como usar:
//   Localmente:  node seed.js
//   No Render:   cole o conteúdo no PSQL ou rode via SSH
//
// ⚠️  ATENÇÃO: este script apaga todos os dados antes de inserir.
//     Não rode em produção com dados reais.
// ============================================================

require('dotenv').config();
const bcrypt = require('bcrypt');
const pool   = require('./db');

const SALT_ROUNDS = 12;

async function seed() {
  console.log('🌱 Iniciando seed...\n');

  // ── Limpa todas as tabelas ────────────────────────────────
  await pool.query('TRUNCATE TABLE users, announcements, reports, settings RESTART IDENTITY CASCADE');
  console.log('✔ Tabelas limpas');

  // ── Usuários fictícios ────────────────────────────────────
  // Equivale a: createUserWithEmailAndPassword + set(ref(db, `users/${uid}`))
  const usuarios = [
    { name: 'Lucas Admin',    email: 'lucas@vault.com',   password: 'senha123', role: 'admin' },
    { name: 'Ana Souza',      email: 'ana@vault.com',     password: 'senha123', role: 'user'  },
    { name: 'Carlos Lima',    email: 'carlos@vault.com',  password: 'senha123', role: 'user'  },
    { name: 'Mariana Costa',  email: 'mariana@vault.com', password: 'senha123', role: 'admin' },
    { name: 'Pedro Alves',    email: 'pedro@vault.com',   password: 'senha123', role: 'user'  },
  ];

  for (const u of usuarios) {
    const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [u.name, u.email, hash, u.role]
    );
    console.log(`  ✔ Usuário criado: ${u.email} (${u.role})`);
  }

  // ── Avisos públicos ───────────────────────────────────────
  await pool.query(`
    INSERT INTO announcements (title, body) VALUES
      ('Sistema online',        'Acesso disponível para todos os usuários.'),
      ('Versão atual',          'Atualizado em Maio de 2026.'),
      ('Manutenção programada', 'Sistema ficará indisponível dia 30/05 das 2h às 4h.'),
      ('Nova funcionalidade',   'Painel administrativo atualizado com filtros por período.')
  `);
  console.log('\n✔ Avisos públicos inseridos');

  // ── Relatórios administrativos ────────────────────────────
  await pool.query(`
    INSERT INTO reports (quarter, title, value) VALUES
      ('Q1', 'Relatório Q1',  1621.00),
      ('Q2', 'Relatório Q2',  3425.00),
      ('Q3', 'Relatório Q3',  8750.00),
      ('Q4', 'Relatório Q4', 12340.50)
  `);
  console.log('✔ Relatórios inseridos');

  // ── Configurações ─────────────────────────────────────────
  await pool.query(`
    INSERT INTO settings (key, value) VALUES
      ('maintenanceMode', 'false'),
      ('totalUsers',      '5')
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `);
  console.log('✔ Configurações inseridas');

  console.log('\n✅ Seed concluído! Usuários disponíveis para login:');
  console.log('─────────────────────────────────────────────');
  for (const u of usuarios) {
    console.log(`  ${u.role.padEnd(5)}  ${u.email.padEnd(22)}  senha: ${u.password}`);
  }
  console.log('─────────────────────────────────────────────');

  await pool.end();
}

seed().catch((e) => {
  console.error('✘ Erro no seed:', e.message);
  process.exit(1);
});
