const projectRepository = require('../repositories/projectRepository');
const AppError = require('../utils/AppError');

class ProjectService {
  async getAllProjects(filters) {
    return projectRepository.findAll(filters);
  }

  async getProjectById(id) {
    const project = await projectRepository.findById(id);
    if (!project) throw new AppError('Project not found', 404);
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

  async getProjectStatistics(id) {
    const project = await projectRepository.findById(id);
    if (!project) throw new AppError('Project not found', 404);
    const stats = await projectRepository.getStatistics(id);
    return { project, statistics: stats };
  }
}

module.exports = new ProjectService();
