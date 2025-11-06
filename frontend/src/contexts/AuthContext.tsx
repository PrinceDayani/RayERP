import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
export enum UserRole {
  ROOT = 'root',
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  NORMAL = 'normal'
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  error: string | null;
  isLoading: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  hasMinimumRole: (requiredRole: UserRole) => boolean;
  updateUserRole: (newRole: string) => void;
  checkAuth: () => Promise<boolean>;
  backendAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth-token');
    if (savedToken) {
      setToken(savedToken);
      getCurrentUser(savedToken);
    } else {
      setInitialLoading(false);
    }
  }, []);

  // Socket connection and roleUpdated listener
  useEffect(() => {
    let socket: Socket | null = null;
    
    if (isAuthenticated && token && user) {
      try {
        socket = io(API_URL, {
          forceNew: true,
          transports: ['polling', 'websocket'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          upgrade: true
        });
        
        socket.on('connect', () => {
          socket?.emit('authenticate', token);
        });
        
        socket.on('roleUpdated', (data: { userId: string; newRole: string }) => {
          if (data.userId === user._id) {
            updateUserRole(data.newRole);
          }
        });
        
        socket.on('connect_error', (error) => {
          // Silently handle socket errors
        });
        
        socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
        });
      } catch (error) {
        console.warn('Socket initialization failed:', error);
      }
    }
    
    return () => {
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
    };
  }, [isAuthenticated, token, user?._id]);

  const getCurrentUser = async (authToken: string) => {
    try {
      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          // Invalid response format
          localStorage.removeItem('auth-token');
          setToken(null);
          setIsAuthenticated(false);
        }
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('auth-token');
        setToken(null);
        setIsAuthenticated(false);
      }
    } catch (err: any) {
      console.error('Error getting current user:', err);
      
      // Handle specific error types
      if (err.name === 'AbortError') {
        console.error('Request timed out - backend server may not be running');
        setBackendAvailable(false);
        setError('Connection timeout. Please check if the backend server is running.');
      } else if (err.message === 'Failed to fetch') {
        console.error('Network error - check if backend server is running on', API_URL);
        setBackendAvailable(false);
        setError(`Cannot connect to backend server at ${API_URL}. Please ensure the server is running.`);
      } else {
        setBackendAvailable(true);
      }
      
      // Clear auth state on any error
      localStorage.removeItem('auth-token');
      setToken(null);
      setIsAuthenticated(false);
    } finally {
      setInitialLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        setToken(data.token);
        setIsAuthenticated(true);
        localStorage.setItem('auth-token', data.token);
        
        // Log login activity
        try {
          const { logActivity } = await import('@/lib/activityLogger');
          await logActivity({
            action: 'login',
            resource: 'auth',
            details: `User ${data.user.email} logged in successfully`,
            status: 'success'
          });
        } catch (error) {
          console.error('Failed to log login activity:', error);
        }
        
        return true;
      } else {
        setError(data.message || 'Login failed');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Check if this is initial setup
      const setupResponse = await fetch(`${API_URL}/api/auth/initial-setup`);
      const setupData = await setupResponse.json();
      const isInitialSetup = setupData.isInitialSetup;
      
      // Use appropriate endpoint
      const endpoint = isInitialSetup ? '/api/auth/initial-setup' : '/api/auth/register';
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return true;
      } else {
        setError(data.message || 'Registration failed');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Log logout activity before clearing state
      if (user) {
        try {
          const { logActivity } = await import('@/lib/activityLogger');
          await logActivity({
            action: 'logout',
            resource: 'auth',
            details: `User ${user.email} logged out`,
            status: 'success'
          });
        } catch (error) {
          console.error('Failed to log logout activity:', error);
        }
      }
      
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      localStorage.removeItem('auth-token');
    }
  };

  const hasMinimumRole = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    
    const roleHierarchy = {
      [UserRole.NORMAL]: 0,
      [UserRole.ADMIN]: 1,
      [UserRole.SUPER_ADMIN]: 2,
      [UserRole.ROOT]: 3
    };
    
    const userRoleLevel = roleHierarchy[user.role as UserRole] ?? 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] ?? 0;
    
    return userRoleLevel >= requiredRoleLevel;
  };

  const updateUserRole = (newRole: string) => {
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  const checkAuth = async (): Promise<boolean> => {
    const savedToken = localStorage.getItem('auth-token');
    if (!savedToken) return false;
    
    try {
      // Add timeout for checkAuth as well
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${savedToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          setToken(savedToken);
          setIsAuthenticated(true);
          return true;
        }
      }
      
      localStorage.removeItem('auth-token');
      setToken(null);
      setIsAuthenticated(false);
      return false;
    } catch (err: any) {
      console.error('Auth check failed:', err);
      
      // Handle specific error types
      if (err.name === 'AbortError') {
        console.error('Auth check timed out');
      } else if (err.message === 'Failed to fetch') {
        console.error('Network error during auth check');
      }
      
      localStorage.removeItem('auth-token');
      setToken(null);
      setIsAuthenticated(false);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      register, 
      error, 
      isLoading,
      loading: initialLoading || isLoading,
      isAuthenticated,
      hasMinimumRole,
      updateUserRole,
      checkAuth,
      backendAvailable
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
