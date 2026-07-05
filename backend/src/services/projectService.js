const projectRepository = require('../repositories/projectRepository');
const notificationRepository = require('../repositories/notificationRepository');
const activityRepository = require('../repositories/activityRepository');
const pool = require('../config/database');
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
    const project = await projectRepository.create({ ...projectData, created_by: user.id });
    await activityRepository.logActivity(user.id, 'Project Created', 'project', project.id);
    await this.notifyManagers(
      'project_created', 
      'Project Created', 
      `New project "${project.project_name}" was created by ${user.full_name}.`
    );
    return project;
  }

  async updateProject(id, projectData, user = {}) {
    const project = await projectRepository.findById(id);
    if (!project) throw new AppError('Project not found', 404);
    
    const updatedProject = await projectRepository.update(id, projectData);
    
    const userId = user.id || project.created_by;
    if (projectData.status === 'archived') {
      await activityRepository.logActivity(userId, 'Archive Event', 'project', id);
      await this.notifyManagers(
        'project_archived', 
        'Project Archived', 
        `Project "${updatedProject.project_name}" was archived.`
      );
    } else {
      await activityRepository.logActivity(userId, 'Project Updated', 'project', id);
      await this.notifyManagers(
        'project_updated', 
        'Project Updated', 
        `Project "${updatedProject.project_name}" was updated.`
      );
    }
    return updatedProject;
  }

  async deleteProject(id, user = {}) {
    const project = await projectRepository.findById(id);
    if (!project) throw new AppError('Project not found', 404);
    
    const userId = user.id || project.created_by;
    await activityRepository.logActivity(userId, 'Project Deleted', 'project', id);
    const res = await projectRepository.delete(id);
    await this.notifyManagers(
      'project_deleted', 
      'Project Deleted', 
      `Project "${project.project_name}" was deleted.`
    );
    return res;
  }

  async getProjectStatistics(id, user) {
    const project = await this.getProjectById(id, user);
    const stats = await projectRepository.getStatistics(id);
    return { project, statistics: stats };
  }

  async notifyManagers(type, title, message) {
    await notificationRepository.notifyAdminsAndManagers(type, title, message);
  }

  async getProjectMembers(projectId) {
    return projectRepository.getMembers(projectId);
  }

  async addProjectMember(projectId, userId, role, performerId) {
    const res = await projectRepository.addMember(projectId, userId, role);
    let action = 'Member Added';
    if (role === 'manager') action = 'Manager Assigned';
    else if (role === 'developer') action = 'Developer Added';
    else if (role === 'tester') action = 'Tester Added';
    await activityRepository.logActivity(performerId, action, 'project', projectId);

    if (role === 'manager') {
      try {
        const [projRows] = await pool.execute('SELECT project_name FROM projects WHERE id = ?', [projectId]);
        const projectName = projRows.length > 0 ? projRows[0].project_name : 'N/A';
        const [userRows] = await pool.execute('SELECT full_name FROM users WHERE id = ?', [userId]);
        const userName = userRows.length > 0 ? userRows[0].full_name : 'N/A';
        await this.notifyManagers(
          'manager_assigned',
          'Manager Assigned to Project',
          `Manager "${userName}" was assigned to project "${projectName}".`
        );
      } catch (err) {
        console.error('Error triggering manager_assigned notification:', err);
      }
    }
    return res;
  }

  async removeProjectMember(projectId, userId, performerId) {
    let role = 'member';
    try {
      const [memberRows] = await pool.execute('SELECT project_role FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]);
      if (memberRows.length > 0) role = memberRows[0].project_role;
    } catch (e) {}

    const res = await projectRepository.removeMember(projectId, userId);
    await activityRepository.logActivity(performerId, 'Member Removed', 'project', projectId);

    if (role === 'manager') {
      try {
        const [projRows] = await pool.execute('SELECT project_name FROM projects WHERE id = ?', [projectId]);
        const projectName = projRows.length > 0 ? projRows[0].project_name : 'N/A';
        const [userRows] = await pool.execute('SELECT full_name FROM users WHERE id = ?', [userId]);
        const userName = userRows.length > 0 ? userRows[0].full_name : 'N/A';
        await this.notifyManagers(
          'manager_removed',
          'Manager Removed from Project',
          `Manager "${userName}" was removed from project "${projectName}".`
        );
      } catch (err) {
        console.error('Error triggering manager_removed notification:', err);
      }
    }
    return res;
  }

  async transferOwnership(projectId, newOwnerId, performerId) {
    const res = await projectRepository.transferOwnership(projectId, newOwnerId);
    await activityRepository.logActivity(performerId, 'Ownership Transferred', 'project', projectId);
    return res;
  }

  async changeProjectManager(projectId, newManagerUserId, performerId) {
    // 1. Downgrade existing manager(s) to developer
    await pool.execute(
      "UPDATE project_members SET project_role = 'developer' WHERE project_id = ? AND project_role = 'manager'",
      [projectId]
    );
    // 2. Set new manager
    const res = await this.addProjectMember(projectId, newManagerUserId, 'manager', performerId);
    return res;
  }

  async getProjectActivities(projectId) {
    const query = `
      SELECT al.*, u.full_name as user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE (al.entity_type = 'project' AND al.entity_id = ?)
         OR (al.entity_type = 'issue' AND al.entity_id IN (SELECT id FROM issues WHERE project_id = ?))
      ORDER BY al.created_at DESC
    `;
    const [rows] = await pool.execute(query, [projectId, projectId]);
    return rows;
  }
}

module.exports = new ProjectService();
