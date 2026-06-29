const pool = require('../config/database');

class CommentRepository {
  async findByDefectId(defectId) {
    const [rows] = await pool.execute(
      `SELECT c.*, u.full_name as user_name, u.role as user_role
       FROM issue_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.issue_id = ?
       ORDER BY c.created_at ASC`,
      [defectId]
    );
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT c.*, u.full_name as user_name
       FROM issue_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [id]
    );
    return rows[0];
  }

  async create(commentData) {
    const { defect_id, user_id, comment } = commentData;
    const [, result] = await pool.execute(
      'INSERT INTO issue_comments (issue_id, user_id, comment) VALUES (?, ?, ?) RETURNING id',
      [defect_id, user_id, comment]
    );
    return this.findById(result.rows[0].id);
  }

  async update(id, comment) {
    await pool.execute('UPDATE issue_comments SET comment = ? WHERE id = ?', [comment, id]);
    return this.findById(id);
  }

  async delete(id) {
    await pool.execute('DELETE FROM issue_comments WHERE id = ?', [id]);
    return true;
  }
}

module.exports = new CommentRepository();
