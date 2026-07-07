const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const notificationRepository = require('../repositories/notificationRepository');
const { generateToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

class AuthService {
  async register(userData) {
    const existing = await userRepository.findByEmail(userData.email);
    if (existing) {
      throw new AppError('Email already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await userRepository.create({
      ...userData,
      password: hashedPassword,
      role: userData.role || 'tester',
    });

    const token = generateToken(user);
    return { user, token };
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    
    // Check match
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        if (user.role === 'super_admin' || user.role === 'admin') {
          await notificationRepository.notifyAdminsAndManagers(
            'failed_login_attempt',
            'Security Alert: Failed Login Attempt',
            `A failed login attempt was detected for admin account "${email}".`,
            user.id
          );
        }
        throw new AppError('Invalid email or password', 401);
      }
    } else {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login timestamp in db
    await userRepository.update(user.id, { last_login: new Date() });

    const { password: _, ...userWithoutPassword } = user;
    // Set status to Active upon logging in
    userWithoutPassword.status = user.status || 'Active';
    userWithoutPassword.last_login = new Date();
    
    // Trigger admin login notification
    if (userWithoutPassword.role === 'super_admin' || userWithoutPassword.role === 'admin') {
      await notificationRepository.notifyAdminsAndManagers(
        'admin_login',
        'Security Notice: Admin Login',
        `Admin account "${userWithoutPassword.full_name}" logged in from connection.`,
        userWithoutPassword.id
      );
    }

    const token = generateToken(userWithoutPassword);
    return { user: userWithoutPassword, token };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const userWithPassword = await userRepository.findByEmail(user.email);
    if (!userWithPassword) {
      throw new AppError('User not found', 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, userWithPassword.password);
    if (!isMatch) {
      throw new AppError('Incorrect current password', 400);
    }

    // Password Complexity Validation
    if (!newPassword || newPassword.length < 6 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      throw new AppError('Password must be at least 6 characters, and contain uppercase, lowercase, numbers, and special characters', 400);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await userRepository.update(userId, { 
      password: hashedNewPassword,
      token_invalid_before: new Date()
    });

    if (user.role === 'super_admin' || user.role === 'admin') {
      await notificationRepository.notifyAdminsAndManagers(
        'admin_password_changed',
        'Security Alert: Password Changed',
        `Admin "${user.full_name}" has updated their password.`,
        userId
      );
    }

    return { success: true };
  }

  async logoutAll(userId) {
    await userRepository.update(userId, { token_invalid_before: new Date() });
    return { success: true };
  }

  async getPublicStats() {
    const pool = require('../config/database');
    const [projectsCount] = await pool.execute('SELECT COUNT(*) as count FROM projects');
    const [usersCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [defectsCount] = await pool.execute('SELECT COUNT(*) as count FROM issues');
    const [resolvedCount] = await pool.execute("SELECT COUNT(*) as count FROM issues WHERE status = 'Resolved'");
    const [openCount] = await pool.execute("SELECT COUNT(*) as count FROM issues WHERE status = 'Open'");
    const [criticalCount] = await pool.execute("SELECT COUNT(*) as count FROM issues WHERE severity = 'Critical'");

    return {
      totalProjects: parseInt(projectsCount[0].count, 10) || 0,
      totalUsers: parseInt(usersCount[0].count, 10) || 0,
      totalDefects: parseInt(defectsCount[0].count, 10) || 0,
      resolvedDefects: parseInt(resolvedCount[0].count, 10) || 0,
      openDefects: parseInt(openCount[0].count, 10) || 0,
      criticalDefects: parseInt(criticalCount[0].count, 10) || 0
    };
  }

  async createInquiry(inquiryData) {
    const { name, email, subject, message } = inquiryData;
    if (!name || !email || !subject || !message) {
      throw new AppError('All inquiry fields are required', 400);
    }
    const pool = require('../config/database');
    await pool.execute(
      'INSERT INTO contact_inquiries (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject, message]
    );
    return { success: true };
  }
}

module.exports = new AuthService();
