// Authentication fix utility
export const authFix = {
  // Check if token is valid and not expired
  isTokenValid: (token: string | null): boolean => {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  // Get fresh token or clear invalid one
  getValidToken: (): string | null => {
    const token = localStorage.getItem('auth-token');
    if (authFix.isTokenValid(token)) {
      return token;
    }
    
    // Clear invalid token
    localStorage.removeItem('auth-token');
    return null;
  },

  // Debug authentication state
  debugAuth: () => {
  }
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).authFix = authFix;
}
