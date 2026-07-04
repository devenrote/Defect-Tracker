const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const defectRepository = require('../repositories/defectRepository');
const notificationRepository = require('../repositories/notificationRepository');
const activityRepository = require('../repositories/activityRepository');
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
    const attachments = await defectRepository.getAttachments(id);
    
    const relatedDefects = await defectRepository.findAll({ project_id: defect.project_id });
    const filteredRelated = relatedDefects.filter(d => d.id !== defect.id);

    return { 
      ...defect, 
      status_history: statusHistory, 
      attachments, 
      relatedDefects: filteredRelated 
    };
  }

  async uploadAttachment(defectId, file, user) {
    const defect = await defectRepository.findById(defectId);
    if (!defect) throw new AppError('Defect not found', 404);

    const fileUrl = await uploadToCloudinary(file);
    const [rows] = await require('../config/database').execute(
      'INSERT INTO issue_attachments (issue_id, file_name, file_url, uploaded_by) VALUES (?, ?, ?, ?) RETURNING id',
      [defectId, file.originalname, fileUrl, user.id]
    );
    
    // Log activity
    await activityRepository.logActivity(
      user.id,
      `Uploaded attachment: ${file.originalname}`,
      'issue',
      defectId
    );

    const uploadedResult = await require('../config/database').execute(
      'SELECT a.*, u.full_name as uploaded_by_name FROM issue_attachments a LEFT JOIN users u ON a.uploaded_by = u.id WHERE a.id = ?',
      [rows[0].id]
    );

    return uploadedResult[0][0];
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
      
      // Log activity
      await activityRepository.logActivity(
        user.id,
        `Assigned defect: ${defect.title}`,
        'issue',
        defect.id
      );
    }

    return defect;
  }

  async updateDefect(id, defectData, file, user) {
    const defect = await defectRepository.findById(id);
    if (!defect) throw new AppError('Defect not found', 404);

    // Limit Developer role permissions
    if (user.role === 'developer') {
      if (Number(defect.assignee_id) !== Number(user.id)) {
        throw new AppError('You can only update defects assigned to you', 403);
      }
      
      const restrictedFields = ['project_id', 'title', 'description', 'severity', 'priority', 'issue_type'];
      for (const f of restrictedFields) {
        if (defectData[f] !== undefined && defectData[f] !== defect[f]) {
          throw new AppError(`Developers cannot modify the field: ${f}`, 403);
        }
      }

      if (defectData.status && defectData.status !== defect.status) {
        const developerStatuses = ['Assigned', 'Analysis Started', 'In Progress', 'Ready For QA', 'Resolved'];
        if (!developerStatuses.includes(defectData.status)) {
          throw new AppError(`Developers cannot transition status to "${defectData.status}"`, 403);
        }
      }
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
      
      // Log activity on status update
      await activityRepository.logActivity(
        user.id,
        `Status Changed to ${defectData.status}`,
        'issue',
        id
      );

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

    if (defectData.assigned_to !== undefined && defectData.assigned_to !== defect.assignee_id) {
      defectData.assigned_by = user.id;
      await defectRepository.addHistory(id, 'assigned_to', defect.assignee_id, defectData.assigned_to, user.id);

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
      
      await activityRepository.logActivity(
        user.id,
        `Defect reassigned`,
        'issue',
        id
      );
    }

    // Detect and log developer resolution workspace field modifications
    if (defectData.root_cause !== undefined && defectData.root_cause !== defect.root_cause) {
      await defectRepository.addHistory(id, 'root_cause', defect.root_cause, defectData.root_cause, user.id);
      await activityRepository.logActivity(user.id, 'Root Cause Updated', 'issue', id);
    }
    if (defectData.solution !== undefined && defectData.solution !== defect.solution) {
      await defectRepository.addHistory(id, 'solution', defect.solution, defectData.solution, user.id);
      await activityRepository.logActivity(user.id, 'Fix Summary Updated', 'issue', id);
    }
    if (defectData.tech_notes !== undefined && defectData.tech_notes !== defect.tech_notes) {
      await defectRepository.addHistory(id, 'tech_notes', defect.tech_notes, defectData.tech_notes, user.id);
      await activityRepository.logActivity(user.id, 'Developer Notes Updated', 'issue', id);
    }
    if (defectData.checklist !== undefined && defectData.checklist !== defect.checklist) {
      await defectRepository.addHistory(id, 'checklist', defect.checklist, defectData.checklist, user.id);
      await activityRepository.logActivity(user.id, 'Checklist Updated', 'issue', id);
    }
    if (defectData.files_modified !== undefined && defectData.files_modified !== defect.files_modified) {
      await defectRepository.addHistory(id, 'files_modified', defect.files_modified, defectData.files_modified, user.id);
      await activityRepository.logActivity(user.id, 'Files Modified Updated', 'issue', id);
    }
    if (defectData.estimated_time !== undefined && defectData.estimated_time !== defect.estimated_time) {
      await defectRepository.addHistory(id, 'estimated_time', defect.estimated_time, defectData.estimated_time, user.id);
    }
    if (defectData.actual_time !== undefined && defectData.actual_time !== defect.actual_time) {
      await defectRepository.addHistory(id, 'actual_time', defect.actual_time, defectData.actual_time, user.id);
    }
    if (defectData.is_resolution_save) {
      await defectRepository.addHistory(id, 'resolution', null, 'Saved', user.id);
      await activityRepository.logActivity(user.id, 'Resolution Saved', 'issue', id);
    }

    // Log activity on manager workspace field updates
    if (defectData.priority !== undefined && defectData.priority !== defect.priority) {
      await defectRepository.addHistory(id, 'priority', defect.priority, defectData.priority, user.id);
      await activityRepository.logActivity(user.id, `Priority changed to ${defectData.priority}`, 'issue', id);
    }
    if (defectData.due_date !== undefined && defectData.due_date !== defect.due_date) {
      await defectRepository.addHistory(id, 'due_date', defect.due_date, defectData.due_date, user.id);
      await activityRepository.logActivity(user.id, `Due date updated`, 'issue', id);
    }
    if (defectData.sprint !== undefined && defectData.sprint !== defect.sprint) {
      await defectRepository.addHistory(id, 'sprint', defect.sprint, defectData.sprint, user.id);
      await activityRepository.logActivity(user.id, `Sprint updated to ${defectData.sprint}`, 'issue', id);
    }
    if (defectData.story_points !== undefined && defectData.story_points !== defect.story_points) {
      await defectRepository.addHistory(id, 'story_points', defect.story_points, defectData.story_points, user.id);
    }
    if (defectData.estimated_effort !== undefined && defectData.estimated_effort !== defect.estimated_effort) {
      await defectRepository.addHistory(id, 'estimated_effort', defect.estimated_effort, defectData.estimated_effort, user.id);
    }
    if (defectData.assignment_notes !== undefined && defectData.assignment_notes !== defect.assignment_notes) {
      await defectRepository.addHistory(id, 'assignment_notes', defect.assignment_notes, defectData.assignment_notes, user.id);
    }

    // Trigger Notification for due date, priority changes
    if (defectData.due_date && defectData.due_date !== defect.due_date) {
      if (defect.assignee_id && defect.assignee_id !== user.id) {
        await notificationRepository.create({
          user_id: defect.assignee_id,
          type: 'due_date_changed',
          title: 'Due Date Changed',
          message: `Due date for defect "${defect.title}" has been updated.`,
          issue_id: id,
        });
      }
    }
    if (defectData.priority && defectData.priority !== defect.priority) {
      if (defect.assignee_id && defect.assignee_id !== user.id) {
        await notificationRepository.create({
          user_id: defect.assignee_id,
          type: 'priority_changed',
          title: 'Priority Changed',
          message: `Priority for defect "${defect.title}" is now "${defectData.priority}".`,
          issue_id: id,
        });
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
      stats.totalDefects = parseInt(rawReportedDefects, 10) || 0;
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
      
      const rawMonthlyTrend = await defectRepository.getMonthlyTrends({ user_id: userId, role: 'tester', project_id: projectId });
      stats.monthlyTrend = rawMonthlyTrend.map((row) => ({
        month: row.month,
        defects: parseInt(row.count, 10) || 0,
        resolved: 0
      }));

      stats.assignedToMe = [];
    } else if (role === 'developer') {
      const [membersRows] = await require('../config/database').execute(
        'SELECT COUNT(DISTINCT project_id) as count FROM project_members WHERE user_id = ?',
        [userId]
      );
      const rawAssignedDefects = await defectRepository.count({ assigned_to: userId });
      const rawInProgress = await defectRepository.count({ assigned_to: userId, status: 'In Progress' });
      const rawResolved = await defectRepository.count({ assigned_to: userId, status: 'Resolved' });
      const rawCritical = await defectRepository.count({ assigned_to: userId, severity: 'Critical' });
      const rawReopened = await defectRepository.count({ assigned_to: userId, status: 'Reopened' });

      stats.totalProjects = parseInt(membersRows[0].count, 10) || 0;
      stats.totalDefects = parseInt(rawAssignedDefects, 10) || 0;
      stats.inProgressDefects = parseInt(rawInProgress, 10) || 0;
      stats.resolvedDefects = parseInt(rawResolved, 10) || 0;
      stats.criticalDefects = parseInt(rawCritical, 10) || 0;
      stats.reopenedDefects = parseInt(rawReopened, 10) || 0;

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
      
      const allAssigned = await defectRepository.findAll({ assigned_to: userId });
      stats.assignedToMe = allAssigned.filter((d) => !['Resolved', 'Verified', 'Closed'].includes(d.status));
    } else if (role === 'manager' || role === 'project_manager') {
      const dbResult = await require('../config/database').execute(
        'SELECT project_id FROM project_members WHERE user_id = ?',
        [userId]
      );
      const projectIds = dbResult[0].map((r) => parseInt(r.project_id, 10));

      const selectedId = filters.project_id ? parseInt(filters.project_id, 10) : null;
      const targetProjectIds = selectedId ? [selectedId] : projectIds;

      if (targetProjectIds.length === 0) {
        stats.totalProjects = 0;
        stats.totalUsers = 0;
        stats.totalDevelopers = 0;
        stats.totalDefects = 0;
        stats.openDefects = 0;
        stats.inProgressDefects = 0;
        stats.resolvedDefects = 0;
        stats.criticalDefects = 0;
        stats.pendingAssignment = 0;
        stats.readyForQA = 0;
        stats.overdueDefects = 0;
        stats.defectsBySeverity = [];
        stats.defectsByStatus = [];
        stats.recentDefects = [];
        stats.assignedToMe = [];
        stats.pendingAssignmentList = [];
        stats.recentActivities = [];
        stats.monthlyTrend = [];
      } else {
        stats.totalProjects = projectIds.length;
        
        const [usersRows] = await require('../config/database').execute(
          `SELECT COUNT(DISTINCT user_id) as count FROM project_members WHERE project_id IN (${targetProjectIds.join(', ')})`
        );
        stats.totalUsers = parseInt(usersRows[0].count, 10) || 0;

        const [devsRows] = await require('../config/database').execute(
          `SELECT COUNT(DISTINCT pm.user_id) as count 
           FROM project_members pm 
           JOIN users u ON pm.user_id = u.id 
           WHERE pm.project_id IN (${targetProjectIds.join(', ')}) AND u.role = 'developer'`
        );
        stats.totalDevelopers = parseInt(devsRows[0].count, 10) || 0;

        const [defectsRows] = await require('../config/database').execute(
          `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open,
            SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
            SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as critical,
            SUM(CASE WHEN assignee_id IS NULL AND status IN ('Open', 'Reviewed') THEN 1 ELSE 0 END) as pending_assignment,
            SUM(CASE WHEN status = 'Ready For QA' THEN 1 ELSE 0 END) as ready_for_qa,
            SUM(CASE WHEN due_date < NOW() AND status NOT IN ('Resolved', 'Verified', 'Closed') THEN 1 ELSE 0 END) as overdue
          FROM issues WHERE project_id IN (${targetProjectIds.join(', ')})`
        );
        const counts = defectsRows[0];
        stats.totalDefects = parseInt(counts.total, 10) || 0;
        stats.openDefects = parseInt(counts.open, 10) || 0;
        stats.inProgressDefects = parseInt(counts.in_progress, 10) || 0;
        stats.resolvedDefects = parseInt(counts.resolved, 10) || 0;
        stats.criticalDefects = parseInt(counts.critical, 10) || 0;
        stats.pendingAssignment = parseInt(counts.pending_assignment, 10) || 0;
        stats.readyForQA = parseInt(counts.ready_for_qa, 10) || 0;
        stats.overdueDefects = parseInt(counts.overdue, 10) || 0;

        const filterParams = selectedId ? { project_id: selectedId } : { user_id: userId, role: 'manager' };

        stats.defectsBySeverity = await defectRepository.getBySeverity(filterParams).then(res => res.map(row => ({
          severity: row.severity,
          count: parseInt(row.count, 10) || 0
        })));

        stats.defectsByStatus = await defectRepository.getByStatus(filterParams).then(res => res.map(row => ({
          name: row.status,
          count: parseInt(row.count, 10) || 0
        })));

        stats.recentDefects = await defectRepository.findAll({ ...filterParams, limit: 5 });

        // Query pending assignment and assigned to me lists
        const [pendingListRows] = await require('../config/database').execute(
          `SELECT i.*, p.project_name, r.full_name as reporter_name
           FROM issues i
           LEFT JOIN projects p ON i.project_id = p.id
           LEFT JOIN users r ON i.reporter_id = r.id
           WHERE i.project_id IN (${targetProjectIds.join(', ')}) AND i.assignee_id IS NULL AND i.status NOT IN ('Resolved', 'Verified', 'Closed')
           LIMIT 10`
        );
        stats.pendingAssignmentList = pendingListRows;

        const [assignedToMeRows] = await require('../config/database').execute(
          `SELECT i.*, p.project_name, r.full_name as reporter_name
           FROM issues i
           LEFT JOIN projects p ON i.project_id = p.id
           LEFT JOIN users r ON i.reporter_id = r.id
           WHERE i.project_id IN (${targetProjectIds.join(', ')}) AND i.assignee_id = ? AND i.status NOT IN ('Resolved', 'Verified', 'Closed')
           LIMIT 10`,
          [userId]
        );
        stats.assignedToMe = assignedToMeRows;

        // Query recent activity (reports & history)
        const [historyRows] = await require('../config/database').execute(
          `SELECT h.id, h.field_name, h.old_value, h.new_value, h.changed_at,
                  u.full_name as user_name, u.role as user_role,
                  i.id as defect_id, i.title as defect_title
           FROM issue_history h
           JOIN issues i ON h.issue_id = i.id
           JOIN users u ON h.changed_by = u.id
           WHERE i.project_id IN (${targetProjectIds.join(', ')})
           ORDER BY h.changed_at DESC
           LIMIT 10`
        );

        const [reportsRows] = await require('../config/database').execute(
          `SELECT i.id, i.title as defect_title, i.created_at as changed_at,
                  u.full_name as user_name, u.role as user_role
           FROM issues i
           JOIN users u ON i.reporter_id = u.id
           WHERE i.project_id IN (${targetProjectIds.join(', ')})
           ORDER BY i.created_at DESC
           LIMIT 10`
        );

        const reportsActivities = reportsRows.map(r => ({
          id: `report-${r.id}`,
          user_name: r.user_name,
          user_role: r.user_role,
          action: 'reported issue',
          changed_at: r.changed_at,
          defect_id: r.id,
          defect_title: r.defect_title
        }));

        const historyActivities = historyRows.map((h) => {
          let action = 'modified defect';
          const fieldName = h.field_name || 'status';
          const newValue = h.new_value;
          
          if (fieldName === 'status') {
            if (newValue === 'Assigned') action = 'assigned issue';
            else if (newValue === 'Analysis Started') action = 'started analysis';
            else if (newValue === 'In Progress') action = 'started work';
            else if (newValue === 'Ready For QA') action = 'marked Ready For QA';
            else if (newValue === 'Resolved') action = 'marked Resolved';
            else if (newValue === 'Closed') action = 'closed issue';
            else if (newValue === 'Reopened') action = 'reopened issue';
            else action = `changed status to ${newValue}`;
          } else if (fieldName === 'priority') {
            action = `changed priority to ${newValue}`;
          } else if (fieldName === 'assigned_to') {
            action = `assigned issue`;
          } else if (fieldName === 'sprint') {
            action = `updated sprint to ${newValue}`;
          } else if (fieldName === 'due_date') {
            action = `updated due date`;
          }
          
          return {
            id: `hist-${h.id}`,
            user_name: h.user_name,
            user_role: h.user_role,
            action: action,
            changed_at: h.changed_at,
            defect_id: h.defect_id,
            defect_title: h.defect_title
          };
        });

        stats.recentActivities = [...reportsActivities, ...historyActivities]
          .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))
          .slice(0, 10);

        // Fetch monthly trend
        stats.monthlyTrend = await defectRepository.getMonthlyTrends(filterParams);
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
