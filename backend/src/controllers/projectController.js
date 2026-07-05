const projectService = require('../services/projectService');

class ProjectController {
  async getAllProjects(req, res, next) {
    try {
      const filters = {
        ...req.query,
        user_id: req.user.id,
        role: req.user.role
      };
      const result = await projectService.getAllProjects(filters);
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
      const project = await projectService.updateProject(req.params.id, req.body, req.user);
      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req, res, next) {
    try {
      await projectService.deleteProject(req.params.id, req.user);
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

  async getProjectMembers(req, res, next) {
    try {
      const members = await projectService.getProjectMembers(req.params.id);
      res.json({ success: true, data: members });
    } catch (error) {
      next(error);
    }
  }

  async addProjectMember(req, res, next) {
    try {
      const { user_id, role } = req.body;
      await projectService.addProjectMember(req.params.id, user_id, role, req.user.id);
      res.json({ success: true, message: 'Member added/updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async removeProjectMember(req, res, next) {
    try {
      await projectService.removeProjectMember(req.params.id, req.params.userId, req.user.id);
      res.json({ success: true, message: 'Member removed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async transferOwnership(req, res, next) {
    try {
      const { user_id } = req.body;
      await projectService.transferOwnership(req.params.id, user_id, req.user.id);
      res.json({ success: true, message: 'Project ownership transferred successfully' });
    } catch (error) {
      next(error);
    }
  }

  async changeProjectManager(req, res, next) {
    try {
      const { user_id } = req.body;
      await projectService.changeProjectManager(req.params.id, user_id, req.user.id);
      res.json({ success: true, message: 'Project manager updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getProjectActivities(req, res, next) {
    try {
      const activities = await projectService.getProjectActivities(req.params.id);
      res.json({ success: true, data: activities });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProjectController();
