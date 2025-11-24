// Socket health check utility
export const checkServerHealth = async (apiUrl: string): Promise<boolean> => {
  try {
    // Validate and sanitize URL to prevent SSRF attacks
    if (!apiUrl || typeof apiUrl !== 'string') {
      return false;
    }
    
    const url = new URL(`${apiUrl}/api/health`);
    
    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }
    
    // In production, allow AWS App Runner and other production domains
    if (process.env.NODE_ENV === 'production') {
      // Allow AWS App Runner domains and other production URLs
      const isAwsAppRunner = url.hostname.includes('.awsapprunner.com');
      const isLocalhost = ['localhost', '127.0.0.1'].includes(url.hostname);
      
      if (!isAwsAppRunner && !isLocalhost) {
        // Allow other production domains if needed
        console.warn('Health check: Unknown production domain', url.hostname);
      }
    } else {
      // In development, only allow localhost
      const allowedHosts = ['localhost', '127.0.0.1'];
      if (!allowedHosts.includes(url.hostname)) {
        return false;
      }
      
      // Prevent port scanning by restricting ports in development
      const allowedPorts = ['3000', '5000', '8000', '8080'];
      if (url.port && !allowedPorts.includes(url.port)) {
        return false;
      }
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Health check timeout - server may not be running');
    } else {
      console.warn('Health check failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    return false;
  }
};

export const waitForServer = async (apiUrl: string, maxAttempts = 5): Promise<boolean> => {
  try {
    // Validate input parameters
    if (!apiUrl || typeof apiUrl !== 'string' || maxAttempts < 1) {
      return false;
    }
    
    for (let i = 0; i < maxAttempts; i++) {
      if (await checkServerHealth(apiUrl)) return true;
      // Exponential backoff for better connection stability
      const delay = Math.min(2000 * Math.pow(1.5, i), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return false;
  } catch (error) {
    console.warn('Wait for server failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};
