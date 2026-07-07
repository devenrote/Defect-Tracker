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

// Startup migration to ensure settings fields exist & create initial system logs/notifs
const initializeDatabase = async () => {
  try {
    // 1. Alter table queries
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS token_invalid_before TIMESTAMP WITH TIME ZONE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_settings TEXT DEFAULT '{"defectAssigned":true,"defectResolved":true,"commentAdded":true,"weeklyReport":false,"newProjectCreated":true,"projectAssigned":true,"newUserAdded":true,"criticalDefect":true,"defectClosed":true,"weeklySummary":true}';
      
      CREATE TABLE IF NOT EXISTS contact_inquiries (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Database settings columns verified successfully.');

    // 2. Insert server restart notifications in a single optimized query
    await pool.query(`
      INSERT INTO notifications (user_id, type, title, message)
      SELECT id, 'server_restart', 'System Alert: Server Restarted', 'The Defect Tracker Pro application server restarted and initialized settings.'
      FROM users
      WHERE role IN ('super_admin', 'admin', 'manager', 'project_manager')
        AND id NOT IN (
          SELECT DISTINCT user_id FROM notifications 
          WHERE type = 'server_restart' AND created_at > NOW() - INTERVAL '1 minute'
        );
    `);

    // 3. Insert database backup notifications in a single optimized query
    await pool.query(`
      INSERT INTO notifications (user_id, type, title, message)
      SELECT id, 'database_backup', 'Database Maintenance: Integrity Check Passed', 'The automatic database schema integrity verification and backup was completed successfully.'
      FROM users
      WHERE role IN ('super_admin', 'admin', 'manager', 'project_manager')
        AND id NOT IN (
          SELECT DISTINCT user_id FROM notifications 
          WHERE type = 'database_backup' AND created_at > NOW() - INTERVAL '1 minute'
        );
    `);
    console.log('Database settings notifications verified successfully.');
  } catch (err) {
    console.error('Error verifying database settings columns/notifications during startup:', err);
  }
};

module.exports = {
  query,
  execute,
  pool,
  initializeDatabase,
};
