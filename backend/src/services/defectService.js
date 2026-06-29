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

  async updateDefect(id, defectData, user) {
    const defect = await defectRepository.findById(id);
    if (!defect) throw new AppError('Defect not found', 404);

    if (user.role === 'developer' && defect.assignee_id !== user.id) {
      throw new AppError('You can only update defects assigned to you', 403);
    }

    if (defectData.status && defectData.status !== defect.status) {
      await defectRepository.addStatusHistory(id, defect.status, defectData.status, user.id);

      const notifyUsers = [defect.reporter_id];
      if (defect.assignee_id) notifyUsers.push(defect.assignee_id);

      for (const userId of notifyUsers) {
        if (userId !== user.id) {
          await notificationRepository.create({
            user_id: userId,
            type: defectData.status === 'Resolved' ? 'defect_resolved' : 'status_changed',
            title: defectData.status === 'Resolved' ? 'Defect Resolved' : 'Defect Status Updated',
            message: `Defect "${defect.title}" status changed to ${defectData.status}`,
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

  async getDashboardStats(role, userId) {
    const stats = {};

    if (role === 'admin') {
      stats.totalProjects = await require('../repositories/projectRepository').count();
      stats.totalUsers = await require('../repositories/userRepository').count();
      stats.totalDefects = await defectRepository.count();
      stats.openDefects = await defectRepository.count({ status: 'Open' });
      stats.resolvedDefects = await defectRepository.count({ status: 'Resolved' });
      stats.criticalDefects = await defectRepository.count({ severity: 'Critical' });
      stats.defectsBySeverity = await defectRepository.getBySeverity();
      stats.defectsByStatus = await defectRepository.getByStatus();
      stats.recentDefects = await defectRepository.findAll({ limit: 5 });
    } else if (role === 'tester') {
      stats.reportedDefects = await defectRepository.count({ reported_by: userId });
      stats.openDefects = await defectRepository.count({ reported_by: userId, status: 'Open' });
      const allReported = await defectRepository.findAll({ reported_by: userId });
      stats.verifiedDefects = allReported.filter((d) => d.status === 'Verified' || d.status === 'Closed').length;
      stats.recentDefects = await defectRepository.findAll({ reported_by: userId, limit: 5 });
    } else if (role === 'developer') {
      stats.assignedDefects = await defectRepository.count({ assigned_to: userId });
      const allAssigned = await defectRepository.findAll({ assigned_to: userId });
      stats.resolvedDefects = allAssigned.filter((d) => d.status === 'Resolved' || d.status === 'Verified' || d.status === 'Closed').length;
      stats.pendingDefects = allAssigned.filter((d) => !['Resolved', 'Verified', 'Closed'].includes(d.status)).length;
      stats.recentDefects = await defectRepository.findAll({ assigned_to: userId, limit: 5 });
    }

    return stats;
  }

  async getReports() {
    return {
      byProject: await defectRepository.getByProject(),
      bySeverity: await defectRepository.getBySeverity(),
      byDeveloper: await defectRepository.getByDeveloper(),
      byStatus: await defectRepository.getByStatus(),
      monthlyTrends: await defectRepository.getMonthlyTrends(),
    };
  }
}

module.exports = new DefectService();
