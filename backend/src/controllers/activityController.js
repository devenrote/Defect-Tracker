const activityRepository = require('../repositories/activityRepository');

class ActivityController {
  async getActivities(req, res, next) {
    try {
      const filters = { ...req.query };
      // Restrict developers to their own actions
      if (req.user.role === 'developer') {
        filters.user_id = req.user.id;
      }
      const activities = await activityRepository.findActivities(filters);
      res.json({ success: true, data: activities });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ActivityController();
