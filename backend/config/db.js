require('dotenv').config();
const { Pool } = require('pg');

const {
  DB_HOST = 'localhost',
  DB_PORT = 5432,
  DB_NAME = 'defect_tracker_pro',
  DB_USER = 'postgres',
  DB_PASSWORD = '',
  DB_SSL = 'false',
} = process.env;

const pool = new Pool({
  host: DB_HOST,
  port: Number(DB_PORT),
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error', err);
});

const toPostgresPlaceholders = (text) => {
  let index = 0;
  return text.replace(/\?/g, () => `$${++index}`);
};

const query = async (text, params = []) => {
  const sql = toPostgresPlaceholders(text);
  const result = await pool.query(sql, params);
  return result.rows;
};

const execute = async (text, params = []) => {
  const sql = toPostgresPlaceholders(text);
  const result = await pool.query(sql, params);
  return [result.rows, result];
};

module.exports = {
  query,
  execute,
  pool,
};
