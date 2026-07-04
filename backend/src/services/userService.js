const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');
const cloudinary = require('../config/cloudinary');

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
    return userRepository.findAll(filters);
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);
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

    return userRepository.update(id, userData);
  }
}

module.exports = new UserService();
