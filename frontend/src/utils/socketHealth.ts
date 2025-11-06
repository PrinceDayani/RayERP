// Socket health check utility
export const checkServerHealth = async (apiUrl: string): Promise<boolean> => {
  try {
    // Validate URL to prevent SSRF attacks
    const url = new URL(`${apiUrl}/api/health`);
    
    // Only allow localhost and specific domains in development
    const allowedHosts = ['localhost', '127.0.0.1'];
    if (!allowedHosts.includes(url.hostname)) {
      console.warn('Invalid host for health check:', url.hostname);
      return false;
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch (error) {
    console.warn('Health check failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

export const waitForServer = async (apiUrl: string, maxAttempts = 5): Promise<boolean> => {
  try {
    for (let i = 0; i < maxAttempts; i++) {
      if (await checkServerHealth(apiUrl)) return true;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    return false;
  } catch (error) {
    console.warn('Wait for server failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};