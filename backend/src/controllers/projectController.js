const projectService = require('../services/projectService');

class ProjectController {
  async getAllProjects(req, res, next) {
    try {
      const filters = {
        ...req.query,
        user_id: req.user.id,
        role: req.user.role
      };
      const projects = await projectService.getAllProjects(filters);
      res.json({ success: true, data: projects });
    } catch (error) {
      next(error);
    }
  }

  async getProjectById(req, res, next) {
    try {
      const project = await projectService.getProjectById(req.params.id, req.user);
      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  async createProject(req, res, next) {
    try {
      const project = await projectService.createProject(req.body, req.user);
      res.status(201).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req, res, next) {
    try {
      const project = await projectService.updateProject(req.params.id, req.body);
      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req, res, next) {
    try {
      await projectService.deleteProject(req.params.id);
      res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getProjectStatistics(req, res, next) {
    try {
      const stats = await projectService.getProjectStatistics(req.params.id, req.user);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProjectController();
