import axios from 'axios';
import { API_URL } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
};

// Emergency Contact APIs
export const contactAPI = {
  getAll: () => api.get('/emergency-Contact'),
  getById: (id) => api.get(`/emergency-Contact/${id}`),
  create: (data) => api.post('/emergency-Contact', data),
  update: (id, data) => api.put(`/emergency-Contact/${id}`, data),
  delete: (id) => api.delete(`/emergency-Contact/${id}`),
};

// Emergency (SOS) APIs
export const emergencyAPI = {
  getAll: () => api.get('/emergency'),
  trigger: (data) => api.post('/emergency/trigger', data),
  resolve: (id) => api.put(`/emergency/${id}/resolve`),
};

// Notification APIs
export const notificationAPI = {
  getForContact: (contactId) => api.get(`/notifications/${contactId}`),
};

export default api;
