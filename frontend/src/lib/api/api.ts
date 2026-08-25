// path: frontend/src/lib/api.ts
import axios from "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    /**
     * Set on requests where a 401 means "the credential in this request body
     * was wrong", not "your session expired". Suppresses the automatic logout
     * and redirect in handleFinalError.
     */
    skipAuthRedirect?: boolean;
  }
}

// Use environment variable for API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Validate API_URL is set (only in browser)
if (typeof window !== 'undefined' && !API_URL) {
  console.error('NEXT_PUBLIC_API_URL environment variable is not set');
}

// Create an Axios instance with proper baseURL
const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("auth-token");
      
      // Add auth token if available and valid
      if (token && token !== 'null' && token !== 'undefined') {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Fix for URL path handling
    if (config.url) {
      config.url = config.url.replace(/([^:])\/\//g, '$1/');
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

// Response interceptor to handle authentication errors and retries
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // Retry logic with exponential backoff
    if (!config || config.__retryCount >= 3) {
      return handleFinalError(error);
    }
    
    config.__retryCount = config.__retryCount || 0;
    
    // Retry on network errors or 5xx errors
    const shouldRetry = !error.response || 
      (error.response.status >= 500 && error.response.status < 600) ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK';
    
    if (shouldRetry) {
      config.__retryCount += 1;
      const delay = Math.min(1000 * Math.pow(2, config.__retryCount), 10000);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(config);
    }
    
    return handleFinalError(error);
  }
);

// Codes the auth middleware uses when the session itself is no longer usable,
// as opposed to a 401 that merely rejects a credential in the request body.
const SESSION_ERROR_CODES = [
  'SESSION_INVALID',
  'SESSION_IDLE_TIMEOUT',
  'INVALID_TOKEN_TYPE',
  'DEVICE_MISMATCH'
];

/**
 * True when a rejected request means the user must sign in again. Callers that
 * set skipAuthRedirect use this to decide whether to send the user to login or
 * just show the server's message.
 */
export const isSessionExpiredError = (error: any): boolean =>
  error?.response?.status === 401 && SESSION_ERROR_CODES.includes(error?.response?.data?.code);

function handleFinalError(error: any) {
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
      origin: typeof window !== 'undefined' ? window.location.origin : 'server'
    });
  }
  
  // A 401 normally means the session is gone, so we clear it and bounce to
  // login. Some endpoints also answer 401 to mean "that credential you just
  // typed was wrong" (a mis-typed current password, a bad 2FA code) while the
  // session itself is perfectly valid. Those callers opt out via
  // skipAuthRedirect so a typo cannot sign the user out.
  if (
    error.response?.status === 401 &&
    !error.config?.skipAuthRedirect &&
    typeof window !== 'undefined'
  ) {
    localStorage.removeItem("auth-token");
    window.location.href = "/login";
  }

  return Promise.reject(error);
}

// Helper function for API requests
export const apiRequest = async (url: string, options?: any) => {
  const response = await api(url, options);
  return response.data;
};

export default api;
