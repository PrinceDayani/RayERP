// path: frontend/src/lib/api.ts
import axios from "axios";

// Use environment variable for API URL - no defaults
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Validate API_URL is set
if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL environment variable is not set");
}

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
    
    // Debug output to verify token is found
    if (token) {
      console.log("Adding auth token to request:", config.url);
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log("No auth token found for request:", config.url);
    }
    
    // Fix for URL path handling
    if (config.url) {
      // Ensure no double slashes in URL paths (except http:// and https://)
      config.url = config.url.replace(/([^:])\/\//g, '$1/');
    }
    
    console.log(`API URL being used: ${config.baseURL}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If the error is a network error (like CORS), log it clearly
    if (error.message === 'Network Error') {
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