// path: frontend/src/utils/api.ts


// Import unified API configuration
import api from '../lib/api/index';

// Helper function to ensure proper URL formatting

export const getApiUrl = (endpoint: string): string => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL environment variable is not set");
  }
  
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  
  return `${baseUrl}/api/${cleanEndpoint}`;
};

export const fetchData = async (endpoint: string) => {
  try {
    const res = await fetch(getApiUrl(endpoint), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      },
      credentials: 'include' // Important for cookies
    });
    
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("❌ API Fetch Error:", error);
    return null;
  }
};

// Add other utility functions for common operations
export const postData = async (endpoint: string, data: unknown) => {
  try {
    const res = await fetch(getApiUrl(endpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("❌ API Post Error:", error);
    return null;
  }
};

export const putData = async (endpoint: string, data: unknown) => {
  try {
    const res = await fetch(getApiUrl(endpoint), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("❌ API Put Error:", error);
    return null;
  }
};

export const deleteData = async (endpoint: string) => {
  try {
    const res = await fetch(getApiUrl(endpoint), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      },
      credentials: 'include'
    });
    
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("❌ API Delete Error:", error);
    return null;
  }
};

const apiUtils = {
  getApiUrl,
  fetchData,
  postData,
  putData,
  deleteData
};

export default apiUtils;