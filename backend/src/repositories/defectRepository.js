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
        a.full_name as assignee_name, a.email as assignee_email,
        ab.full_name as assigned_by_name
      FROM issues d
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN users r ON d.reporter_id = r.id
      LEFT JOIN users a ON d.assignee_id = a.id
      LEFT JOIN users ab ON d.assigned_by = ab.id
      WHERE d.id = ?`,
      [id]
    );
    return rows[0];
  }

  async create(defectData) {
    const { project_id, title, description, severity, priority, status, screenshot_url, reported_by, assigned_to, issue_type, issue_key, module, environment, defect_category } = defectData;
    const key = issue_key || `ISSUE-${Date.now()}`;
    const [, result] = await pool.execute(
      `INSERT INTO issues (issue_key, project_id, title, description, severity, priority, status, issue_type, screenshot_url, reporter_id, assignee_id, module, environment, defect_category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [key, project_id, title, description, severity, priority, status || 'Open', issue_type || 'Bug', screenshot_url, reported_by, assigned_to, module || null, environment || null, defect_category || null]
    );
    return this.findById(result.rows[0].id);
  }

  async update(id, defectData) {
    const fields = [];
    const params = [];

    const allowedFields = ['project_id', 'title', 'description', 'severity', 'priority', 'status', 'issue_type', 'screenshot_url', 'due_date', 'root_cause', 'solution', 'tech_notes', 'commit_id', 'pr_link', 'files_modified', 'estimated_time', 'actual_time', 'checklist', 'status_comment', 'sprint', 'story_points', 'estimated_effort', 'assignment_notes', 'assigned_by', 'module', 'environment', 'defect_category'];
    if (defectData.assigned_to !== undefined) {
      fields.push('assignee_id = ?');
      params.push(defectData.assigned_to);
      fields.push('assigned_date = NOW()');
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
    let query = 'SELECT severity, CAST(COUNT(*) AS INTEGER) as count FROM issues WHERE 1=1';
    const params = [];
    if (filters.project_id) {
      query += ' AND project_id = ?';
      params.push(filters.project_id);
    }
    if (filters.startDate) {
      query += ' AND created_at >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ' AND created_at <= ?';
      params.push(filters.endDate);
    }
    if (filters.reported_by) {
      query += ' AND reporter_id = ?';
      params.push(filters.reported_by);
    }
    if (filters.assigned_to) {
      query += ' AND assignee_id = ?';
      params.push(filters.assigned_to);
    }
    if (filters.user_id && filters.role !== 'admin') {
      query += ' AND project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
      params.push(filters.user_id);
    }
    query += ' GROUP BY severity';
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async getByStatus(filters = {}) {
    let query = 'SELECT status, CAST(COUNT(*) AS INTEGER) as count FROM issues WHERE 1=1';
    const params = [];
    if (filters.project_id) {
      query += ' AND project_id = ?';
      params.push(filters.project_id);
    }
    if (filters.startDate) {
      query += ' AND created_at >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ' AND created_at <= ?';
      params.push(filters.endDate);
    }
    if (filters.reported_by) {
      query += ' AND reporter_id = ?';
      params.push(filters.reported_by);
    }
    if (filters.assigned_to) {
      query += ' AND assignee_id = ?';
      params.push(filters.assigned_to);
    }
    if (filters.user_id && filters.role !== 'admin') {
      query += ' AND project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
      params.push(filters.user_id);
    }
    query += ' GROUP BY status';
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async getByProject(filters = {}) {
    let sql = `
      SELECT p.project_name, CAST(COUNT(d.id) AS INTEGER) as count 
      FROM projects p 
      LEFT JOIN issues d ON p.id = d.project_id 
    `;
    const params = [];
    let whereClauses = [];

    if (filters.user_id && filters.role !== 'admin') {
      sql += ' INNER JOIN project_members pm ON p.id = pm.project_id ';
      whereClauses.push('pm.user_id = ?');
      params.push(filters.user_id);
    }

    if (filters.project_id) {
      whereClauses.push('p.id = ?');
      params.push(filters.project_id);
    }

    if (filters.startDate) {
      whereClauses.push('(d.created_at IS NULL OR d.created_at >= ?)');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      whereClauses.push('(d.created_at IS NULL OR d.created_at <= ?)');
      params.push(filters.endDate);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ' GROUP BY p.id, p.project_name';
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  async getByDeveloper(filters = {}) {
    let sql = `
      SELECT u.full_name as developer_name, CAST(COUNT(d.id) AS INTEGER) as count 
      FROM users u 
      LEFT JOIN issues d ON u.id = d.assignee_id 
    `;
    const params = [];
    let whereClauses = ["u.role = 'developer'"];

    if (filters.project_id) {
      whereClauses.push('(d.project_id IS NULL OR d.project_id = ?)');
      params.push(filters.project_id);
    }
    if (filters.startDate) {
      whereClauses.push('(d.created_at IS NULL OR d.created_at >= ?)');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      whereClauses.push('(d.created_at IS NULL OR d.created_at <= ?)');
      params.push(filters.endDate);
    }
    if (filters.user_id && filters.role !== 'admin') {
      whereClauses.push('(d.project_id IS NULL OR d.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?))');
      params.push(filters.user_id);
    }

    sql += ' WHERE ' + whereClauses.join(' AND ');
    sql += ' GROUP BY u.id, u.full_name';
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  async getMonthlyTrends(filters = {}) {
    let sql = '';
    
    let whereClause = 'WHERE 1=1';
    const params1 = [];
    if (filters.role === 'developer') {
      whereClause += ' AND assignee_id = ?';
      params1.push(filters.user_id);
      if (filters.project_id) {
        whereClause += ' AND project_id = ?';
        params1.push(filters.project_id);
      }
    } else if (filters.project_id) {
      whereClause += ' AND project_id = ?';
      params1.push(filters.project_id);
    } else if (filters.user_id && filters.role !== 'admin') {
      whereClause += ' AND project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
      params1.push(filters.user_id);
    }
    
    let histWhereClause = "WHERE h.field_name = 'status' AND h.new_value = 'Resolved'";
    const params2 = [];
    if (filters.role === 'developer') {
      histWhereClause += ' AND i.assignee_id = ?';
      params2.push(filters.user_id);
      if (filters.project_id) {
        histWhereClause += ' AND i.project_id = ?';
        params2.push(filters.project_id);
      }
    } else if (filters.project_id) {
      histWhereClause += ' AND i.project_id = ?';
      params2.push(filters.project_id);
    } else if (filters.user_id && filters.role !== 'admin') {
      histWhereClause += ' AND i.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
      params2.push(filters.user_id);
    }

    sql = `
      SELECT 
        COALESCE(c.month, r.month) as month,
        COALESCE(c.created_count, 0) as defects,
        COALESCE(r.resolved_count, 0) as resolved
      FROM (
        SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as created_count
        FROM issues
        ${whereClause}
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ) c
      FULL OUTER JOIN (
        SELECT TO_CHAR(h.changed_at, 'YYYY-MM') as month, COUNT(*) as resolved_count
        FROM issue_history h
        JOIN issues i ON h.issue_id = i.id
        ${histWhereClause}
        GROUP BY TO_CHAR(h.changed_at, 'YYYY-MM')
      ) r ON c.month = r.month
      ORDER BY month ASC
      LIMIT 12
    `;

    const queryParams = [...params1, ...params2];
    const [rows] = await pool.execute(sql, queryParams);

    return rows.map(r => {
      if (!r.month) return { month: 'N/A', defects: 0, resolved: 0 };
      const parts = r.month.split('-');
      const date = new Date(parts[0], parts[1] - 1, 1);
      const monthName = date.toLocaleString('en-US', { month: 'short' });
      return {
        month: monthName,
        defects: parseInt(r.defects, 10),
        resolved: parseInt(r.resolved, 10)
      };
    });
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
  async addHistory(defectId, fieldName, oldValue, newValue, changedBy) {
    await pool.execute(
      'INSERT INTO issue_history (issue_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?)',
      [defectId, fieldName, oldValue, newValue, changedBy]
    );
  }
  async getAttachments(defectId) {
    const [rows] = await pool.execute(
      `SELECT a.*, u.full_name as uploaded_by_name 
       FROM issue_attachments a 
       LEFT JOIN users u ON a.uploaded_by = u.id 
       WHERE a.issue_id = ? ORDER BY a.uploaded_at ASC`,
      [defectId]
    );
    return rows;
  }

  async getDeveloperPerformance(filters = {}) {
    let sql = `
      SELECT 
        u.full_name as developer_name,
        COUNT(d.id) as assigned_defects,
        COUNT(CASE WHEN d.status IN ('Resolved', 'Verified', 'Closed') THEN 1 END) as resolved_defects,
        COUNT(CASE WHEN d.status NOT IN ('Resolved', 'Verified', 'Closed') THEN 1 END) as open_defects,
        AVG(CASE WHEN d.status IN ('Resolved', 'Verified', 'Closed') THEN EXTRACT(EPOCH FROM (d.updated_at - d.created_at))/3600 END) as avg_resolution_time
      FROM users u
      LEFT JOIN issues d ON u.id = d.assignee_id
    `;
    const params = [];
    let whereClauses = ["u.role = 'developer'"];

    if (filters.project_id) {
      whereClauses.push('d.project_id = ?');
      params.push(filters.project_id);
    }
    if (filters.startDate) {
      whereClauses.push('d.created_at >= ?');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      whereClauses.push('d.created_at <= ?');
      params.push(filters.endDate);
    }
    if (filters.user_id && filters.role !== 'admin') {
      whereClauses.push('d.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)');
      params.push(filters.user_id);
    }

    sql += ' WHERE ' + whereClauses.join(' AND ');
    sql += ' GROUP BY u.id, u.full_name';
    const [rows] = await pool.execute(sql, params);
    
    return rows.map(r => ({
      developer: r.developer_name,
      assignedDefects: parseInt(r.assigned_defects, 10),
      resolvedDefects: parseInt(r.resolved_defects, 10),
      openDefects: parseInt(r.open_defects, 10),
      avgResolutionTime: r.avg_resolution_time ? Math.round(Number(r.avg_resolution_time) * 10) / 10 : 0
    }));
  }

  async getTopCriticalDefects(filters = {}) {
    let sql = `
      SELECT d.id, d.title, p.project_name, u.full_name as assignee_name, d.priority, d.status, d.created_at
      FROM issues d
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN users u ON d.assignee_id = u.id
      WHERE d.severity = 'Critical' AND d.status NOT IN ('Closed', 'Verified', 'Resolved')
    `;
    const params = [];
    
    if (filters.project_id) {
      sql += ' AND d.project_id = ?';
      params.push(filters.project_id);
    }
    if (filters.startDate) {
      sql += ' AND d.created_at >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      sql += ' AND d.created_at <= ?';
      params.push(filters.endDate);
    }
    if (filters.user_id && filters.role !== 'admin') {
      sql += ' AND d.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
      params.push(filters.user_id);
    }
    
    sql += ' ORDER BY d.created_at ASC LIMIT 5';
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  async getFilteredDefects(filters = {}) {
    let sql = `
      SELECT d.id, d.title, p.project_name, d.priority, d.severity, d.status, 
             r.full_name as reporter_name, a.full_name as assignee_name, 
             d.created_at, d.updated_at
      FROM issues d
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN users r ON d.reporter_id = r.id
      LEFT JOIN users a ON d.assignee_id = a.id
      WHERE 1=1
    `;
    const params = [];
    
    if (filters.project_id) {
      sql += ' AND d.project_id = ?';
      params.push(filters.project_id);
    }
    if (filters.startDate) {
      sql += ' AND d.created_at >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      sql += ' AND d.created_at <= ?';
      params.push(filters.endDate);
    }
    if (filters.user_id && filters.role !== 'admin') {
      sql += ' AND d.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
      params.push(filters.user_id);
    }
    
    sql += ' ORDER BY d.created_at DESC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  }
}

module.exports = new DefectRepository();
