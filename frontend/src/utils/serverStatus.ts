// Server status checker utility
export const checkServerStatus = async (): Promise<{
  isRunning: boolean;
  message: string;
  details?: any;
}> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${apiUrl}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return {
        isRunning: true,
        message: 'Backend server is running',
        details: data
      };
    } else {
      return {
        isRunning: false,
        message: `Server responded with status ${response.status}`,
        details: { status: response.status, statusText: response.statusText }
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        isRunning: false,
        message: 'Connection timeout - server may not be running on port 5000'
      };
    }
    
    return {
      isRunning: false,
      message: 'Failed to connect to backend server',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Log server status to console
export const logServerStatus = async (): Promise<void> => {
  const status = await checkServerStatus();
  
  if (status.isRunning) {
    console.log('✅', status.message, status.details);
  } else {
    console.warn('❌', status.message, status.details);
    console.warn('💡 To start the backend server:');
    console.warn('   1. Navigate to the backend directory');
    console.warn('   2. Run: npm install');
    console.warn('   3. Run: npm run dev');
  }
};