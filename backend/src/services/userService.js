const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');

class UserService {
  async getAllUsers(filters) {
    return userRepository.findAll(filters);
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async updateUser(id, userData, requestUser) {
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

    return userRepository.update(id, userData);
  }
}

module.exports = new UserService();
