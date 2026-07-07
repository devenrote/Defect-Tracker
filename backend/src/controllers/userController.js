const userService = require('../services/userService');

class UserController {
  async getAllUsers(req, res, next) {
    try {
      const result = await userService.getAllUsers(req.query);
      if (req.query.page && req.query.limit) {
        res.json({
          success: true,
          data: result.rows,
          pagination: {
            page: parseInt(req.query.page, 10),
            limit: parseInt(req.query.limit, 10),
            total: result.totalCount
          }
        });
      } else {
        res.json({ success: true, data: result });
      }
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body, req.user, req.file);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async generateApiKey(req, res, next) {
    try {
      const crypto = require('crypto');
      const secureKey = `dt_live_${crypto.randomBytes(24).toString('hex')}`;
      await userService.updateUser(req.user.id, { api_key: secureKey }, req.user);
      
      const notificationRepository = require('../repositories/notificationRepository');
      await notificationRepository.notifyAdminsAndManagers(
        'api_key_regenerated',
        'API Key Regenerated',
        `Admin "${req.user.full_name}" has regenerated the system API key.`,
        req.user.id
      );

      res.json({ success: true, api_key: secureKey });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
