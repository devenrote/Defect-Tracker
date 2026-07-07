// Role-specific notification filtering services

export const AdminNotificationService = {
  getNotifications: (notifications) => {
    // Admin receives all workspace-level system and defect notifications
    return notifications;
  }
};

export const ManagerNotificationService = {
  getNotifications: (notifications) => {
    // Managers receive all notifications
    return notifications;
  }
};

export const DeveloperNotificationService = {
  getNotifications: (notifications, userId, defects) => {
    // Developers only see notifications where they are assignee, reporter, or general system status alerts
    return notifications.filter(n => {
      // General system alerts are relevant to everyone
      if (!n.issue_id) return true;
      const defect = defects.find(d => d.id === n.issue_id);
      if (defect) {
        const isReportedByMe = Number(defect.reporter_id) === Number(userId);
        const isAssignedToMe = Number(defect.assignee_id) === Number(userId);
        return isReportedByMe || isAssignedToMe;
      }
      return true;
    });
  }
};

export const TesterNotificationService = {
  getNotifications: (notifications, userId, defects, userFullName) => {
    // Testers receive notifications relevant to their reported/assigned defects
    return notifications.filter((n) => {
      const defect = defects.find(d => d.id === n.issue_id);
      if (defect) {
        const isReportedByMe = Number(defect.reporter_id) === Number(userId) || defect.reporter_name === userFullName;
        const isAssignedToMe = Number(defect.assignee_id) === Number(userId) || defect.assignee_name === userFullName;
        if (!isReportedByMe && !isAssignedToMe) return false;
      }
      if (n.type === 'priority_changed' || n.type === 'due_date_changed') return false;
      if (n.type === 'defect_assigned' && defect && defect.assignee_name !== userFullName) return false;
      return true;
    });
  }
};
