import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

import toast from 'react-hot-toast';

// Global auth failure handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401: Unauthorized / Token Expired
    if (error.response?.status === 401) {
      localStorage.removeItem("token");

      // Fixed ID prevents duplicate toasts if many requests fail at once
      toast.error("Session expired. Please log in again.", { id: 'session-expired' });

      // Only redirect if running in dashboard (browser), not extension background potentially
      if (window.location.pathname !== "/login") {
        // Small delay to let toast show
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      }
    }

    // 500 or Network Error
    if (error.response?.status >= 500 || error.code === 'ERR_NETWORK') {
      toast.error("Network error. Please try again later.", { id: 'network-error' });
    }

    return Promise.reject(error);
  }
);

export default api;
