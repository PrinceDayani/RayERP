const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
}

// Import device fingerprinting
import { getFingerprintHeader } from './deviceFingerprint';

interface FetchOptions extends Omit<RequestInit, 'cache'> {
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

interface ApiError extends Error {
  status?: number;
  code?: string;
}

class ApiClient {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private pendingRequests = new Map<string, Promise<any>>();
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => { this.isOnline = true; });
      window.addEventListener('offline', () => { this.isOnline = false; });
    }
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    // Tokens are now in HTTP-only cookies, managed by browser
    // This method is kept for backward compatibility but returns null
    return null;
  }

  private getCacheKey(url: string, options: RequestInit): string {
    return `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || '')}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  private setCache(key: string, data: any, ttl = 300000): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  private async fetchWithTimeout(url: string, options: FetchOptions = {}): Promise<Response> {
    const { timeout = 30000, retries = 2, cache = false, ...fetchOptions } = options;
    
    if (!this.isOnline) {
      throw new Error('No internet connection');
    }

    const cacheKey = this.getCacheKey(url, fetchOptions);
    
    if (cache && fetchOptions.method === 'GET') {
      const cached = this.getFromCache(cacheKey);
      if (cached) return new Response(JSON.stringify(cached), { status: 200 });
      
      const pending = this.pendingRequests.get(cacheKey);
      if (pending) return pending;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const executeRequest = async (): Promise<Response> => {
      let lastError: Error | null = null;

      for (let i = 0; i <= retries; i++) {
        try {
          const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (cache && response.ok && fetchOptions.method === 'GET') {
            const data = await response.clone().json();
            this.setCache(cacheKey, data);
          }
          
          return response;
        } catch (error) {
          lastError = error as Error;
          if (i < retries && error instanceof Error && error.name !== 'AbortError') {
            await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, i), 5000)));
            continue;
          }
          throw error;
        }
      }
      throw lastError;
    };

    const promise = executeRequest();
    if (cache && fetchOptions.method === 'GET') {
      this.pendingRequests.set(cacheKey, promise);
      promise.finally(() => this.pendingRequests.delete(cacheKey));
    }

    return promise;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      let errorCode = response.status.toString();
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorCode = errorData.code || errorCode;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }

      const error = new Error(errorMessage) as ApiError;
      error.status = response.status;
      error.code = errorCode;
      throw error;
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    return response.text() as any;
  }

  private async request<T>(method: string, endpoint: string, data?: any, options: FetchOptions = {}): Promise<T> {
    // Token is automatically sent via HTTP-only cookies
    const isFormData = data instanceof FormData;
    
    const requestOptions: FetchOptions = {
      ...options,
      method,
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        'X-Requested-With': 'XMLHttpRequest',
        // Add device fingerprint header
        'X-Fingerprint': getFingerprintHeader(),
        ...options.headers
      },
      credentials: 'include' // Always include cookies
    };

    if (data && method !== 'GET') {
      requestOptions.body = isFormData ? data : JSON.stringify(data);
    }

    try {
      const response = await this.fetchWithTimeout(`${API_URL}${endpoint}`, requestOptions);
      return this.handleResponse<T>(response);
    } catch (error: any) {
      // If 401 and not already on refresh endpoint, try to refresh token
      if (error.status === 401 && !endpoint.includes('/refresh') && !endpoint.includes('/login')) {
        try {
          // Attempt to refresh the access token
          const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (refreshResponse.ok) {
            // Retry the original request
            const retryResponse = await this.fetchWithTimeout(`${API_URL}${endpoint}`, requestOptions);
            return this.handleResponse<T>(retryResponse);
          } else {
            // Refresh failed, redirect to login
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            throw error;
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw error;
        }
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, { cache: true, ...options });
  }

  async post<T>(endpoint: string, data?: any, options?: FetchOptions): Promise<T> {
    return this.request<T>('POST', endpoint, data, options);
  }

  async put<T>(endpoint: string, data?: any, options?: FetchOptions): Promise<T> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  async patch<T>(endpoint: string, data?: any, options?: FetchOptions): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  async delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  async upload<T>(endpoint: string, file: File | FormData, options?: FetchOptions): Promise<T> {
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) formData.append('file', file);
    return this.request<T>('POST', endpoint, formData, options);
  }

  clearCache(): void {
    this.cache.clear();
  }

  getConnectionStatus(): boolean {
    return this.isOnline;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', { timeout: 5000, retries: 0 });
      return true;
    } catch {
      return false;
    }
  }
}

export const apiClient = new ApiClient();
export { API_URL };
export type { ApiError, FetchOptions };
