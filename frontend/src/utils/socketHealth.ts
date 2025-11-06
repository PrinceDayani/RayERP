// Socket health check utility
export const checkServerHealth = async (apiUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(`${apiUrl}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const waitForServer = async (apiUrl: string, maxAttempts = 5): Promise<boolean> => {
  for (let i = 0; i < maxAttempts; i++) {
    if (await checkServerHealth(apiUrl)) return true;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return false;
};