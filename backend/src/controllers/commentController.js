const commentService = require('../services/commentService');

class CommentController {
  async getComments(req, res, next) {
    try {
      const comments = await commentService.getCommentsByDefectId(req.params.defectId);
      res.json({ success: true, data: comments });
    } catch (error) {
      next(error);
    }
  }

  async createComment(req, res, next) {
    try {
      const comment = await commentService.createComment(req.body, req.user);
      res.status(201).json({ success: true, data: comment });
    } catch (error) {
      next(error);
    }
  }

  async updateComment(req, res, next) {
    try {
      const comment = await commentService.updateComment(req.params.id, req.body.comment, req.user);
      res.json({ success: true, data: comment });
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req, res, next) {
    try {
      await commentService.deleteComment(req.params.id, req.user);
      res.json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CommentController();
