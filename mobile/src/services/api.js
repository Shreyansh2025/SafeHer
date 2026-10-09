import axios from "axios";
import { API_URL } from "../utils/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

let authFailureHandler = null;

export const setAuthFailureHandler = (handler) => {
  authFailureHandler = handler;

  return () => {
    if (authFailureHandler === handler) {
      authFailureHandler = null;
    }
  };
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    const isAuthRequest =
      requestUrl.includes("/login") || requestUrl.includes("/register");

    if (status === 401 && !isAuthRequest) {
      try {
        await AsyncStorage.multiRemove(["token", "user", "accountType"]);
      } catch (storageError) {
        console.error("Error clearing auth storage:", storageError);
      }

      if (authFailureHandler) {
        authFailureHandler();
      }
    }

    return Promise.reject(error);
  },
);

export const authAPI = {
  register: (data) => api.post("/register", data),
  login: (data) => api.post("/login", data),
  google: (idToken) => api.post('/auth/google', { idToken }),
};

export const adminAPI = {
  login: (data) => api.post("/admin/login", data),
  getActiveEmergencies: () => api.get("/admin/allactive/emergency"),
  getHistory: (params = {}) => api.get("/admin/emergencies", { params }),
  getUsers: () => api.get("/admin/users"),
};

export const profileAPI = {
  get: () => api.get("/profile"),
  update: (data) => api.put("/profile", data),
  delete: () => api.delete("/profile"),
};

export const contactAPI = {
  getAll: () => api.get("/emergency-Contact"),
  getById: (id) => api.get(`/emergency-Contact/${id}`),
  create: (data) => api.post("/emergency-Contact", data),
  update: (id, data) => api.put(`/emergency-Contact/${id}`, data),
  delete: (id) => api.delete(`/emergency-Contact/${id}`),
};

export const emergencyAPI = {
  getAll: () => api.get("/emergency"),
  trigger: (data) => api.post("/emergency/trigger", data),
  resolve: (id) => api.put(`/emergency/${id}/resolve`),
};

export const notificationAPI = {
  getForContact: (contactId) => api.get(`/notifications/${contactId}`),
};

export default api;
