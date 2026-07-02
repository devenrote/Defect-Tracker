const projectRepository = require('../repositories/projectRepository');
const AppError = require('../utils/AppError');

class ProjectService {
  async getAllProjects(filters) {
    return projectRepository.findAll(filters);
  }

  async getProjectById(id, user) {
    const project = await projectRepository.findById(id);
    if (!project) throw new AppError('Project not found', 404);
    
    if (user && user.role !== 'admin') {
      const isMember = await projectRepository.isMember(id, user.id);
      if (!isMember) throw new AppError('Access denied. You are not assigned to this project.', 403);
    }
    return project;
  }

  async createProject(projectData, user) {
    return projectRepository.create({ ...projectData, created_by: user.id });
  }

  async updateProject(id, projectData) {
    const project = await projectRepository.findById(id);
    if (!project) throw new AppError('Project not found', 404);
    return projectRepository.update(id, projectData);
  }

  async deleteProject(id) {
    const project = await projectRepository.findById(id);
    if (!project) throw new AppError('Project not found', 404);
    return projectRepository.delete(id);
  }

  async getProjectStatistics(id, user) {
    const project = await this.getProjectById(id, user);
    const stats = await projectRepository.getStatistics(id);
    return { project, statistics: stats };
  }
}

module.exports = new ProjectService();
