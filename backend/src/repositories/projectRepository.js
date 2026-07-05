const pool = require('../config/database');

class ProjectRepository {
  async findAll(filters = {}) {
    let baseQuery = 'FROM projects p WHERE 1=1';
    const params = [];

    if (filters.user_id && filters.role !== 'admin') {
      baseQuery = `
        FROM projects p
        INNER JOIN project_members pm ON p.id = pm.project_id
        WHERE pm.user_id = ?
      `;
      params.push(filters.user_id);
    }

    if (filters.status) {
      if (baseQuery.includes('WHERE')) {
        baseQuery += ' AND p.status = ?';
      } else {
        baseQuery += ' WHERE p.status = ?';
      }
      params.push(filters.status);
    }

    if (filters.search) {
      if (baseQuery.includes('WHERE')) {
        baseQuery += ' AND (p.project_name LIKE ? OR p.description LIKE ?)';
      } else {
        baseQuery += ' WHERE (p.project_name LIKE ? OR p.description LIKE ?)';
      }
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const isPaging = filters.page && filters.limit;
    let totalCount = 0;
    
    if (isPaging) {
      const countQuery = 'SELECT COUNT(*) as count ' + baseQuery;
      const [countRows] = await pool.execute(countQuery, params);
      totalCount = parseInt(countRows[0].count, 10) || 0;
    }

    let selectQuery = 'SELECT p.* ' + baseQuery + ' ORDER BY p.created_at DESC';

    if (isPaging) {
      const page = parseInt(filters.page, 10) || 1;
      const limit = parseInt(filters.limit, 10) || 10;
      const offset = (page - 1) * limit;
      selectQuery += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const [rows] = await pool.execute(selectQuery, params);
    rows.forEach(row => {
      if (row.permissions) {
        try {
          row.permissions = JSON.parse(row.permissions);
        } catch (err) {
          row.permissions = null;
        }
      }
    });

    if (isPaging) {
      return { rows, totalCount };
    }
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM projects WHERE id = ?', [id]);
    if (rows[0] && rows[0].permissions) {
      try {
        rows[0].permissions = JSON.parse(rows[0].permissions);
      } catch (err) {
        rows[0].permissions = null;
      }
    }
    return rows[0];
  }

  async create(projectData) {
    const { project_name, project_key, description, status, created_by, priority, deadline, permissions } = projectData;
    const key = project_key || project_name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substring(0, 5)
      .toUpperCase() || `PRJ-${Date.now()}`;
    
    let permissionsStr = null;
    if (permissions) {
      permissionsStr = typeof permissions === 'string' ? permissions : JSON.stringify(permissions);
    }

    const [, result] = await pool.execute(
      'INSERT INTO projects (project_name, project_key, description, status, created_by, priority, deadline, permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
      [project_name, key, description, status || 'active', created_by, priority || null, deadline || null, permissionsStr]
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
    if (projectData.priority !== undefined) {
      fields.push('priority = ?');
      params.push(projectData.priority);
    }
    if (projectData.deadline !== undefined) {
      fields.push('deadline = ?');
      params.push(projectData.deadline);
    }
    if (projectData.permissions !== undefined) {
      fields.push('permissions = ?');
      const pStr = typeof projectData.permissions === 'string' ? projectData.permissions : JSON.stringify(projectData.permissions);
      params.push(pStr);
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
        SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as critical_defects,
        SUM(CASE WHEN due_date < NOW() AND status NOT IN ('Resolved', 'Verified', 'Closed') THEN 1 ELSE 0 END) as overdue_defects
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

  async getMembers(projectId) {
    const [rows] = await pool.execute(
      `SELECT pm.user_id as id, u.full_name, u.email, pm.project_role as role
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = ?`,
      [projectId]
    );
    return rows;
  }

  async addMember(projectId, userId, role) {
    // Check if member exists, insert or update
    const exists = await this.isMember(projectId, userId);
    if (exists) {
      await pool.execute(
        'UPDATE project_members SET project_role = ? WHERE project_id = ? AND user_id = ?',
        [role, projectId, userId]
      );
    } else {
      await pool.execute(
        'INSERT INTO project_members (project_id, user_id, project_role) VALUES (?, ?, ?)',
        [projectId, userId, role]
      );
    }
    return true;
  }

  async removeMember(projectId, userId) {
    await pool.execute(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );
    return true;
  }

  async transferOwnership(projectId, newOwnerId) {
    await pool.execute(
      'UPDATE projects SET created_by = ? WHERE id = ?',
      [newOwnerId, projectId]
    );
    return true;
  }
}

module.exports = new ProjectRepository();
