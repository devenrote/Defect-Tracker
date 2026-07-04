const userService = require('../services/userService');

class UserController {
  async getAllUsers(req, res, next) {
    try {
      const users = await userService.getAllUsers(req.query);
      res.json({ success: true, data: users });
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
}

module.exports = new UserController();
