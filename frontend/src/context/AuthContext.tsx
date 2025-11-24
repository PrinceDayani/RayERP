//frontend\src\context\AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Define user roles
export enum UserRole {
  ROOT = 'root',
  SUPER_ADMIN = 'superadmin',
  ADMIN = 'admin',
  NORMAL = 'normal'
}

interface User {
  _id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  error: string | null;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
  hasMinimumRole: (minimumRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Use environment variable for API URL - no defaults
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  const buildApiUrl = (path: string): string => {
    if (!apiUrl) {
      throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
    }
    const base = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  };
  
  console.log("API URL being used:", apiUrl);

  // Function to get role value for comparison
  const getRoleValue = (role: UserRole): number => {
    const roleHierarchy = {
      [UserRole.ROOT]: 4,
      [UserRole.SUPER_ADMIN]: 3,
      [UserRole.ADMIN]: 2,
      [UserRole.NORMAL]: 1,
    };
    return roleHierarchy[role] || 0;
  };

  // Check if user has permission based on their role
  const hasPermission = (requiredRoles: UserRole[]): boolean => {
    if (!user) return false;
    return requiredRoles.includes(user.role as UserRole);
  };

  // Check if user has at least the minimum required role in hierarchy
  const hasMinimumRole = (minimumRole: UserRole): boolean => {
    if (!user) return false;
    const userRoleValue = getRoleValue(user.role as UserRole);
    const requiredRoleValue = getRoleValue(minimumRole);
    return userRoleValue >= requiredRoleValue;
  };
  
  // Check if user is authenticated on initial load
  useEffect(() => {
    const initAuth = async () => {
      // First try to get user from localStorage
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('auth-token');

      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          setLoading(false);
          
          // Verify with server in background
          checkAuth();
        } catch (error) {
          console.error("Error parsing stored user:", error);
          checkAuth();
        }
      } else {
        checkAuth();
      }
    };

    initAuth();
  }, []);

  const checkAuth = async (): Promise<boolean> => {
    try {
      console.log("Checking authentication status...");
      
      // Add token from localStorage if available
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      const token = localStorage.getItem('auth-token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log("Including auth token in request");
      } else {
        console.log("No auth token found in localStorage");
      }
  
      // Use the full URL to avoid any path resolution issues
      const fullUrl = buildApiUrl('/api/auth/me');
      console.log("Making auth check request to:", fullUrl);
  
      const response = await fetch(fullUrl, {
        method: 'GET',
        credentials: 'include',
        headers,
        // Adding mode: 'cors' to ensure CORS is handled properly in production
        mode: 'cors'
      });
  
      console.log("Auth check response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("User data received:", data);
          
        // Store user data both in state and localStorage
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
          
        // If we get a token in response, store it
        if (data.token) {
          console.log("Received new token from server");
          localStorage.setItem('auth-token', data.token);
        }
          
        setIsAuthenticated(true);
        setLoading(false);
        return true;
      } else {
        console.log("Not authenticated, response status:", response.status);
        
        // Try to log response body for debugging
        try {
          const errorData = await response.text();
          console.log("Error response:", errorData);
        } catch (e) {
          console.log("Could not read error response");
        }
        
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
        localStorage.removeItem('auth-token');
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      localStorage.removeItem('auth-token');
      setLoading(false);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const loginUrl = buildApiUrl('/api/auth/login');
      console.log(`Attempting login for: ${email}`);
      console.log(`Login request URL: ${loginUrl}`);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      console.log("Login response status:", response.status);
      console.log("Login response headers:", Object.fromEntries(response.headers.entries()));
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error("Non-JSON response received:", responseText);
        throw new Error('Server returned invalid response format. Please check server logs.');
      }
      
      const data = await response.json();
      console.log("Login response data:", data);

      if (!response.ok) {
        throw new Error(data.message || `Login failed with status ${response.status}`);
      }

      // Validate response structure
      if (!data.user || !data.user._id) {
        console.error("Invalid user data in response:", data);
        throw new Error('Invalid user data received from server');
      }

      // Save user in state
      setUser(data.user);
      setIsAuthenticated(true);
      
      // Also save in localStorage as a backup
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Save token if present
      if (data.token) {
        localStorage.setItem('auth-token', data.token);
      }
      
      console.log('Login successful, redirecting to dashboard');
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || 'Login failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const signup = async (name: string, email: string, password: string, role?: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      // Determine the endpoint based on whether we're doing initial setup or regular registration
      const endpoint = isAuthenticated 
      ? buildApiUrl('/api/auth/register')
      : buildApiUrl('/api/auth/initial-setup');

      console.log(`Attempting signup at: ${endpoint}`);
      
      const registerData: any = { name, email, password };
      if (role) {
        registerData.role = role;
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization token if the user is already authenticated
      const token = localStorage.getItem('auth-token');
      if (isAuthenticated && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(registerData),
      });
  
      console.log("Response status:", response.status);
      
      // Check content type before parsing JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes('application/json')) {
        // If not JSON, log the actual response text
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error(`Server returned non-JSON response (${response.status})`);
      }
  
      const data = await response.json();
      console.log("Response data:", data);
  
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
  
      if (isAuthenticated) {
        // If already authenticated, just stay on the current page (likely admin adding a user)
        return;
      } else {
        // If it's the first user being created, auto-login
        if (data.user && data.token) {
          setUser(data.user);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('auth-token', data.token);
          router.push('/dashboard');
        } else {
          // Otherwise, go to login page
          router.push('/login?registered=true');
        }
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error.message || 'Signup failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log("Attempting logout");
     await fetch(buildApiUrl('/api/auth/logout'), {
  method: 'POST',
  credentials: 'include',
});
      // Clear everything
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      localStorage.removeItem('auth-token');
      
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      
      // Still clear local data even if server logout fails
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      localStorage.removeItem('auth-token');
      
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        isAuthenticated, 
        login, 
        signup, 
        logout, 
        checkAuth, 
        error, 
        hasPermission, 
        hasMinimumRole 
      }}
    >
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
