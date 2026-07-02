const pool = require('../config/database');

class DefectRepository {
  async findAll(filters = {}) {
    let query = `
      SELECT d.*, 
        p.project_name,
        r.full_name as reporter_name,
        a.full_name as assignee_name
      FROM issues d
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN users r ON d.reporter_id = r.id
      LEFT JOIN users a ON d.assignee_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.user_id && filters.role !== 'admin') {
      query += ' AND d.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
      params.push(filters.user_id);
    }

    if (filters.project_id) {
      query += ' AND d.project_id = ?';
      params.push(filters.project_id);
    }
    if (filters.status) {
      query += ' AND d.status = ?';
      params.push(filters.status);
    }
    if (filters.severity) {
      query += ' AND d.severity = ?';
      params.push(filters.severity);
    }
    if (filters.priority) {
      query += ' AND d.priority = ?';
      params.push(filters.priority);
    }
    if (filters.reported_by) {
      query += ' AND d.reporter_id = ?';
      params.push(filters.reported_by);
    }
    if (filters.assigned_to) {
      query += ' AND d.assignee_id = ?';
      params.push(filters.assigned_to);
    }
    if (filters.search) {
      query += ' AND (d.title LIKE ? OR d.description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY d.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT d.*, 
        p.project_name, p.description as project_description, p.status as project_status,
        r.full_name as reporter_name, r.email as reporter_email,
        a.full_name as assignee_name, a.email as assignee_email
      FROM issues d
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN users r ON d.reporter_id = r.id
      LEFT JOIN users a ON d.assignee_id = a.id
      WHERE d.id = ?`,
      [id]
    );
    return rows[0];
  }

  async create(defectData) {
    const { project_id, title, description, severity, priority, status, screenshot_url, reported_by, assigned_to, issue_type, issue_key } = defectData;
    const key = issue_key || `ISSUE-${Date.now()}`;
    const [, result] = await pool.execute(
      `INSERT INTO issues (issue_key, project_id, title, description, severity, priority, status, issue_type, screenshot_url, reporter_id, assignee_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [key, project_id, title, description, severity, priority, status || 'Open', issue_type || 'Bug', screenshot_url, reported_by, assigned_to]
    );
    return this.findById(result.rows[0].id);
  }

  async update(id, defectData) {
    const fields = [];
    const params = [];

    const allowedFields = ['project_id', 'title', 'description', 'severity', 'priority', 'status', 'issue_type', 'screenshot_url'];
    if (defectData.assigned_to !== undefined) {
      fields.push('assignee_id = ?');
      params.push(defectData.assigned_to);
    }
    for (const field of allowedFields) {
      if (defectData[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(defectData[field]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    await pool.execute(`UPDATE issues SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async delete(id) {
    await pool.execute('DELETE FROM issues WHERE id = ?', [id]);
    return true;
  }

  async count(filters = {}) {
    let query = 'SELECT COUNT(*) as count FROM issues WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.severity) {
      query += ' AND severity = ?';
      params.push(filters.severity);
    }
    if (filters.reported_by) {
      query += ' AND reporter_id = ?';
      params.push(filters.reported_by);
    }
    if (filters.assigned_to) {
      query += ' AND assignee_id = ?';
      params.push(filters.assigned_to);
    }
    if (filters.project_id) {
      query += ' AND project_id = ?';
      params.push(filters.project_id);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].count;
  }

  async getBySeverity(filters = {}) {
    let query = 'SELECT severity, COUNT(*) as count FROM issues WHERE 1=1';
    const params = [];
    if (filters.reported_by) {
      query += ' AND reporter_id = ?';
      params.push(filters.reported_by);
    }
    if (filters.assigned_to) {
      query += ' AND assignee_id = ?';
      params.push(filters.assigned_to);
    }
    if (filters.project_id) {
      query += ' AND project_id = ?';
      params.push(filters.project_id);
    }
    query += ' GROUP BY severity';
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async getByStatus(filters = {}) {
    let query = 'SELECT status, COUNT(*) as count FROM issues WHERE 1=1';
    const params = [];
    if (filters.reported_by) {
      query += ' AND reporter_id = ?';
      params.push(filters.reported_by);
    }
    if (filters.assigned_to) {
      query += ' AND assignee_id = ?';
      params.push(filters.assigned_to);
    }
    if (filters.project_id) {
      query += ' AND project_id = ?';
      params.push(filters.project_id);
    }
    query += ' GROUP BY status';
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async getByProject(filters = {}) {
    let sql = `
      SELECT p.project_name, COUNT(d.id) as count 
      FROM projects p LEFT JOIN issues d ON p.id = d.project_id 
    `;
    const params = [];
    if (filters.user_id && filters.role !== 'admin') {
      sql += ' INNER JOIN project_members pm ON p.id = pm.project_id WHERE pm.user_id = ?';
      params.push(filters.user_id);
    }
    sql += ' GROUP BY p.id, p.project_name';
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  async getByDeveloper(filters = {}) {
    let sql = `
      SELECT u.full_name as developer_name, COUNT(d.id) as count 
      FROM users u LEFT JOIN issues d ON u.id = d.assignee_id 
      WHERE u.role = 'developer'
    `;
    const params = [];
    if (filters.user_id && filters.role !== 'admin') {
      sql += ' AND d.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
      params.push(filters.user_id);
    }
    sql += ' GROUP BY u.id, u.full_name';
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  async getMonthlyTrends(filters = {}) {
    let sql = `
      SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count 
      FROM issues WHERE 1=1
    `;
    const params = [];
    if (filters.user_id && filters.role !== 'admin') {
      sql += ' AND project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
      params.push(filters.user_id);
    }
    sql += " GROUP BY TO_CHAR(created_at, 'YYYY-MM') ORDER BY month ASC";
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  async getStatusHistory(defectId) {
    const [rows] = await pool.execute(
      `SELECT h.*, u.full_name as changed_by_name 
       FROM issue_history h 
       LEFT JOIN users u ON h.changed_by = u.id 
       WHERE h.issue_id = ? ORDER BY h.changed_at ASC`,
      [defectId]
    );
    return rows;
  }

  async addStatusHistory(defectId, oldStatus, newStatus, changedBy) {
    await pool.execute(
      'INSERT INTO issue_history (issue_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?)',
      [defectId, 'status', oldStatus, newStatus, changedBy]
    );
  }
}

module.exports = new DefectRepository();
