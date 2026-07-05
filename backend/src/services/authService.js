const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
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
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login timestamp in db
    await userRepository.update(user.id, { last_login: new Date() });

    const { password: _, ...userWithoutPassword } = user;
    // Set status to Active upon logging in
    userWithoutPassword.status = user.status || 'Active';
    userWithoutPassword.last_login = new Date();
    
    const token = generateToken(userWithoutPassword);
    return { user: userWithoutPassword, token };
  }
}

module.exports = new AuthService();
