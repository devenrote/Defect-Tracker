import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  logoutAll: () => api.post('/auth/logout-all'),
  getSessionInfo: () => api.get('/auth/session-info'),
  getPublicStats: () => api.get('/auth/public-stats'),
  submitInquiry: (data) => api.post('/auth/contact-inquiry', data),
};

export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/users/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.put(`/users/${id}`, data);
  },
  generateApiKey: () => api.post('/users/api-key'),
};

export const projectAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getStatistics: (id) => api.get(`/projects/${id}/statistics`),
  getMembers: (id) => api.get(`/projects/${id}/members`),
  addMember: (id, userId, role) => api.post(`/projects/${id}/members`, { user_id: userId, role }),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
  transferOwnership: (id, userId) => api.put(`/projects/${id}/owner`, { user_id: userId }),
  changeManager: (id, userId) => api.put(`/projects/${id}/manager`, { user_id: userId }),
  getActivities: (id) => api.get(`/projects/${id}/activities`),
};

export const defectAPI = {
  getAll: (params) => api.get('/defects', { params }),
  getById: (id) => api.get(`/defects/${id}`),
  create: (data) => {
    if (data instanceof FormData) {
      return api.post('/defects', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.post('/defects', data);
  },
  update: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/defects/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.put(`/defects/${id}`, data);
  },
  delete: (id) => api.delete(`/defects/${id}`),
  getDashboardStats: (params) => api.get('/defects/dashboard/stats', { params }),
  getReports: () => api.get('/defects/reports'),
  uploadAttachment: (id, data) => api.post(`/defects/${id}/attachments`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const commentAPI = {
  getByDefect: (defectId) => api.get(`/comments/${defectId}`),
  create: (data) => api.post('/comments', data),
  update: (id, data) => api.put(`/comments/${id}`, data),
  delete: (id) => api.delete(`/comments/${id}`),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  create: (data) => api.post('/notifications', data),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  clearRead: () => api.delete('/notifications/read'),
};

export const activityAPI = {
  getActivities: (params) => api.get('/activities', { params }),
};

export const publicAPI = {
  getStats: () => api.get('/public/stats'),
  submitContact: (data) => api.post('/contact', data),
};

export default api;
