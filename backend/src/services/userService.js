const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');
const cloudinary = require('../config/cloudinary');
const pool = require('../config/database');
const notificationRepository = require('../repositories/notificationRepository');

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'Defect-Tracker/avatars', resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });
};

class UserService {
  async getAllUsers(filters) {
    const result = await userRepository.findAll(filters);
    const usersList = result.rows || result;
    for (const u of usersList) {
      const [projRows] = await pool.execute(
        `SELECT p.id, p.project_name
         FROM project_members pm
         JOIN projects p ON pm.project_id = p.id
         WHERE pm.user_id = ?`,
        [u.id]
      );
      u.assignedProjects = projRows || [];
    }
    return result;
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);
    const [projRows] = await pool.execute(
      `SELECT p.id, p.project_name
       FROM project_members pm
       JOIN projects p ON pm.project_id = p.id
       WHERE pm.user_id = ?`,
      [user.id]
    );
    user.assignedProjects = projRows || [];
    return user;
  }

  async createUser(userData) {
    const existing = await userRepository.findByEmail(userData.email);
    if (existing) {
      throw new AppError('Email already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await userRepository.create({
      ...userData,
      password: hashedPassword,
      status: userData.status || 'Active'
    });

    await notificationRepository.notifyAdminsAndManagers(
      'user_created',
      'New User Created',
      `New user "${user.full_name}" (${user.role}) has joined the workspace.`,
      user.id
    );

    return user;
  }

  async updateUser(id, userData, requestUser, file) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);

    if (requestUser.role !== 'admin' && requestUser.id !== id) {
      throw new AppError('You can only update your own profile', 403);
    }

    if (userData.role && requestUser.role !== 'admin') {
      throw new AppError('Only admins can change roles', 403);
    }

    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    if (file) {
      try {
        userData.avatar = await uploadToCloudinary(file);
      } catch (cloudinaryError) {
        console.error('Avatar upload to Cloudinary failed:', cloudinaryError.message);
      }
    }

    if (userData.role && userData.role !== user.role) {
      await notificationRepository.notifyAdminsAndManagers(
        'role_changed',
        'User Role Changed',
        `User "${user.full_name}" role has been changed from ${user.role} to ${userData.role} by ${requestUser.full_name}.`,
        user.id
      );
    }

    if (userData.status && userData.status !== user.status) {
      await notificationRepository.notifyAdminsAndManagers(
        'user_status_changed',
        'User Status Updated',
        `User "${user.full_name}" status has been changed from ${user.status} to ${userData.status} by ${requestUser.full_name}.`,
        user.id
      );
    }

    return userRepository.update(id, userData);
  }
}

module.exports = new UserService();
