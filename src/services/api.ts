import axios from "axios";

// Base API instance
const api = axios.create({
  baseURL: "", // empty base URL so it requests against current host (which hosts express + vite)
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to dynamically inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("trackme_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unauthorized access
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear token and user on session expiration
      localStorage.removeItem("trackme_token");
      localStorage.removeItem("trackme_user");
      // Let app handle redirection if needed
    }
    return Promise.reject(error);
  }
);

export default api;
