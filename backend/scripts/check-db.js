require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'defect_tracker_pro',
  port: Number(process.env.DB_PORT || 5432),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function check() {
  await client.connect();
  console.log('Connected to DB:', process.env.DB_NAME);
  
  const tables = ['users', 'projects', 'issues', 'notifications', 'issue_comments'];
  for (const table of tables) {
    try {
      const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`Table "${table}" has ${res.rows[0].count} rows.`);
    } catch (e) {
      console.error(`Error querying table "${table}":`, e.message);
    }
  }
  await client.end();
}

check().catch(console.error);
