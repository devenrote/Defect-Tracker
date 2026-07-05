const pool = require('../config/database');

class UserRepository {
  async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, full_name, email, role, avatar, status, last_login, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  async findAll(filters = {}) {
    let baseQuery = 'FROM users WHERE 1=1';
    const params = [];

    if (filters.role) {
      baseQuery += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.status) {
      baseQuery += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      baseQuery += ' AND (full_name LIKE ? OR email LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const isPaging = filters.page && filters.limit;
    let totalCount = 0;

    if (isPaging) {
      const countQuery = 'SELECT COUNT(*) as count ' + baseQuery;
      const [countRows] = await pool.execute(countQuery, params);
      totalCount = parseInt(countRows[0].count, 10) || 0;
    }

    let orderClause = 'ORDER BY created_at DESC';
    if (filters.sortBy === 'name_asc') {
      orderClause = 'ORDER BY full_name ASC';
    } else if (filters.sortBy === 'name_desc') {
      orderClause = 'ORDER BY full_name DESC';
    } else if (filters.sortBy === 'joined_desc') {
      orderClause = 'ORDER BY created_at DESC';
    } else if (filters.sortBy === 'login_desc') {
      orderClause = 'ORDER BY last_login DESC';
    }

    let selectQuery = 'SELECT id, full_name, email, role, avatar, status, last_login, created_at ' + baseQuery + ' ' + orderClause;

    if (isPaging) {
      const page = parseInt(filters.page, 10) || 1;
      const limit = parseInt(filters.limit, 10) || 10;
      const offset = (page - 1) * limit;
      selectQuery += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const [rows] = await pool.execute(selectQuery, params);
    
    if (isPaging) {
      return { rows, totalCount };
    }
    return rows;
  }

  async create(userData) {
    const { full_name, email, password, role, status } = userData;
    const [, result] = await pool.execute(
      'INSERT INTO users (full_name, email, password, role, status) VALUES (?, ?, ?, ?, ?) RETURNING id',
      [full_name, email, password, role, status || 'Active']
    );
    return this.findById(result.rows[0].id);
  }

  async update(id, userData) {
    const fields = [];
    const params = [];

    if (userData.full_name) {
      fields.push('full_name = ?');
      params.push(userData.full_name);
    }
    if (userData.email) {
      fields.push('email = ?');
      params.push(userData.email);
    }
    if (userData.password) {
      fields.push('password = ?');
      params.push(userData.password);
    }
    if (userData.role) {
      fields.push('role = ?');
      params.push(userData.role);
    }
    if (userData.avatar) {
      fields.push('avatar = ?');
      params.push(userData.avatar);
    }
    if (userData.status) {
      fields.push('status = ?');
      params.push(userData.status);
    }
    if (userData.last_login !== undefined) {
      fields.push('last_login = ?');
      params.push(userData.last_login);
    }

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async count() {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM users');
    return rows[0].count;
  }
}

module.exports = new UserRepository();
