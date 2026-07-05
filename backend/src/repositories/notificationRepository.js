const pool = require('../config/database');

class NotificationRepository {
  async findByUserId(userId, unreadOnly = false) {
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [userId];

    if (unreadOnly) {
      query += ' AND is_read = FALSE';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async create(notificationData) {
    const { user_id, type, title, message, issue_id } = notificationData;
    const [, result] = await pool.execute(
      'INSERT INTO notifications (user_id, type, title, message, issue_id) VALUES (?, ?, ?, ?, ?) RETURNING id',
      [user_id, type, title, message, issue_id]
    );
    const [rows] = await pool.execute('SELECT * FROM notifications WHERE id = ?', [result.rows[0].id]);
    return rows[0];
  }

  async markAsRead(id, userId) {
    await pool.execute('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, userId]);
    const [rows] = await pool.execute('SELECT * FROM notifications WHERE id = ?', [id]);
    return rows[0];
  }

  async markAllAsRead(userId) {
    await pool.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
    return true;
  }

  async getUnreadCount(userId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return rows[0].count;
  }

  async notifyAdminsAndManagers(type, title, message, targetId = null) {
    try {
      const [users] = await pool.execute(
        "SELECT id FROM users WHERE role IN ('admin', 'manager', 'project_manager')"
      );
      for (const u of users) {
        await this.create({
          user_id: u.id,
          type,
          title,
          message,
          issue_id: targetId
        });
      }
    } catch (err) {
      console.error('Error in notifyAdminsAndManagers helper:', err);
    }
  }
}

module.exports = new NotificationRepository();
