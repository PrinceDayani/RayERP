// Health check utility to verify backend connectivity
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend health check passed:', data);
      return true;
    } else {
      console.error('❌ Backend health check failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Backend health check error:', error);
    return false;
  }
};

export const checkAuthToken = (): { hasToken: boolean; token?: string } => {
  const token = localStorage.getItem('auth-token');
  return {
    hasToken: !!token,
    token: token || undefined
  };
};

export const validateTokenFormat = (token: string): boolean => {
  // Basic JWT format check (header.payload.signature)
  const parts = token.split('.');
  return parts.length === 3;
};