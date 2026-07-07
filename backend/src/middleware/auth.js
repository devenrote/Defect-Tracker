const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const userRepository = require('../repositories/userRepository');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Access denied. No token provided.', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from DB to check status and session validity
    const dbUser = await userRepository.findById(decoded.id);
    if (!dbUser) {
      return next(new AppError('User no longer exists.', 401));
    }

    if (dbUser.status === 'Disabled') {
      return next(new AppError('Your account has been deactivated.', 401));
    }

    // Invalidation check (Logout from all devices / password changed)
    if (dbUser.token_invalid_before) {
      const invalidBefore = new Date(dbUser.token_invalid_before).getTime();
      const tokenIssuedAt = decoded.iat * 1000;
      if (tokenIssuedAt < invalidBefore) {
        return next(new AppError('Session expired. Please log in again.', 401));
      }
    }

    req.user = {
      ...decoded,
      role: dbUser.role === 'super_admin' ? 'admin' : dbUser.role
    };
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Access denied', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

module.exports = { authenticate, authorize };
