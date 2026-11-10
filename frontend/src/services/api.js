import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add access token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campusx_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: automatically refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('campusx_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccess = res.data.access;
          localStorage.setItem('campusx_access_token', newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('campusx_access_token');
          localStorage.removeItem('campusx_refresh_token');
          localStorage.removeItem('campusx_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (data) => api.post('/auth/register/', data),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.put('/auth/profile/', data),
  getDepartments: () => api.get('/departments/'),
  getFaculty: () => api.get('/faculty/'),
};

export const eventsAPI = {
  getAll: (params) => api.get('/events/', { params }),
  getFeatured: () => api.get('/events/featured/'),
  getCalendar: (params) => api.get('/events/calendar/', { params }),
  getById: (id) => api.get(`/events/${id}/`),
  create: (data) => api.post('/events/', data),
  update: (id, data) => api.put(`/events/${id}/`, data),
  partialUpdate: (id, data) => api.patch(`/events/${id}/`, data),
  delete: (id) => api.delete(`/events/${id}/`),
  saveToggle: (id) => api.post(`/events/${id}/save_toggle/`),
  submitApproval: (id) => api.post(`/events/${id}/submit_for_approval/`),
  approve: (id) => api.post(`/events/${id}/approve/`),
  reject: (id, data) => api.post(`/events/${id}/reject/`, data),
  getCategories: () => api.get('/categories/'),
  createCategory: (data) => api.post('/categories/', data),
  getVenues: () => api.get('/venues/'),
  createVenue: (data) => api.post('/venues/', data),
};

export const clubsAPI = {
  getAll: () => api.get('/clubs/'),
  getById: (id) => api.get(`/clubs/${id}/`),
  join: (id) => api.post(`/clubs/${id}/join/`),
  leave: (id) => api.post(`/clubs/${id}/leave/`),
  getMembers: (id) => api.get(`/clubs/${id}/members/`),
  getAnnouncements: (id) => api.get(`/clubs/${id}/announcements/`),
  createClub: (data) => api.post('/clubs/', data),
  updateClub: (id, data) => api.put(`/clubs/${id}/`, data),
  deleteClub: (id) => api.delete(`/clubs/${id}/`),
};

export const registrationsAPI = {
  register: (eventId) => api.post('/registrations/', { event_id: eventId }),
  getMyRegistrations: (params) => api.get('/registrations/', { params }),
  cancel: (id) => api.post(`/registrations/${id}/cancel/`),
  getSavedEvents: () => api.get('/saved-events/'),
};

export const attendanceAPI = {
  verifyTicket: (data) => api.post('/attendance/verify/', data),
  getRecords: (params) => api.get('/attendance/', { params }),
};

export const budgetsAPI = {
  getBudgets: (params) => api.get('/budgets/', { params }),
  getExpenses: (params) => api.get('/expenses/', { params }),
  createExpense: (data) => api.post('/expenses/', data),
  deleteExpense: (id) => api.delete(`/expenses/${id}/`),
  exportCSVUrl: `${API_BASE_URL}/expenses/export_csv/`,
  getSponsorships: (params) => api.get('/sponsorships/', { params }),
  approveSponsorship: (id) => api.post(`/sponsorships/${id}/approve/`),
  rejectSponsorship: (id) => api.post(`/sponsorships/${id}/reject/`),
};

export const certificatesAPI = {
  getMyCertificates: (params) => api.get('/certificates/', { params }),
  downloadPDF: (id) => `${API_BASE_URL}/certificates/${id}/download/`,
  verifyPublic: (certId) => api.get(`/certificates/verify/${certId}/`),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications/'),
  getUnreadCount: () => api.get('/notifications/unread_count/'),
  markRead: (id) => api.post(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/read-all/'),
};

export const reportsAPI = {
  getPublicStats: () => api.get('/stats/public/'),
  getStudentStats: () => api.get('/stats/student/'),
  getOrganizerStats: () => api.get('/stats/organizer/'),
  getAdminStats: () => api.get('/stats/admin/'),
  getAdminUsers: (params) => api.get('/admin/users/', { params }),
  toggleUserStatus: (userId) => api.post(`/admin/users/${userId}/toggle-status/`),
  getAdminLogs: () => api.get('/admin/logs/'),
};

export const galleryAPI = {
  getAlbums: () => api.get('/albums/'),
  getImages: (params) => api.get('/images/', { params }),
};

export default api;
