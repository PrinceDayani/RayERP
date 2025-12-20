const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Silent API client that doesn't log errors to console
export const silentApiClient = {
  get: async (endpoint: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
      console.log('GET Request:', `${API_URL}${endpoint}`);
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      const result = await response.json();
      console.log('GET Response Status:', response.status, result);
      
      if (!response.ok) {
        console.error('GET Failed:', response.status, result);
        return result; // Return error response instead of null
      }
      
      return result;
    } catch (error) {
      console.error('GET Error:', error);
      return null;
    }
  },

  post: async (endpoint: string, data: any) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
      console.log('POST Request:', `${API_URL}${endpoint}`, data);
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      console.log('POST Response Status:', response.status, result);
      
      if (!response.ok) {
        console.error('POST Failed:', response.status, result);
        return result; // Return error response instead of null
      }
      
      return result;
    } catch (error) {
      console.error('POST Error:', error);
      return null;
    }
  },

  put: async (endpoint: string, data: any) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(data)
      });
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  },

  delete: async (endpoint: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  }
};