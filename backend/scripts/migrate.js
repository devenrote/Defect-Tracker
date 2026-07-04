const { pool } = require('../config/db');

const migrate = async () => {
  console.log('Running database migrations...');
  try {
    // Add columns to issues table
    await pool.query(`
      ALTER TABLE issues 
      ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS root_cause TEXT,
      ADD COLUMN IF NOT EXISTS solution TEXT,
      ADD COLUMN IF NOT EXISTS tech_notes TEXT,
      ADD COLUMN IF NOT EXISTS commit_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS pr_link VARCHAR(500),
      ADD COLUMN IF NOT EXISTS assigned_date TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS files_modified TEXT,
      ADD COLUMN IF NOT EXISTS estimated_time VARCHAR(100),
      ADD COLUMN IF NOT EXISTS actual_time VARCHAR(100),
      ADD COLUMN IF NOT EXISTS checklist TEXT,
      ADD COLUMN IF NOT EXISTS status_comment TEXT,
      ADD COLUMN IF NOT EXISTS sprint VARCHAR(100),
      ADD COLUMN IF NOT EXISTS story_points VARCHAR(20),
      ADD COLUMN IF NOT EXISTS estimated_effort VARCHAR(100),
      ADD COLUMN IF NOT EXISTS assignment_notes TEXT,
      ADD COLUMN IF NOT EXISTS assigned_by BIGINT;
    `);
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
};

migrate();
