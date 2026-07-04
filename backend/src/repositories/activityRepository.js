const pool = require('../config/database');

class ActivityRepository {
  async logActivity(userId, action, entityType, entityId) {
    const [, result] = await pool.execute(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?) RETURNING id',
      [userId, action, entityType, entityId]
    );
    return result.rows ? result.rows[0].id : null;
  }

  async findActivities(filters = {}) {
    let query = `
      SELECT al.*, u.full_name as user_name 
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.user_id) {
      query += ' AND al.user_id = ?';
      params.push(filters.user_id);
    }
    if (filters.entity_type) {
      query += ' AND al.entity_type = ?';
      params.push(filters.entity_type);
    }
    if (filters.entity_id) {
      query += ' AND al.entity_id = ?';
      params.push(filters.entity_id);
    }

    query += ' ORDER BY al.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const [rows] = await pool.execute(query, params);
    return rows;
  }
}

module.exports = new ActivityRepository();
