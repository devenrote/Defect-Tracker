const notificationRepository = require('../repositories/notificationRepository');

class NotificationService {
  async getNotifications(userId) {
    return notificationRepository.findByUserId(userId);
  }

  async getUnreadCount(userId) {
    return notificationRepository.getUnreadCount(userId);
  }

  async markAsRead(id, userId) {
    return notificationRepository.markAsRead(id, userId);
  }

  async markAllAsRead(userId) {
    return notificationRepository.markAllAsRead(userId);
  }
}

module.exports = new NotificationService();
