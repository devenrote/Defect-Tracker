-- Defect Tracker Pro - PostgreSQL Sample Test Data
-- NOTE: Use backend/scripts/seed.js instead for proper bcrypt password hashing.
-- Run: cd backend && npm run seed
-- Password for all demo users: Password123!

-- Connect to your target database before running this file:
-- psql -U postgres -d defect_tracker_pro -f database/sample-data.sql

INSERT INTO users (full_name, email, password, role) VALUES
('Admin User', 'admin@defecttracker.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'super_admin'),
('John Tester', 'tester@defecttracker.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'tester'),
('Sarah Tester', 'sarah.tester@defecttracker.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'tester'),
('Mike Developer', 'developer@defecttracker.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'developer'),
('Emily Developer', 'emily.dev@defecttracker.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'developer'),
('Sarah Manager', 'manager@defecttracker.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'manager');

INSERT INTO projects (project_name, project_key, description, status, created_by) VALUES
('E-Commerce Platform', 'ECP', 'Online shopping platform with payment integration', 'active', 1),
('Mobile Banking App', 'MBA', 'Secure mobile banking application for iOS and Android', 'active', 1),
('HR Management System', 'HRM', 'Employee management and payroll system', 'active', 1),
('Legacy CRM Migration', 'CRM', 'Migration of legacy CRM to cloud infrastructure', 'active', 1);

INSERT INTO issues (issue_key, project_id, title, description, status, priority, severity, issue_type, reporter_id, assignee_id) VALUES
('ISSUE-1001', 1, 'Login button not responsive on mobile', 'The login button on the mobile viewport does not respond to touch events on iOS devices.', 'In Progress', 'Urgent', 'High', 'Bug', 2, 4),
('ISSUE-1002', 1, 'Cart total calculation error', 'When applying multiple discount codes, the cart total shows incorrect values.', 'Assigned', 'Urgent', 'Critical', 'Bug', 2, 4),
('ISSUE-1003', 1, 'Product image not loading', 'Product images fail to load on slow network connections.', 'Open', 'High', 'Medium', 'Bug', 3, NULL),
('ISSUE-1004', 2, 'Biometric login fails on Android 14', 'Face unlock authentication fails intermittently on Android 14 devices.', 'Resolved', 'High', 'High', 'Bug', 2, 5),
('ISSUE-1005', 2, 'Transaction history pagination bug', 'Pagination shows duplicate entries on transaction history page.', 'Verified', 'Medium', 'Low', 'Bug', 3, 5),
('ISSUE-1006', 3, 'Leave request email not sent', 'Email notifications are not sent when leave requests are submitted.', 'Open', 'High', 'Medium', 'Bug', 3, NULL),
('ISSUE-1007', 3, 'Payroll report export fails', 'Exporting payroll reports to PDF fails for large datasets.', 'Assigned', 'Urgent', 'High', 'Bug', 2, 4),
('ISSUE-1008', 4, 'Data migration timeout', 'Large data sets cause migration scripts to timeout.', 'Closed', 'Urgent', 'Critical', 'Bug', 3, 5);

INSERT INTO issue_comments (issue_id, user_id, comment) VALUES
(1, 2, 'Reproduced on iPhone 15 Pro with iOS 17.2'),
(1, 4, 'Investigating touch event handlers in the login component.'),
(2, 2, 'Occurs when stacking 2 or more promo codes.'),
(4, 5, 'Fixed biometric API compatibility issue. Ready for testing.'),
(5, 3, 'Verified fix on Android 13 and 14. Pagination works correctly now.');

INSERT INTO issue_history (issue_id, field_name, old_value, new_value, changed_by) VALUES
(1, 'status', 'Open', 'Assigned', 1),
(1, 'status', 'Assigned', 'In Progress', 4),
(2, 'status', 'Open', 'Assigned', 1),
(4, 'status', 'In Progress', 'Resolved', 5);

INSERT INTO notifications (user_id, type, title, message, is_read, issue_id) VALUES
(4, 'defect_assigned', 'Defect Assigned', 'You have been assigned defect: Login button not responsive on mobile', TRUE, 1),
(4, 'defect_assigned', 'Defect Assigned', 'You have been assigned defect: Cart total calculation error', FALSE, 2),
(5, 'defect_resolved', 'Defect Resolved', 'Defect resolved: Biometric login fails on Android 14', TRUE, 4),
(2, 'comment_added', 'Comment Added', 'New comment on defect: Login button not responsive on mobile', TRUE, 1);
