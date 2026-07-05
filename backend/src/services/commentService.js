const commentRepository = require('../repositories/commentRepository');
const notificationRepository = require('../repositories/notificationRepository');
const defectRepository = require('../repositories/defectRepository');
const AppError = require('../utils/AppError');

class CommentService {
  async getCommentsByDefectId(defectId) {
    return commentRepository.findByDefectId(defectId);
  }

  async createComment(commentData, user) {
    const defect = await defectRepository.findById(commentData.defect_id);
    if (!defect) throw new AppError('Defect not found', 404);

    const comment = await commentRepository.create({
      ...commentData,
      user_id: user.id,
    });

    const notifyUsers = [defect.reporter_id];
    if (defect.assignee_id) notifyUsers.push(defect.assignee_id);

    for (const userId of notifyUsers) {
      if (userId !== user.id) {
        await notificationRepository.create({
          user_id: userId,
          type: 'comment_added',
          title: 'Comment Added',
          message: `New comment on defect: ${defect.title}`,
          issue_id: commentData.defect_id,
        });
      }
    }

    // Notify admins and managers
    await notificationRepository.notifyAdminsAndManagers(
      'comment_added',
      'Comment Added',
      `${user.full_name} added a comment on defect DF-${defect.id}: "${defect.title}"`,
      commentData.defect_id
    );

    return comment;
  }

  async updateComment(id, commentText, user) {
    const comment = await commentRepository.findById(id);
    if (!comment) throw new AppError('Comment not found', 404);
    if (comment.user_id !== user.id) {
      throw new AppError('You can only edit your own comments', 403);
    }
    return commentRepository.update(id, commentText);
  }

  async deleteComment(id, user) {
    const comment = await commentRepository.findById(id);
    if (!comment) throw new AppError('Comment not found', 404);
    if (comment.user_id !== user.id && user.role !== 'admin') {
      throw new AppError('You can only delete your own comments', 403);
    }
    return commentRepository.delete(id);
  }
}

module.exports = new CommentService();
