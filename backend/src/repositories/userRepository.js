const pool = require('../config/database');

class UserRepository {
  async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, full_name, email, role, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  async findAll(filters = {}) {
    let query = 'SELECT id, full_name, email, role, created_at FROM users WHERE 1=1';
    const params = [];

    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.search) {
      query += ' AND (full_name LIKE ? OR email LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async create(userData) {
    const { full_name, email, password, role } = userData;
    const [, result] = await pool.execute(
      'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?) RETURNING id',
      [full_name, email, password, role]
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
