const pool = require('../config/database');

class PublicService {
  async getStats() {
    const [reportedRows] = await pool.execute('SELECT COUNT(*) as count FROM issues');
    const [activeRows] = await pool.execute("SELECT COUNT(*) as count FROM users WHERE status = 'Active'");
    const [resolvedRows] = await pool.execute("SELECT COUNT(*) as count FROM issues WHERE status IN ('Verified', 'Resolved')");

    return {
      reportedDefects: parseInt(reportedRows[0].count, 10) || 0,
      activeUsers: parseInt(activeRows[0].count, 10) || 0,
      verifiedResolved: parseInt(resolvedRows[0].count, 10) || 0
    };
  }

  async createContactMessage(data) {
    const { name, email, subject, message } = data;
    await pool.execute(
      'INSERT INTO contact_messages (full_name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject, message]
    );
    return true;
  }
}

module.exports = new PublicService();
