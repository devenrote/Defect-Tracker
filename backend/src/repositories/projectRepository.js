const pool = require('../config/database');

class ProjectRepository {
  async findAll(filters = {}) {
    let query = 'SELECT p.* FROM projects p WHERE 1=1';
    const params = [];

    if (filters.user_id && filters.role !== 'admin') {
      query = `
        SELECT p.* FROM projects p
        INNER JOIN project_members pm ON p.id = pm.project_id
        WHERE pm.user_id = ?
      `;
      params.push(filters.user_id);
    }

    if (filters.status) {
      query += ' AND p.status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (p.project_name LIKE ? OR p.description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM projects WHERE id = ?', [id]);
    return rows[0];
  }

  async create(projectData) {
    const { project_name, project_key, description, status, created_by } = projectData;
    const key = project_key || project_name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substring(0, 5)
      .toUpperCase() || `PRJ-${Date.now()}`;
    const [, result] = await pool.execute(
      'INSERT INTO projects (project_name, project_key, description, status, created_by) VALUES (?, ?, ?, ?, ?) RETURNING id',
      [project_name, key, description, status || 'active', created_by]
    );
    return this.findById(result.rows[0].id);
  }

  async update(id, projectData) {
    const fields = [];
    const params = [];

    if (projectData.project_name) {
      fields.push('project_name = ?');
      params.push(projectData.project_name);
    }
    if (projectData.description !== undefined) {
      fields.push('description = ?');
      params.push(projectData.description);
    }
    if (projectData.status) {
      fields.push('status = ?');
      params.push(projectData.status);
    }

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    await pool.execute(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async delete(id) {
    await pool.execute('DELETE FROM projects WHERE id = ?', [id]);
    return true;
  }

  async count() {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM projects');
    return rows[0].count;
  }

  async getStatistics(id) {
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_defects,
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_defects,
        SUM(CASE WHEN status IN ('Resolved', 'Verified', 'Closed') THEN 1 ELSE 0 END) as resolved_defects,
        SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as critical_defects
      FROM issues WHERE project_id = ?`,
      [id]
    );
    return stats[0];
  }

  async isMember(projectId, userId) {
    const [rows] = await pool.execute(
      'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );
    return rows.length > 0;
  }
}

module.exports = new ProjectRepository();
