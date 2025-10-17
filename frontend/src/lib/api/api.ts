// path: frontend/src/lib/api.ts
import axios from "axios";

// Use environment variable for API URL with fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create an Axios instance with proper baseURL
const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth-token");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Fix for URL path handling
    if (config.url) {
      // Ensure no double slashes in URL paths (except http:// and https://)
      config.url = config.url.replace(/([^:])\/\//g, '$1/');
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors silently in production
    if (error.message === 'Network Error' && process.env.NODE_ENV === 'development') {
      console.error('Network Error: This might be a CORS issue. Check server configuration.');
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem("auth-token");
      window.location.href = "/login"; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

export default api;