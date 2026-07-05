const notificationRepository = require('../repositories/notificationRepository');
const pool = require('../config/database');

class NotificationService {
  async getNotifications(userId) {
    // Generate system notifications on demand for overdue, critical, and upcoming deadlines
    await this.generateSystemNotifications(userId);
    return notificationRepository.findByUserId(userId);
  }

  async getUnreadCount(userId) {
    // Also generate system notifications on unread count check so badges stay live
    await this.generateSystemNotifications(userId);
    return notificationRepository.getUnreadCount(userId);
  }

  async createNotification(notificationData) {
    return notificationRepository.create(notificationData);
  }

  async markAsRead(id, userId) {
    return notificationRepository.markAsRead(id, userId);
  }

  async markAllAsRead(userId) {
    return notificationRepository.markAllAsRead(userId);
  }

  async generateSystemNotifications(userId) {
    try {
      const [userRows] = await pool.execute('SELECT role FROM users WHERE id = ?', [userId]);
      if (userRows.length === 0) return;
      const userRole = userRows[0].role;
      const isManagerOrAdmin = ['admin', 'manager', 'project_manager'].includes(userRole);

      // 1. Overdue defects: due_date < NOW() and status not closed/resolved/verified
      let overdueQuery = `
        SELECT i.*, p.project_name 
        FROM issues i
        LEFT JOIN projects p ON i.project_id = p.id
        WHERE i.due_date IS NOT NULL AND i.due_date < NOW()
          AND i.status NOT IN ('Closed', 'Resolved', 'Verified')
      `;
      const overdueParams = [];
      if (!isManagerOrAdmin) {
        // Only show to assignee
        overdueQuery += ' AND i.assignee_id = ?';
        overdueParams.push(userId);
      }
      const [overdueIssues] = await pool.execute(overdueQuery, overdueParams);
      for (const issue of overdueIssues) {
        const [existing] = await pool.execute(
          'SELECT 1 FROM notifications WHERE user_id = ? AND issue_id = ? AND type = ?',
          [userId, issue.id, 'overdue_defect']
        );
        if (existing.length === 0) {
          await pool.execute(
            "INSERT INTO notifications (user_id, type, title, message, issue_id) VALUES (?, 'overdue_defect', 'Overdue Defect Alert', ?, ?)",
            [
              userId,
              `Defect "${issue.title}" in project "${issue.project_name || 'N/A'}" has passed its due date.`,
              issue.id
            ]
          );
        }
      }

      // 2. Critical defects: severity = 'Critical' and status not closed/resolved/verified
      let criticalQuery = `
        SELECT i.*, p.project_name 
        FROM issues i
        LEFT JOIN projects p ON i.project_id = p.id
        WHERE i.severity = 'Critical' AND i.status NOT IN ('Closed', 'Resolved', 'Verified')
      `;
      const criticalParams = [];
      if (!isManagerOrAdmin) {
        criticalQuery += ' AND i.assignee_id = ?';
        criticalParams.push(userId);
      }
      const [criticalIssues] = await pool.execute(criticalQuery, criticalParams);
      for (const issue of criticalIssues) {
        const [existing] = await pool.execute(
          'SELECT 1 FROM notifications WHERE user_id = ? AND issue_id = ? AND type = ?',
          [userId, issue.id, 'critical_defect']
        );
        if (existing.length === 0) {
          await pool.execute(
            "INSERT INTO notifications (user_id, type, title, message, issue_id) VALUES (?, 'critical_defect', 'Critical Defect Alert', ?, ?)",
            [
              userId,
              `A critical defect "${issue.title}" requires immediate attention in project "${issue.project_name || 'N/A'}".`,
              issue.id
            ]
          );
        }
      }

      // 3. Deadline reminders: due_date is in the next 48 hours and status not closed/resolved/verified
      let reminderQuery = `
        SELECT i.*, p.project_name 
        FROM issues i
        LEFT JOIN projects p ON i.project_id = p.id
        WHERE i.due_date IS NOT NULL 
          AND i.due_date >= NOW() 
          AND i.due_date <= NOW() + INTERVAL '2 days'
          AND i.status NOT IN ('Closed', 'Resolved', 'Verified')
      `;
      const reminderParams = [];
      if (!isManagerOrAdmin) {
        reminderQuery += ' AND i.assignee_id = ?';
        reminderParams.push(userId);
      }
      const [reminderIssues] = await pool.execute(reminderQuery, reminderParams);
      for (const issue of reminderIssues) {
        const [existing] = await pool.execute(
          'SELECT 1 FROM notifications WHERE user_id = ? AND issue_id = ? AND type = ?',
          [userId, issue.id, 'deadline_reminder']
        );
        if (existing.length === 0) {
          await pool.execute(
            "INSERT INTO notifications (user_id, type, title, message, issue_id) VALUES (?, 'deadline_reminder', 'Upcoming Deadline Reminder', ?, ?)",
            [
              userId,
              `Defect "${issue.title}" is approaching its due date (${new Date(issue.due_date).toLocaleDateString()}).`,
              issue.id
            ]
          );
        }
      }
    } catch (err) {
      console.error('Error generating system notifications:', err);
    }
  }
}

module.exports = new NotificationService();
