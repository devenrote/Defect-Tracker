const authService = require('../services/authService');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body.email, req.body.password);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async logoutAll(req, res, next) {
    try {
      const result = await authService.logoutAll(req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getSessionInfo(req, res, next) {
    try {
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unavailable';

      let browser = 'Unknown';
      let os = 'Unknown';

      if (/chrome|crios/i.test(userAgent)) {
        browser = 'Chrome';
      } else if (/firefox|fxios/i.test(userAgent)) {
        browser = 'Firefox';
      } else if (/safari/i.test(userAgent)) {
        browser = 'Safari';
      } else if (/opr\//i.test(userAgent)) {
        browser = 'Opera';
      } else if (/edg/i.test(userAgent)) {
        browser = 'Edge';
      }

      if (/windows/i.test(userAgent)) {
        os = 'Windows';
      } else if (/macintosh|mac os x/i.test(userAgent)) {
        os = 'macOS';
      } else if (/linux/i.test(userAgent)) {
        os = 'Linux';
      } else if (/android/i.test(userAgent)) {
        os = 'Android';
      } else if (/iphone|ipad|ipod/i.test(userAgent)) {
        os = 'iOS';
      }

      const currentLogin = req.user.iat ? new Date(req.user.iat * 1000).toISOString() : new Date().toISOString();
      // Use req.user.last_login or default to currentLogin
      const lastLogin = req.user.last_login || currentLogin;

      res.json({
        success: true,
        data: {
          currentLogin,
          lastLogin,
          currentDevice: `${os} Device`,
          browser,
          os,
          ipAddress: ip
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getPublicStats(req, res, next) {
    try {
      const result = await authService.getPublicStats();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async createInquiry(req, res, next) {
    try {
      const result = await authService.createInquiry(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
