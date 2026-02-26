import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  getUsers: (params) => api.get('/users', { params }),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// Candidates
export const candidateAPI = {
  getAll: (params) => api.get('/candidates', { params }),
  getOne: (id) => api.get(`/candidates/${id}`),
  create: (data) => api.post('/candidates', data),
  update: (id, data) => api.put(`/candidates/${id}`, data),
  panelDecision: (id, data) => api.post(`/candidates/${id}/panel-decision`, data),
  bulkDecision: (data) => api.post('/candidates/bulk-decision', data),
  scoreInterview: (id, data) => api.post(`/candidates/${id}/score-interview`, data),
  addNote: (id, data) => api.post(`/candidates/${id}/notes`, data),
  searchByPhone: (phone) => api.get('/candidates/search-phone', { params: { phone } }),
  getPipelineStats: () => api.get('/candidates/pipeline-stats'),
};

// Import
export const importAPI = {
  upload: (formData) => api.post('/import/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  process: (data) => api.post('/import/process', data),
  history: () => api.get('/import/history'),
};

// Calls
export const callAPI = {
  log: (data) => api.post('/calls/log', data),
  getQueue: () => api.get('/calls/queue'),
  getHistory: (params) => api.get('/calls/history', { params }),
  getStats: (agentId) => api.get(`/calls/stats/${agentId || ''}`),
};

// Locations
export const locationAPI = {
  getAll: () => api.get('/locations'),
  create: (data) => api.post('/locations', data),
  update: (id, data) => api.put(`/locations/${id}`, data),
  getQuotaDashboard: () => api.get('/locations/quota-dashboard'),
};
