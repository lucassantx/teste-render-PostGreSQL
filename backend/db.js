const { Pool } = require('pg');

// O Render injeta DATABASE_URL automaticamente no Web Service
// quando você linka um banco PostgreSQL ao serviço.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

module.exports = pool;
