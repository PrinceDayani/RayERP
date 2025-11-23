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
    
    // Add auth token if available and valid
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Fix for URL path handling
    if (config.url) {
      config.url = config.url.replace(/([^:])\/\//g, '₹1/');
    }
    
    // Add timeout to prevent hanging requests
    config.timeout = 10000; // 10 seconds
    
    // Ensure proper headers for CORS
    config.headers['Accept'] = 'application/json';
    config.headers['Cache-Control'] = 'no-cache';
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Enhanced error logging for network issues
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('🔴 Network Error Details:', {
        message: 'Cannot connect to backend server',
        apiUrl: API_URL,
        possibleCauses: [
          'Backend server is not running',
          'CORS configuration issue',
          'Firewall blocking connection',
          'Wrong API URL in environment'
        ],
        solutions: [
          'Check if backend is running on port 5000',
          'Verify NEXT_PUBLIC_API_URL in .env.local',
          'Check browser console for CORS errors'
        ]
      });
      
      // Create a more user-friendly error
      const networkError = new Error('Network Error: This might be a CORS issue. Check server configuration.');
      networkError.name = 'NetworkError';
      return Promise.reject(networkError);
    }
    
    // Handle CORS errors specifically
    if (error.message?.includes('CORS') || error.code === 'ERR_BLOCKED_BY_CLIENT') {
      console.error('🔴 CORS Error:', {
        message: 'Request blocked by CORS policy',
        url: error.config?.url,
        method: error.config?.method,
        origin: window.location.origin
      });
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem("auth-token");
      window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

export default api;