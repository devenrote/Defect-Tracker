const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const defectRepository = require('../repositories/defectRepository');
const notificationRepository = require('../repositories/notificationRepository');
const AppError = require('../utils/AppError');

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'Defect-Tracker', resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });
};

class DefectService {
  async getAllDefects(filters) {
    return defectRepository.findAll(filters);
  }

  async getDefectById(id) {
    const defect = await defectRepository.findById(id);
    if (!defect) throw new AppError('Defect not found', 404);

    const statusHistory = await defectRepository.getStatusHistory(id);
    return { ...defect, status_history: statusHistory };
  }

  async createDefect(defectData, file, user) {
    let screenshot_url = null;
    if (file) {
      try {
        screenshot_url = await uploadToCloudinary(file);
      } catch (cloudinaryError) {
        console.error('Cloudinary upload failed, falling back to local file storage:', cloudinaryError.message);
        
        try {
          const uploadsDir = path.join(__dirname, '../../uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          
          const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
          const localFilePath = path.join(uploadsDir, uniqueFilename);
          fs.writeFileSync(localFilePath, file.buffer);
          
          const port = process.env.PORT || 5000;
          screenshot_url = `http://localhost:${port}/uploads/${uniqueFilename}`;
        } catch (localFileError) {
          console.error('Local file storage fallback failed:', localFileError.message);
          // Absolute last resort fallback to placeholder
          if (file.mimetype && file.mimetype.startsWith('image/')) {
            screenshot_url = 'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=800';
          } else {
            screenshot_url = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
          }
        }
      }
    }

    const defect = await defectRepository.create({
      ...defectData,
      screenshot_url,
      reported_by: user.id,
      status: defectData.assigned_to ? 'Assigned' : 'Open',
    });

    if (defectData.assigned_to) {
      await defectRepository.addStatusHistory(defect.id, null, 'Assigned', user.id);
      await notificationRepository.create({
        user_id: defectData.assigned_to,
        type: 'defect_assigned',
        title: 'Defect Assigned',
        message: `You have been assigned defect: ${defect.title}`,
        issue_id: defect.id,
      });
    }

    return defect;
  }

  async updateDefect(id, defectData, file, user) {
    const defect = await defectRepository.findById(id);
    if (!defect) throw new AppError('Defect not found', 404);

    if (user.role === 'developer' && defect.assignee_id !== user.id) {
      throw new AppError('You can only update defects assigned to you', 403);
    }

    let screenshot_url = defect.screenshot_url;
    if (file) {
      try {
        screenshot_url = await uploadToCloudinary(file);
      } catch (cloudinaryError) {
        console.error('Cloudinary upload failed, falling back to local file storage:', cloudinaryError.message);
        
        try {
          const uploadsDir = path.join(__dirname, '../../uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          
          const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
          const localFilePath = path.join(uploadsDir, uniqueFilename);
          fs.writeFileSync(localFilePath, file.buffer);
          
          const port = process.env.PORT || 5000;
          screenshot_url = `http://localhost:${port}/uploads/${uniqueFilename}`;
        } catch (localFileError) {
          console.error('Local file storage fallback failed:', localFileError.message);
        }
      }
      defectData.screenshot_url = screenshot_url;
    }

    if (defectData.status && defectData.status !== defect.status) {
      await defectRepository.addStatusHistory(id, defect.status, defectData.status, user.id);

      const notifyUsers = [defect.reporter_id];
      if (defect.assignee_id) notifyUsers.push(defect.assignee_id);

      for (const userId of notifyUsers) {
        if (userId !== user.id) {
          let msg = `Defect "${defect.title}" status changed to ${defectData.status}`;
          let title = 'Defect Status Updated';
          if (defectData.status === 'Closed') {
            msg = `DF-${id} has been verified and closed.`;
            title = 'Defect Verified & Closed';
          } else if (defectData.status === 'Reopened') {
            msg = `DF-${id} has been reopened by Tester.`;
            title = 'Defect Reopened';
          } else if (defectData.status === 'Resolved') {
            title = 'Defect Resolved';
          }

          await notificationRepository.create({
            user_id: userId,
            type: defectData.status === 'Resolved' ? 'defect_resolved' : 'status_changed',
            title: title,
            message: msg,
            issue_id: id,
          });
        }
      }
    }

    if (defectData.assigned_to && defectData.assigned_to !== defect.assignee_id) {
      await notificationRepository.create({
        user_id: defectData.assigned_to,
        type: 'defect_assigned',
        title: 'Defect Assigned',
        message: `You have been assigned defect: ${defect.title}`,
        issue_id: id,
      });
      if (!defectData.status) {
        defectData.status = 'Assigned';
      }
    }

    return defectRepository.update(id, defectData);
  }

  async deleteDefect(id) {
    const defect = await defectRepository.findById(id);
    if (!defect) throw new AppError('Defect not found', 404);
    return defectRepository.delete(id);
  }

  async getDashboardStats(role, userId, filters = {}) {
    const stats = {};
    const projectId = filters.project_id;

    if (role === 'admin') {
      const rawTotalProjects = await require('../repositories/projectRepository').count();
      const rawTotalUsers = await require('../repositories/userRepository').count();
      const rawTotalDefects = await defectRepository.count({ project_id: projectId });
      const rawOpenDefects = await defectRepository.count({ status: 'Open', project_id: projectId });
      const rawResolvedDefects = await defectRepository.count({ status: 'Resolved', project_id: projectId });
      const rawCriticalDefects = await defectRepository.count({ severity: 'Critical', project_id: projectId });

      stats.totalProjects = parseInt(rawTotalProjects, 10) || 0;
      stats.totalUsers = parseInt(rawTotalUsers, 10) || 0;
      stats.totalDefects = parseInt(rawTotalDefects, 10) || 0;
      stats.openDefects = parseInt(rawOpenDefects, 10) || 0;
      stats.resolvedDefects = parseInt(rawResolvedDefects, 10) || 0;
      stats.criticalDefects = parseInt(rawCriticalDefects, 10) || 0;

      const rawBySeverity = await defectRepository.getBySeverity({ project_id: projectId });
      stats.defectsBySeverity = rawBySeverity.map((row) => ({
        severity: row.severity,
        count: parseInt(row.count, 10) || 0
      }));

      const rawByStatus = await defectRepository.getByStatus({ project_id: projectId });
      stats.defectsByStatus = rawByStatus.map((row) => ({
        name: row.status,
        count: parseInt(row.count, 10) || 0
      }));

      stats.recentDefects = await defectRepository.findAll({ project_id: projectId, limit: 5 });
      stats.assignedToMe = await defectRepository.findAll({ status: 'Open', project_id: projectId, limit: 5 });
    } else if (role === 'tester') {
      const rawTotalProjects = await require('../repositories/projectRepository').count();
      const rawReportedDefects = await defectRepository.count({ reported_by: userId, project_id: projectId });
      const rawOpenDefects = await defectRepository.count({ reported_by: userId, status: 'Open', project_id: projectId });
      const rawReopenedDefects = await defectRepository.count({ reported_by: userId, status: 'Reopened', project_id: projectId });
      const rawResolvedDefects = await defectRepository.count({ reported_by: userId, status: 'Resolved', project_id: projectId });
      const rawTestingDefects = await defectRepository.count({ reported_by: userId, status: 'Testing', project_id: projectId });
      const rawClosedDefects = await defectRepository.count({ reported_by: userId, status: 'Closed', project_id: projectId });
      const rawCriticalDefects = await defectRepository.count({ reported_by: userId, severity: 'Critical', project_id: projectId });

      stats.totalProjects = parseInt(rawTotalProjects, 10) || 0;
      stats.totalDefects = parseInt(rawReportedDefects, 10) || 0; // My Reported
      stats.openDefects = (parseInt(rawOpenDefects, 10) || 0) + (parseInt(rawReopenedDefects, 10) || 0);
      stats.pendingVerification = (parseInt(rawResolvedDefects, 10) || 0) + (parseInt(rawTestingDefects, 10) || 0);
      stats.closedDefects = parseInt(rawClosedDefects, 10) || 0;
      stats.criticalDefects = parseInt(rawCriticalDefects, 10) || 0;

      const rawBySeverity = await defectRepository.getBySeverity({ reported_by: userId, project_id: projectId });
      stats.defectsBySeverity = rawBySeverity.map((row) => ({
        severity: row.severity,
        count: parseInt(row.count, 10) || 0
      }));

      const rawByStatus = await defectRepository.getByStatus({ reported_by: userId, project_id: projectId });
      stats.defectsByStatus = rawByStatus.map((row) => ({
        name: row.status,
        count: parseInt(row.count, 10) || 0
      }));

      stats.recentDefects = await defectRepository.findAll({ reported_by: userId, project_id: projectId, limit: 5 });
      
      // Load and map trend
      const rawMonthlyTrend = await defectRepository.getMonthlyTrends({ user_id: userId, role: 'tester', project_id: projectId });
      stats.monthlyTrend = rawMonthlyTrend.map((row) => ({
        month: row.month,
        defects: parseInt(row.count, 10) || 0,
        resolved: 0
      }));

      stats.assignedToMe = [];
    } else if (role === 'developer') {
      const rawTotalProjects = await require('../repositories/projectRepository').count();
      const rawTotalUsers = await require('../repositories/userRepository').count();
      const rawAssignedDefects = await defectRepository.count({ assigned_to: userId });
      const rawOpenDefects = await defectRepository.count({ assigned_to: userId, status: 'Open' });
      const rawCriticalDefects = await defectRepository.count({ assigned_to: userId, severity: 'Critical' });

      const allAssigned = await defectRepository.findAll({ assigned_to: userId });
      const rawResolvedDefects = allAssigned.filter((d) => d.status === 'Resolved' || d.status === 'Verified' || d.status === 'Closed').length;

      stats.totalProjects = parseInt(rawTotalProjects, 10) || 0;
      stats.totalUsers = parseInt(rawTotalUsers, 10) || 0;
      stats.totalDefects = parseInt(rawAssignedDefects, 10) || 0;
      stats.openDefects = parseInt(rawOpenDefects, 10) || 0;
      stats.resolvedDefects = parseInt(rawResolvedDefects, 10) || 0;
      stats.criticalDefects = parseInt(rawCriticalDefects, 10) || 0;

      const rawBySeverity = await defectRepository.getBySeverity({ assigned_to: userId });
      stats.defectsBySeverity = rawBySeverity.map((row) => ({
        severity: row.severity,
        count: parseInt(row.count, 10) || 0
      }));

      const rawByStatus = await defectRepository.getByStatus({ assigned_to: userId });
      stats.defectsByStatus = rawByStatus.map((row) => ({
        name: row.status,
        count: parseInt(row.count, 10) || 0
      }));

      stats.recentDefects = await defectRepository.findAll({ assigned_to: userId, limit: 5 });
      stats.assignedToMe = allAssigned.filter((d) => !['Resolved', 'Verified', 'Closed'].includes(d.status));
    } else if (role === 'manager' || role === 'project_manager') {
      const dbResult = await require('../config/database').execute(
        'SELECT project_id FROM project_members WHERE user_id = ?',
        [userId]
      );
      const projectIds = dbResult[0].map((r) => parseInt(r.project_id, 10));

      if (projectIds.length === 0) {
        stats.totalProjects = 0;
        stats.totalUsers = 0;
        stats.totalDefects = 0;
        stats.openDefects = 0;
        stats.inProgressDefects = 0;
        stats.resolvedDefects = 0;
        stats.criticalDefects = 0;
        stats.defectsBySeverity = [];
        stats.defectsByStatus = [];
        stats.recentDefects = [];
        stats.assignedToMe = [];
      } else {
        stats.totalProjects = projectIds.length;
        
        const [usersRows] = await require('../config/database').execute(
          `SELECT COUNT(DISTINCT user_id) as count FROM project_members WHERE project_id IN (${projectIds.join(', ')})`
        );
        stats.totalUsers = parseInt(usersRows[0].count, 10) || 0;

        const [defectsRows] = await require('../config/database').execute(
          `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open,
            SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
            SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as critical
          FROM issues WHERE project_id IN (${projectIds.join(', ')})`
        );
        const counts = defectsRows[0];
        stats.totalDefects = parseInt(counts.total, 10) || 0;
        stats.openDefects = parseInt(counts.open, 10) || 0;
        stats.inProgressDefects = parseInt(counts.in_progress, 10) || 0;
        stats.resolvedDefects = parseInt(counts.resolved, 10) || 0;
        stats.criticalDefects = parseInt(counts.critical, 10) || 0;

        const rawBySeverity = await defectRepository.getBySeverity({ user_id: userId, role: 'manager' });
        stats.defectsBySeverity = rawBySeverity.map((row) => ({
          severity: row.severity,
          count: parseInt(row.count, 10) || 0
        }));

        const rawByStatus = await defectRepository.getByStatus({ user_id: userId, role: 'manager' });
        stats.defectsByStatus = rawByStatus.map((row) => ({
          name: row.status,
          count: parseInt(row.count, 10) || 0
        }));

        stats.recentDefects = await defectRepository.findAll({ user_id: userId, role: 'manager', limit: 5 });
        stats.assignedToMe = await defectRepository.findAll({ user_id: userId, role: 'manager', status: 'Open' });
      }
    }

    return stats;
  }

  async getReports(user) {
    if (user && user.role !== 'admin') {
      const filter = { user_id: user.id, role: user.role };
      return {
        byProject: await defectRepository.getByProject(filter),
        bySeverity: await defectRepository.getBySeverity(filter),
        byDeveloper: await defectRepository.getByDeveloper(filter),
        byStatus: await defectRepository.getByStatus(filter),
        monthlyTrends: await defectRepository.getMonthlyTrends(filter)
      };
    }

    return {
      byProject: await defectRepository.getByProject(),
      bySeverity: await defectRepository.getBySeverity(),
      byDeveloper: await defectRepository.getByDeveloper(),
      byStatus: await defectRepository.getByStatus(),
      monthlyTrends: await defectRepository.getMonthlyTrends()
    };
  }
}

module.exports = new DefectService();
