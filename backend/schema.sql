-- ============================================================
-- VAULT — Schema PostgreSQL
-- Equivalente à estrutura de nós do Firebase Realtime Database
-- ============================================================

-- Tabela de usuários
-- Equivale a: /users/{uid}
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Tabela de avisos públicos
-- Equivale a: /public-data/announcements
CREATE TABLE IF NOT EXISTS announcements (
  id         SERIAL PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  body       TEXT         NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Tabela de relatórios (área admin)
-- Equivale a: /admin-data/reports
CREATE TABLE IF NOT EXISTS reports (
  id         SERIAL PRIMARY KEY,
  quarter    VARCHAR(10)  NOT NULL,
  title      VARCHAR(200) NOT NULL,
  value      NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Tabela de configurações (área admin)
-- Equivale a: /admin-data/settings
CREATE TABLE IF NOT EXISTS settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT         NOT NULL,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Configurações iniciais (inseridas apenas uma vez)
INSERT INTO settings (key, value) VALUES
  ('maintenanceMode', 'false'),
  ('totalUsers',      '0')
ON CONFLICT DO NOTHING;
