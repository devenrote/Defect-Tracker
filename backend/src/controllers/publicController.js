const publicService = require('../services/publicService');

class PublicController {
  async getStats(req, res, next) {
    try {
      const stats = await publicService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async createContactMessage(req, res, next) {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Name is required' });
      }
      if (!email || !email.trim()) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, message: 'Valid email is required' });
      }
      if (!subject || !subject.trim()) {
        return res.status(400).json({ success: false, message: 'Subject is required' });
      }
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Message is required' });
      }

      await publicService.createContactMessage({ name, email, subject, message });
      res.json({ success: true, message: 'Inquiry saved successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PublicController();
