// Token validation utility
export const tokenValidator = {
  // Check if token exists and is not a string literal 'null' or 'undefined'
  isValidTokenString: (token: string | null): boolean => {
    return !!(token && token !== 'null' && token !== 'undefined' && token.trim() !== '');
  },

  // Get token from localStorage with validation
  getToken: (): string | null => {
    const token = localStorage.getItem('auth-token');
    return tokenValidator.isValidTokenString(token) ? token : null;
  },

  // Clear invalid tokens
  clearInvalidToken: (): void => {
    const token = localStorage.getItem('auth-token');
    if (!tokenValidator.isValidTokenString(token)) {
      localStorage.removeItem('auth-token');
    }
  },

  // Set token with validation
  setToken: (token: string): void => {
    if (tokenValidator.isValidTokenString(token)) {
      localStorage.setItem('auth-token', token);
    }
  }
};
