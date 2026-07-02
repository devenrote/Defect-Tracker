const defectService = require('../services/defectService');

class DefectController {
  async getAllDefects(req, res, next) {
    try {
      const filters = {
        ...req.query,
        user_id: req.user.id,
        role: req.user.role
      };
      const defects = await defectService.getAllDefects(filters);
      res.json({ success: true, data: defects });
    } catch (error) {
      next(error);
    }
  }

  async getDefectById(req, res, next) {
    try {
      const defect = await defectService.getDefectById(req.params.id);
      res.json({ success: true, data: defect });
    } catch (error) {
      next(error);
    }
  }

  async createDefect(req, res, next) {
    try {
      const defect = await defectService.createDefect(req.body, req.file, req.user);
      res.status(201).json({ success: true, data: defect });
    } catch (error) {
      next(error);
    }
  }

  async updateDefect(req, res, next) {
    try {
      const defect = await defectService.updateDefect(req.params.id, req.body, req.file, req.user);
      res.json({ success: true, data: defect });
    } catch (error) {
      next(error);
    }
  }

  async deleteDefect(req, res, next) {
    try {
      await defectService.deleteDefect(req.params.id);
      res.json({ success: true, message: 'Defect deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req, res, next) {
    try {
      const stats = await defectService.getDashboardStats(req.user.role, req.user.id, req.query);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getReports(req, res, next) {
    try {
      const reports = await defectService.getReports(req.user);
      res.json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DefectController();
