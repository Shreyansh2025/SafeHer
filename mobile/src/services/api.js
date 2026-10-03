import axios from 'axios';
import { API_URL } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

let authFailureHandler = null;

export const setAuthFailureHandler = (handler) => {
  authFailureHandler = handler;

  return () => {
    if (authFailureHandler === handler) {
      authFailureHandler = null;
    }
  };
};

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
  async (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    // Only handle 401 for authenticated/protected requests.
    // Do not logout the current session because of a failed login attempt.
    const isAuthRequest =
      requestUrl.includes('/login') ||
      requestUrl.includes('/register');

    if (status === 401 && !isAuthRequest) {
      try {
        await AsyncStorage.multiRemove([
          'token',
          'user',
        ]);
      } catch (storageError) {
        console.error(
          'Error clearing auth storage:',
          storageError
        );
      }

      if (authFailureHandler) {
        authFailureHandler();
      }
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
};

// Profile APIs
export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  delete: () => api.delete('/profile'),
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
