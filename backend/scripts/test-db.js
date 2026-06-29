require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const {
    DB_HOST = 'localhost',
    DB_USER = 'postgres',
    DB_PASSWORD = '',
    DB_PORT = 5432,
    DB_NAME = 'defect_tracker_pro',
    DB_SSL = 'false',
  } = process.env;

  console.log(`Testing PostgreSQL connection to ${DB_HOST}:${DB_PORT} as ${DB_USER}`);
  try {
    const client = new Client({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: Number(DB_PORT),
      ssl: DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      database: DB_NAME,
    });

    await client.connect();
    const { rows } = await client.query('SELECT 1 as ok');
    console.log('Connected to database', DB_NAME, '->', rows[0]);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Connection error:', err.message || err);
    process.exit(1);
  }
})();
