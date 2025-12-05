const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
}

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

const fetchWithTimeout = async (url: string, options: FetchOptions = {}): Promise<Response> => {
  const { timeout = 30000, retries = 2, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let lastError: Error | null = null;

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error as Error;
      if (i < retries && error instanceof Error && error.name !== 'AbortError') {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }

  throw lastError;
};

export const apiClient = {
  get: async (endpoint: string, options: FetchOptions = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
    
    const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
      ...options,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  },

  post: async (endpoint: string, data: any, options: FetchOptions = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
    
    const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }
};

export { API_URL };
