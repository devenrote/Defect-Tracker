require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const seed = async () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'defect_tracker_pro',
    port: Number(process.env.DB_PORT || 5432),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  const password = await bcrypt.hash('Password123!', 10);

  console.log('Seeding database...');

  await client.query('TRUNCATE TABLE notifications, issue_history, issue_comments, issue_attachments, issues, project_members, projects, users RESTART IDENTITY CASCADE;');

  await client.query(
    `INSERT INTO users (full_name, email, password, role) VALUES
      ($1, $2, $3, $4),
      ($5, $6, $7, $8),
      ($9, $10, $11, $12),
      ($13, $14, $15, $16),
      ($17, $18, $19, $20),
      ($21, $22, $23, $24)`,
    [
      'Admin User', 'admin@defecttracker.com', password, 'super_admin',
      'John Tester', 'tester@defecttracker.com', password, 'tester',
      'Sarah Tester', 'sarah.tester@defecttracker.com', password, 'tester',
      'Mike Developer', 'developer@defecttracker.com', password, 'developer',
      'Emily Developer', 'emily.dev@defecttracker.com', password, 'developer',
      'Sarah Manager', 'manager@defecttracker.com', password, 'manager',
    ]
  );

  await client.query(
    `INSERT INTO projects (project_name, project_key, description, created_by) VALUES
      ($1, $2, $3, $4),
      ($5, $6, $7, $8),
      ($9, $10, $11, $12),
      ($13, $14, $15, $16)`,
    [
      'E-Commerce Platform', 'ECP', 'Online shopping platform with payment integration', 1,
      'Mobile Banking App', 'MBA', 'Secure mobile banking application for iOS and Android', 1,
      'HR Management System', 'HRM', 'Employee management and payroll system', 1,
      'Legacy CRM Migration', 'CRM', 'Migration of legacy CRM to cloud infrastructure', 1,
    ]
  );

  await client.query(
    `INSERT INTO issues (issue_key, project_id, title, description, status, priority, severity, issue_type, reporter_id, assignee_id)
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10),
      ($11, $12, $13, $14, $15, $16, $17, $18, $19, $20),
      ($21, $22, $23, $24, $25, $26, $27, $28, $29, $30),
      ($31, $32, $33, $34, $35, $36, $37, $38, $39, $40),
      ($41, $42, $43, $44, $45, $46, $47, $48, $49, $50),
      ($51, $52, $53, $54, $55, $56, $57, $58, $59, $60),
      ($61, $62, $63, $64, $65, $66, $67, $68, $69, $70),
      ($71, $72, $73, $74, $75, $76, $77, $78, $79, $80);`,
    [
      'ISSUE-1001', 1, 'Login button not responsive on mobile', 'The login button on the mobile viewport does not respond to touch events on iOS devices.', 'In Progress', 'Urgent', 'High', 'Bug', 2, 4,
      'ISSUE-1002', 1, 'Cart total calculation error', 'When applying multiple discount codes, the cart total shows incorrect values.', 'Assigned', 'Urgent', 'Critical', 'Bug', 2, 4,
      'ISSUE-1003', 1, 'Product image not loading', 'Product images fail to load on slow network connections.', 'Open', 'High', 'Medium', 'Bug', 3, null,
      'ISSUE-1004', 2, 'Biometric login fails on Android 14', 'Face unlock authentication fails intermittently on Android 14 devices.', 'Resolved', 'High', 'High', 'Bug', 2, 5,
      'ISSUE-1005', 2, 'Transaction history pagination bug', 'Pagination shows duplicate entries on transaction history page.', 'Verified', 'Medium', 'Low', 'Bug', 3, 5,
      'ISSUE-1006', 3, 'Leave request email not sent', 'Email notifications are not sent when leave requests are submitted.', 'Open', 'High', 'Medium', 'Bug', 3, null,
      'ISSUE-1007', 3, 'Payroll report export fails', 'Exporting payroll reports to PDF fails for large datasets.', 'Assigned', 'Urgent', 'High', 'Bug', 2, 4,
      'ISSUE-1008', 4, 'Data migration timeout', 'Large data sets cause migration scripts to timeout.', 'Closed', 'Urgent', 'Critical', 'Bug', 3, 5,
    ]
  );

  await client.query(
    `INSERT INTO issue_comments (issue_id, user_id, comment) VALUES
      ($1, $2, $3),
      ($4, $5, $6),
      ($7, $8, $9),
      ($10, $11, $12),
      ($13, $14, $15)`,
    [
      1, 2, 'Reproduced on iPhone 15 Pro with iOS 17.2',
      1, 4, 'Investigating touch event handlers in the login component.',
      2, 2, 'Occurs when stacking 2 or more promo codes.',
      4, 5, 'Fixed biometric API compatibility issue. Ready for testing.',
      5, 3, 'Verified fix on Android 13 and 14. Pagination works correctly now.',
    ]
  );

  await client.query(
    `INSERT INTO issue_history (issue_id, field_name, old_value, new_value, changed_by) VALUES
      ($1, $2, $3, $4, $5),
      ($6, $7, $8, $9, $10),
      ($11, $12, $13, $14, $15),
      ($16, $17, $18, $19, $20)`,
    [
      1, 'status', 'Open', 'Assigned', 1,
      1, 'status', 'Assigned', 'In Progress', 4,
      2, 'status', 'Open', 'Assigned', 1,
      4, 'status', 'In Progress', 'Resolved', 5,
    ]
  );

  await client.query(
    `INSERT INTO notifications (user_id, type, title, message, is_read, issue_id) VALUES
      ($1, $2, $3, $4, $5, $6),
      ($7, $8, $9, $10, $11, $12),
      ($13, $14, $15, $16, $17, $18),
      ($19, $20, $21, $22, $23, $24)`,
    [
      4, 'defect_assigned', 'Defect Assigned', 'You have been assigned defect: Login button not responsive on mobile', true, 1,
      4, 'defect_assigned', 'Defect Assigned', 'You have been assigned defect: Cart total calculation error', false, 2,
      5, 'defect_resolved', 'Defect Resolved', 'Defect resolved: Biometric login fails on Android 14', true, 4,
      2, 'comment_added', 'Comment Added', 'New comment on defect: Login button not responsive on mobile', true, 1,
    ]
  );

  console.log('Database seeded successfully!');
  console.log('Login credentials:');
  console.log('  Admin: admin@defecttracker.com');
  console.log('  Manager: manager@defecttracker.com');
  console.log('  Tester: tester@defecttracker.com');
  console.log('  Developer: developer@defecttracker.com');
  console.log('  Password: Password123!');

  await client.end();
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
